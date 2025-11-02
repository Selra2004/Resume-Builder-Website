import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { getConnection } from '../config/database.js';
import { uploadSingle } from '../middleware/upload.js';
import { UploadService } from '../services/uploadService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [userProfile] = await connection.execute(`
    SELECT 
      u.id,
      u.email,
      u.role,
      up.first_name,
      up.last_name,
      up.student_type,
      up.contact_number,
      up.age,
      up.birthdate,
      up.gender,
      up.profile_photo,
      up.profile_completed
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = ?
  `, [req.user!.id]);

  if ((userProfile as any[]).length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = (userProfile as any[])[0];

  // Get user courses
  const [courses] = await connection.execute(`
    SELECT 
      c.id,
      c.course_name,
      c.course_type,
      uc.graduation_status
    FROM user_courses uc
    JOIN courses c ON uc.course_id = c.id
    WHERE uc.user_id = ?
  `, [req.user!.id]);

  res.json({
    ...user,
    profile_photo_url: UploadService.getPhotoUrl(user.profile_photo),
    courses: courses
  });
}));

// Upload profile photo
router.post('/upload-photo', authenticate, authorize('user'), uploadSingle, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  const connection = getConnection();

  try {
    // Process and save the photo
    const photoPath = await UploadService.processAndSaveProfilePhoto(req.file.buffer, req.user!.id, 'user');

    // Get existing profile photo to delete old one
    const [existingProfile] = await connection.execute(
      'SELECT profile_photo FROM user_profiles WHERE user_id = ?',
      [req.user!.id]
    );

    // Delete old photo if exists
    if ((existingProfile as any[]).length > 0 && (existingProfile as any[])[0].profile_photo) {
      await UploadService.deleteProfilePhoto((existingProfile as any[])[0].profile_photo);
    }

    // Update or create profile with new photo
    const [checkProfile] = await connection.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.user!.id]
    );

    if ((checkProfile as any[]).length > 0) {
      // Update existing profile
      await connection.execute(
        'UPDATE user_profiles SET profile_photo = ?, updated_at = NOW() WHERE user_id = ?',
        [photoPath, req.user!.id]
      );
    } else {
      // Create minimal profile with photo
      await connection.execute(
        'INSERT INTO user_profiles (user_id, profile_photo, first_name, last_name, student_type) VALUES (?, ?, "", "", "ojt")',
        [req.user!.id, photoPath]
      );
    }

    res.json({
      message: 'Profile photo uploaded successfully',
      photoUrl: UploadService.getPhotoUrl(photoPath)
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
}));

// Complete user profile
router.post('/complete-profile', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    firstName,
    lastName,
    studentType,
    contactNumber,
    age,
    birthdate,
    gender,
    courseIds
  } = req.body;

  if (!firstName || !lastName || !studentType || !courseIds || courseIds.length === 0) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  const connection = getConnection();

  // Check if profile already exists
  const [existingProfile] = await connection.execute(
    'SELECT id, profile_photo FROM user_profiles WHERE user_id = ?',
    [req.user!.id]
  );

  const existingPhotoPath = (existingProfile as any[]).length > 0 ? (existingProfile as any[])[0].profile_photo : null;

  if ((existingProfile as any[]).length > 0) {
    // Update existing profile (preserve existing photo)
    await connection.execute(`
      UPDATE user_profiles 
      SET first_name = ?, last_name = ?, student_type = ?, contact_number = ?, 
          age = ?, birthdate = ?, gender = ?, profile_completed = TRUE, updated_at = NOW()
      WHERE user_id = ?
    `, [firstName, lastName, studentType, contactNumber, age, birthdate, gender, req.user!.id]);
  } else {
    // Create new profile
    await connection.execute(`
      INSERT INTO user_profiles (user_id, first_name, last_name, student_type, contact_number, age, birthdate, gender, profile_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [req.user!.id, firstName, lastName, studentType, contactNumber, age, birthdate, gender]);
  }

  // Clear existing courses
  await connection.execute('DELETE FROM user_courses WHERE user_id = ?', [req.user!.id]);

  // Add new courses
  for (const courseId of courseIds) {
    await connection.execute(
      'INSERT INTO user_courses (user_id, course_id, graduation_status) VALUES (?, ?, ?)',
      [req.user!.id, courseId, studentType === 'alumni' ? 'graduated' : 'current']
    );
  }

  res.json({ message: 'Profile completed successfully' });
}));

// Get all courses
router.get('/courses', asyncHandler(async (req, res) => {
  const connection = getConnection();
  
  const [courses] = await connection.execute(
    'SELECT id, course_name, course_type FROM courses ORDER BY course_type, course_name'
  );

  res.json(courses);
}));

// Debug endpoint removed after fixing coordinator photo display

// Get navbar info (name and photo)
router.get('/navbar-info', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  let userInfo;
  switch (req.user!.role) {
    case 'user':
      const [userProfile] = await connection.execute(`
        SELECT first_name, last_name, profile_photo FROM user_profiles WHERE user_id = ?
      `, [req.user!.id]);
      userInfo = (userProfile as any[])[0];
      break;
      
    case 'coordinator':
      const [coordProfile] = await connection.execute(`
        SELECT first_name, last_name, profile_photo FROM coordinator_profiles WHERE coordinator_id = ?
      `, [req.user!.id]);
      userInfo = (coordProfile as any[])[0];
      break;
      
    case 'company':
      const [companyProfile] = await connection.execute(`
        SELECT company_name as first_name, '' as last_name, profile_photo FROM company_profiles WHERE company_id = ?
      `, [req.user!.id]);
      userInfo = (companyProfile as any[])[0];
      break;
      
    case 'admin':
      const [adminProfile] = await connection.execute(`
        SELECT first_name, last_name, profile_photo_url as profile_photo FROM admin_profiles WHERE admin_id = ?
      `, [req.user!.id]);
      userInfo = (adminProfile as any[])[0];
      break;
  }

  // Process profile photo URL
  let profilePhotoUrl: string | null = null;
  if (userInfo?.profile_photo) {
    // All profile photos (user, coordinator, company, admin) need to be processed with UploadService
    profilePhotoUrl = UploadService.getPhotoUrl(userInfo.profile_photo);
  }

  res.json({
    firstName: userInfo?.first_name || '',
    lastName: userInfo?.last_name || '',
    profilePhotoUrl: profilePhotoUrl,
    email: req.user!.email,
    role: req.user!.role
  });
}));

// Update user profile
router.put('/profile', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    firstName,
    lastName,
    studentType,
    contactNumber,
    age,
    birthdate,
    gender,
    courseIds
  } = req.body;

  const connection = getConnection();

  // Update profile (preserve existing photo)
  await connection.execute(`
    UPDATE user_profiles 
    SET first_name = ?, last_name = ?, student_type = ?, contact_number = ?, 
        age = ?, birthdate = ?, gender = ?, updated_at = NOW()
    WHERE user_id = ?
  `, [firstName, lastName, studentType, contactNumber, age, birthdate, gender, req.user!.id]);

  // Update courses if provided
  if (courseIds && courseIds.length > 0) {
    await connection.execute('DELETE FROM user_courses WHERE user_id = ?', [req.user!.id]);
    
    for (const courseId of courseIds) {
      await connection.execute(
        'INSERT INTO user_courses (user_id, course_id, graduation_status) VALUES (?, ?, ?)',
        [req.user!.id, courseId, studentType === 'alumni' ? 'graduated' : 'current']
      );
    }
  }

  res.json({ message: 'Profile updated successfully' });
}));

// Get user dashboard stats
router.get('/dashboard-stats', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();

  // Get application stats
  const [applicationStats] = await connection.execute(`
    SELECT 
      COUNT(*) as total_applications,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_applications,
      SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review_applications,
      SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_applications,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_applications,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_applications
    FROM job_applications
    WHERE user_id = ?
  `, [req.user!.id]);

  // Get resume count
  const [resumeStats] = await connection.execute(`
    SELECT COUNT(*) as total_resumes
    FROM resumes
    WHERE user_id = ?
  `, [req.user!.id]);

  // Get active jobs count
  const [jobStats] = await connection.execute(`
    SELECT COUNT(*) as total_jobs
    FROM jobs
    WHERE status = 'active'
  `, []);

  // Get job match count (based on user's courses and graduation status)
  let matchCount = 0;
  try {
    const [matchStats] = await connection.execute(`
      SELECT COUNT(DISTINCT j.id) as total_matches
      FROM jobs j
      LEFT JOIN user_courses uc ON uc.user_id = ?
      LEFT JOIN courses c ON uc.course_id = c.id
      LEFT JOIN job_categories jc ON c.course_name = jc.course_name AND j.category = jc.category_name
      WHERE j.status = 'active'
        AND (jc.category_name IS NOT NULL OR uc.course_id IS NULL)
    `, [req.user!.id]);
    matchCount = ((matchStats as any[])[0]?.total_matches || 0);
  } catch (error) {
    console.error('Error fetching job matches:', error);
    matchCount = 0;
  }

  const stats = {
    applications: ((applicationStats as any[])[0]?.total_applications || 0),
    pending_applications: ((applicationStats as any[])[0]?.pending_applications || 0),
    under_review_applications: ((applicationStats as any[])[0]?.under_review_applications || 0),
    qualified_applications: ((applicationStats as any[])[0]?.qualified_applications || 0),
    accepted_applications: ((applicationStats as any[])[0]?.accepted_applications || 0),
    rejected_applications: ((applicationStats as any[])[0]?.rejected_applications || 0),
    resumes: ((resumeStats as any[])[0]?.total_resumes || 0),
    matches: matchCount,
    jobs: ((jobStats as any[])[0]?.total_jobs || 0)
  };

  res.json(stats);
}));

// Get recent activity for user dashboard
router.get('/recent-activity', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();

  // Get recent applications
  const [recentApplications] = await connection.execute(`
    SELECT 
      ja.id,
      ja.status,
      ja.created_at,
      j.title as job_title,
      j.company_name,
      j.business_owner_name,
      COALESCE(j.company_name, j.business_owner_name, 'Company') as display_company
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.user_id = ?
    ORDER BY ja.created_at DESC
    LIMIT 5
  `, [req.user!.id]);

  // Get recent resume updates
  const [recentResumes] = await connection.execute(`
    SELECT 
      id,
      title,
      updated_at,
      status
    FROM resumes
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 3
  `, [req.user!.id]);

  res.json({
    applications: recentApplications,
    resumes: recentResumes
  });
}));

// Get approved coordinators (public endpoint)
router.get('/coordinators/approved', asyncHandler(async (req, res) => {
  const connection = getConnection();
  
  const [coordinators] = await connection.execute(`
    SELECT 
      c.id,
      c.email,
      cp.first_name,
      cp.last_name,
      cp.designated_course,
      cp.contact_number,
      cp.profile_photo,
      cp.average_rating,
      cp.rating_count
    FROM coordinators c
    INNER JOIN coordinator_profiles cp ON c.id = cp.coordinator_id
    WHERE c.is_verified = TRUE 
      AND c.is_approved = TRUE 
      AND cp.is_profile_complete = TRUE
      AND cp.first_name IS NOT NULL 
      AND cp.last_name IS NOT NULL
      AND cp.designated_course IS NOT NULL
    ORDER BY cp.first_name ASC, cp.last_name ASC
  `);
  
  // Process profile photo URLs
  const processedCoordinators = (coordinators as any[]).map(coord => ({
    ...coord,
    profile_photo: UploadService.getPhotoUrl(coord.profile_photo)
  }));
  
  res.json(processedCoordinators);
}));

// Get approved companies/business owners (public endpoint)
router.get('/companies/approved', asyncHandler(async (req, res) => {
  const connection = getConnection();
  
  const [companies] = await connection.execute(`
    SELECT 
      c.id,
      cp.company_name,
      cp.profile_type,
      cp.first_name,
      cp.last_name,
      cp.business_summary,
      cp.profile_photo,
      cp.average_rating,
      cp.rating_count
    FROM companies c
    INNER JOIN company_profiles cp ON c.id = cp.company_id
    WHERE c.is_verified = TRUE 
      AND c.is_approved = TRUE 
      AND cp.profile_completed = TRUE
      AND cp.company_name IS NOT NULL
      AND cp.business_summary IS NOT NULL
    ORDER BY cp.company_name ASC
  `);
  
  // Process profile photo URLs
  const processedCompanies = (companies as any[]).map(company => ({
    ...company,
    profile_photo: UploadService.getPhotoUrl(company.profile_photo)
  }));
  
  res.json(processedCompanies);
}));

// Get user ratings
router.get('/my-ratings', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  // Get all ratings for this user's applications with rater details
  const [ratings] = await connection.execute(`
    SELECT 
      ar.id,
      ar.rating,
      ar.comment,
      ar.created_at,
      ar.rated_by_type,
      ar.rated_by_id,
      ja.job_id,
      j.title as job_title,
      CASE 
        WHEN ar.rated_by_type = 'coordinator' THEN 
          CONCAT(cp.first_name, ' ', cp.last_name)
        WHEN ar.rated_by_type = 'company' THEN 
          comp_p.company_name
      END as rater_name,
      CASE 
        WHEN ar.rated_by_type = 'coordinator' THEN cp.profile_photo
        WHEN ar.rated_by_type = 'company' THEN comp_p.profile_photo
      END as rater_photo
    FROM applicant_ratings ar
    INNER JOIN job_applications ja ON ar.application_id = ja.id
    INNER JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN coordinator_profiles cp ON ar.rated_by_type = 'coordinator' AND ar.rated_by_id = cp.coordinator_id
    LEFT JOIN company_profiles comp_p ON ar.rated_by_type = 'company' AND ar.rated_by_id = comp_p.company_id
    WHERE ja.user_id = ?
    ORDER BY ar.created_at DESC
  `, [req.user!.id]);

  // Calculate rating statistics
  const [stats] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT ar.id) as total_ratings,
      AVG(ar.rating) as average_rating,
      MAX(ar.rating) as highest_rating,
      MIN(ar.rating) as lowest_rating,
      COUNT(DISTINCT CASE WHEN ar.rated_by_type = 'company' THEN ar.id END) as company_ratings_count,
      COUNT(DISTINCT CASE WHEN ar.rated_by_type = 'coordinator' THEN ar.id END) as coordinator_ratings_count
    FROM applicant_ratings ar
    INNER JOIN job_applications ja ON ar.application_id = ja.id
    WHERE ja.user_id = ?
  `, [req.user!.id]);

  // Process profile photos
  const processedRatings = (ratings as any[]).map(rating => ({
    ...rating,
    rater_photo: UploadService.getPhotoUrl(rating.rater_photo)
  }));

  res.json({
    ratings: processedRatings,
    statistics: (stats as any[])[0]
  });
}));

// Get user employment history
router.get('/employment-history', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  try {
    const [employmentHistory] = await connection.execute(`
      SELECT 
        ues.*,
        j.title as job_title,
        j.description as job_description,
        CASE 
          WHEN ues.employer_type = 'company' THEN cp.company_name
          WHEN ues.employer_type = 'coordinator' THEN CONCAT(coord_p.first_name, ' ', coord_p.last_name)
        END as employer_display_name,
        CASE 
          WHEN ues.employer_type = 'company' THEN cp.profile_photo
          WHEN ues.employer_type = 'coordinator' THEN coord_p.profile_photo
        END as employer_photo
      FROM user_employment_status ues
      JOIN jobs j ON ues.job_id = j.id
      LEFT JOIN company_profiles cp ON ues.employer_type = 'company' AND ues.employer_id = cp.company_id
      LEFT JOIN coordinator_profiles coord_p ON ues.employer_type = 'coordinator' AND ues.employer_id = coord_p.coordinator_id
      WHERE ues.user_id = ?
      ORDER BY ues.hired_date DESC
    `, [req.user!.id]);

    // Process employer photos
    const processedHistory = (employmentHistory as any[]).map(record => ({
      ...record,
      employer_photo_url: UploadService.getPhotoUrl(record.employer_photo)
    }));

    res.json(processedHistory);

  } catch (error) {
    logger.error('Error fetching employment history:', error);
    res.status(500).json({ message: 'Failed to fetch employment history' });
  }
}));

// Update employment status (end contract)
router.patch('/employment/:id/end-contract', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const connection = getConnection();
  
  try {
    // Verify ownership and update
    const [result] = await connection.execute(`
      UPDATE user_employment_status 
      SET employment_status = 'contract_ended',
          contract_end_date = NOW(),
          updated_at = NOW()
      WHERE id = ? AND user_id = ? AND employment_status = 'active'
    `, [id, req.user!.id]);

    const affectedRows = (result as any).affectedRows;
    
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Employment record not found or already ended' });
    }

    logger.info(`Employment contract ${id} ended by user ${req.user!.id}`);

    res.json({ message: 'Contract ended successfully' });

  } catch (error) {
    logger.error('Error ending employment contract:', error);
    res.status(500).json({ message: 'Failed to end contract' });
  }
}));

export default router;
