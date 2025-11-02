import express from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authenticateForProfileCompletion, authorize, AuthRequest } from '../middleware/auth.js';
import { getConnection } from '../config/database.js';
import { EmailService } from '../services/emailService.js';
import { UploadService } from '../services/uploadService.js';

const router = express.Router();

// Get coordinator profile
router.get('/profile', authenticateForProfileCompletion, asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [coordinatorProfile] = await connection.execute(`
    SELECT 
      c.id,
      c.email,
      cp.first_name,
      cp.last_name,
      cp.contact_number,
      cp.age,
      cp.birthdate,
      cp.gender,
      cp.designated_course,
      cp.profile_photo,
      cp.average_rating,
      cp.rating_count,
      COALESCE(cp.is_profile_complete, FALSE) as is_profile_complete
    FROM coordinators c
    LEFT JOIN coordinator_profiles cp ON c.id = cp.coordinator_id
    WHERE c.id = ?
  `, [req.user!.id]);

  if ((coordinatorProfile as any[]).length === 0) {
    return res.status(404).json({ message: 'Coordinator not found' });
  }

  const profile = (coordinatorProfile as any[])[0];
  
  // Convert profile photo path to full URL if it exists
  if (profile.profile_photo) {
    profile.profile_photo = UploadService.getPhotoUrl(profile.profile_photo);
  }

  res.json(profile);
}));

// Complete coordinator profile (used during registration)
router.post('/complete-profile', authenticateForProfileCompletion, asyncHandler(async (req: AuthRequest, res) => {
  const { 
    firstName, 
    lastName, 
    contactNumber, 
    age, 
    birthdate, 
    gender, 
    designatedCourse, 
    profilePhotoUrl 
  } = req.body;

  if (!firstName || !lastName || !contactNumber || !age || !birthdate || !gender || !designatedCourse || !profilePhotoUrl) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  const connection = getConnection();

  // Check if profile already exists
  const [existingProfile] = await connection.execute(
    'SELECT id FROM coordinator_profiles WHERE coordinator_id = ?',
    [req.user!.id]
  );

  if ((existingProfile as any[]).length > 0) {
    // Update existing profile
    await connection.execute(
      `UPDATE coordinator_profiles SET 
        first_name = ?, last_name = ?, contact_number = ?, age = ?, birthdate = ?, 
        gender = ?, designated_course = ?, profile_photo = ?, 
        is_profile_complete = TRUE, updated_at = NOW() 
       WHERE coordinator_id = ?`,
      [firstName, lastName, contactNumber, age, birthdate, gender, designatedCourse, profilePhotoUrl, req.user!.id]
    );
  } else {
    // Create new profile
    await connection.execute(
      `INSERT INTO coordinator_profiles 
        (coordinator_id, first_name, last_name, contact_number, age, birthdate, gender, designated_course, profile_photo, is_profile_complete) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [req.user!.id, firstName, lastName, contactNumber, age, birthdate, gender, designatedCourse, profilePhotoUrl]
    );
  }

  res.json({ 
    message: 'Profile completed successfully! Your account is now pending admin approval.',
    profileComplete: true
  });
}));

// Update coordinator profile (for editing later)
router.put('/profile', authenticate, authorize('coordinator'), asyncHandler(async (req: AuthRequest, res) => {
  const { 
    firstName, 
    lastName, 
    contactNumber, 
    age, 
    birthdate, 
    gender, 
    designatedCourse, 
    profilePhotoUrl 
  } = req.body;
  const connection = getConnection();

  // Check if profile exists
  const [existingProfile] = await connection.execute(
    'SELECT id FROM coordinator_profiles WHERE coordinator_id = ?',
    [req.user!.id]
  );

  if ((existingProfile as any[]).length > 0) {
    // Update existing profile
    if (profilePhotoUrl) {
      // Update with photo URL
      await connection.execute(
        `UPDATE coordinator_profiles SET 
          first_name = ?, last_name = ?, contact_number = ?, age = ?, birthdate = ?, 
          gender = ?, designated_course = ?, profile_photo = ?, updated_at = NOW() 
         WHERE coordinator_id = ?`,
        [firstName, lastName, contactNumber, age, birthdate, gender, designatedCourse, profilePhotoUrl, req.user!.id]
      );
    } else {
      // Update without changing photo URL
      await connection.execute(
        `UPDATE coordinator_profiles SET 
          first_name = ?, last_name = ?, contact_number = ?, age = ?, birthdate = ?, 
          gender = ?, designated_course = ?, updated_at = NOW() 
         WHERE coordinator_id = ?`,
        [firstName, lastName, contactNumber, age, birthdate, gender, designatedCourse, req.user!.id]
      );
    }
  } else {
    // Create new profile
    await connection.execute(
      `INSERT INTO coordinator_profiles 
        (coordinator_id, first_name, last_name, contact_number, age, birthdate, gender, designated_course, profile_photo, is_profile_complete) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [req.user!.id, firstName, lastName, contactNumber, age, birthdate, gender, designatedCourse, profilePhotoUrl]
    );
  }

  res.json({ message: 'Coordinator profile updated successfully' });
}));

// Send company invitation
router.post('/invite-company', authenticate, authorize('coordinator'), asyncHandler(async (req: AuthRequest, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ message: 'Email and message are required' });
  }

  const connection = getConnection();

  // Check if this email is already registered as a company
  const [existingCompanies] = await connection.execute(
    'SELECT id FROM companies WHERE email = ?',
    [email]
  );

  if ((existingCompanies as any[]).length > 0) {
    return res.status(400).json({ message: 'This email is already registered as a company' });
  }

  // Generate unique 8-digit invitation code
  const token = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Insert invitation
  await connection.execute(
    `INSERT INTO company_invitations (coordinator_id, company_email, message, token, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user!.id, email, message, token, expiresAt]
  );

  // Get coordinator info for the email
  const [coordinatorInfo] = await connection.execute(`
    SELECT 
      c.email,
      cp.first_name,
      cp.last_name,
      cp.designated_course
    FROM coordinators c
    LEFT JOIN coordinator_profiles cp ON c.id = cp.coordinator_id
    WHERE c.id = ?
  `, [req.user!.id]);

  const coordinator = (coordinatorInfo as any[])[0];
  const coordinatorName = coordinator ? `${coordinator.first_name || ''} ${coordinator.last_name || ''}`.trim() : 'Coordinator';

  // Send invitation email
  try {
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register/company?invitation=${token}`;
    
    await EmailService.sendCompanyInvitation({
      recipientEmail: email,
      recipientName: 'Company Representative',
      coordinatorName,
      coordinatorEmail: coordinator?.email || '',
      course: coordinator?.designated_course || '',
      invitationLink,
      invitationCode: token
    });

    res.json({ 
      message: 'Invitation sent successfully',
      token: token.substring(0, 8) + '...' // Return partial token for reference
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
    
    // Delete the invitation since email failed
    await connection.execute(
      'DELETE FROM company_invitations WHERE token = ?',
      [token]
    );
    
    res.status(500).json({ message: 'Failed to send invitation email. Please try again.' });
  }
}));

// Get invitation history for coordinator
router.get('/invitations', authenticate, authorize('coordinator'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();

  // Update expired invitations
  await connection.execute(
    'UPDATE company_invitations SET status = "expired" WHERE status = "pending" AND expires_at <= NOW()'
  );

  const [invitations] = await connection.execute(`
    SELECT 
      ci.id,
      ci.company_email as email,
      ci.message,
      ci.token,
      ci.status,
      ci.created_at,
      ci.used_at,
      ci.expires_at
    FROM company_invitations ci
    WHERE ci.coordinator_id = ?
    ORDER BY ci.created_at DESC
  `, [req.user!.id]);

  res.json(invitations);
}));

// Validate invitation token (used during company registration)
router.get('/validate-invitation/:token', asyncHandler(async (req: AuthRequest, res) => {
  const { token } = req.params;
  const connection = getConnection();

  // Update expired invitations first
  await connection.execute(
    'UPDATE company_invitations SET status = "expired" WHERE status = "pending" AND expires_at <= NOW()'
  );

  const [invitations] = await connection.execute(`
    SELECT 
      ci.id,
      ci.coordinator_id,
      ci.company_email,
      ci.message,
      ci.status,
      ci.expires_at,
      c.email as coordinator_email,
      cp.first_name as coordinator_first_name,
      cp.last_name as coordinator_last_name,
      cp.designated_course
    FROM company_invitations ci
    LEFT JOIN coordinators c ON ci.coordinator_id = c.id
    LEFT JOIN coordinator_profiles cp ON c.id = cp.coordinator_id
    WHERE ci.token = ?
  `, [token]);

  if ((invitations as any[]).length === 0) {
    return res.status(404).json({ message: 'Invalid invitation token' });
  }

  const invitation = (invitations as any[])[0];

  if (invitation.status !== 'pending') {
    return res.status(400).json({ 
      message: invitation.status === 'used' ? 'This invitation has already been used' : 'This invitation has expired'
    });
  }

  const coordinatorName = `${invitation.coordinator_first_name || ''} ${invitation.coordinator_last_name || ''}`.trim();

  res.json({
    valid: true,
    companyEmail: invitation.company_email,
    coordinatorName: coordinatorName || 'Coordinator',
    coordinatorEmail: invitation.coordinator_email,
    course: invitation.designated_course,
    message: invitation.message
  });
}));

// Mark invitation as used (called after successful company registration)
router.post('/use-invitation/:token', asyncHandler(async (req: AuthRequest, res) => {
  const { token } = req.params;
  const { companyId } = req.body;
  const connection = getConnection();

  const [result] = await connection.execute(
    'UPDATE company_invitations SET status = "used", used_at = NOW(), company_id = ? WHERE token = ? AND status = "pending"',
    [companyId, token]
  );

  if ((result as any).affectedRows === 0) {
    return res.status(404).json({ message: 'Invalid or already used invitation token' });
  }

  res.json({ message: 'Invitation marked as used successfully' });
}));

// Get all jobs managed by coordinator (own jobs + affiliated company jobs)
router.get('/jobs', authenticate, authorize('coordinator'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [jobs] = await connection.execute(`
    SELECT 
      j.*,
      CASE 
        WHEN j.created_by_type = 'coordinator' THEN 
          CONCAT(cp.first_name, ' ', cp.last_name)
        WHEN j.created_by_type = 'company' THEN 
          company_p.company_name
      END as created_by_name,
      j.created_by_type,
      COUNT(DISTINCT ja.id) as application_count,
      CASE 
        WHEN j.application_deadline <= NOW() THEN 'expired'
        ELSE j.status
      END as display_status,
      CASE 
        WHEN j.application_deadline <= NOW() THEN true 
        ELSE false 
      END as is_expired
    FROM jobs j
    LEFT JOIN coordinator_profiles cp ON j.created_by_type = 'coordinator' AND j.created_by_id = cp.coordinator_id
    LEFT JOIN company_profiles company_p ON j.created_by_type = 'company' AND j.created_by_id = company_p.company_id
    LEFT JOIN job_applications ja ON j.id = ja.job_id
    WHERE (
      (j.created_by_type = 'coordinator' AND j.created_by_id = ?)
      OR 
      (j.created_by_type = 'company' AND j.created_by_id IN (
        SELECT cca.company_id 
        FROM company_coordinator_affiliations cca
        WHERE cca.coordinator_id = ? AND cca.status = 'active'
      ))
    )
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `, [req.user!.id, req.user!.id]);

  res.json(jobs);
}));

// Rate a coordinator (users only)
router.post('/:id/rate', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id: coordinatorId } = req.params;
  const { rating, review, context, jobId } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  if (!context || !['job_post', 'team_page'].includes(context)) {
    return res.status(400).json({ message: 'Invalid context. Must be job_post or team_page' });
  }

  const connection = getConnection();

  // Verify coordinator exists
  const [coordinatorCheck] = await connection.execute(
    'SELECT id FROM coordinators WHERE id = ?',
    [coordinatorId]
  );

  if ((coordinatorCheck as any[]).length === 0) {
    return res.status(404).json({ message: 'Coordinator not found' });
  }

  // Insert or update rating
  await connection.execute(`
    INSERT INTO coordinator_ratings (coordinator_id, user_id, rating, review, context, job_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    rating = VALUES(rating), 
    review = VALUES(review),
    context = VALUES(context),
    job_id = VALUES(job_id),
    updated_at = CURRENT_TIMESTAMP
  `, [coordinatorId, req.user!.id, rating, review || null, context, jobId || null]);

  // Update aggregated rating in coordinator_profiles table
  const [ratingStats] = await connection.execute(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM coordinator_ratings
    WHERE coordinator_id = ?
  `, [coordinatorId]);

  const stats = (ratingStats as any[])[0];
  await connection.execute(
    'UPDATE coordinator_profiles SET average_rating = ?, rating_count = ? WHERE coordinator_id = ?',
    [stats.avg_rating, stats.count, coordinatorId]
  );

  res.json({ 
    message: 'Coordinator rating submitted successfully',
    average_rating: stats.avg_rating,
    rating_count: stats.count
  });
}));

// Get coordinator ratings (public)
router.get('/:id/ratings', asyncHandler(async (req, res) => {
  const { id: coordinatorId } = req.params;
  const connection = getConnection();

  try {
    // Verify coordinator exists
    const [coordinatorCheck] = await connection.execute(
      'SELECT id FROM coordinators WHERE id = ?',
      [coordinatorId]
    );

    if ((coordinatorCheck as any[]).length === 0) {
      return res.status(404).json({ 
        message: 'Coordinator not found',
        ratings: [] 
      });
    }

    // Try to get ratings, but handle if table doesn't exist
    let ratings: any[] = [];
    try {
      const [ratingsResult] = await connection.execute(`
        SELECT 
          cr.id,
          cr.rating,
          cr.review,
          cr.context,
          cr.created_at,
          COALESCE(up.first_name, 'Anonymous') as first_name,
          COALESCE(up.last_name, 'User') as last_name,
          up.profile_photo,
          j.title as job_title
        FROM coordinator_ratings cr
        LEFT JOIN user_profiles up ON cr.user_id = up.user_id
        LEFT JOIN jobs j ON cr.job_id = j.id
        WHERE cr.coordinator_id = ?
        ORDER BY cr.created_at DESC
      `, [coordinatorId]);
      
      ratings = ratingsResult as any[];
    } catch (tableError) {
      console.log('coordinator_ratings table might not exist:', tableError);
      // Return empty ratings if table doesn't exist
      return res.json({ ratings: [] });
    }

    // Process ratings to include photo URLs
    const processedRatings = ratings.map((rating: any) => ({
      ...rating,
      profile_photo: rating.profile_photo ? UploadService.getPhotoUrl(rating.profile_photo) : null
    }));

    res.json({ ratings: processedRatings });
  } catch (error) {
    console.error('Error fetching coordinator ratings:', error);
    res.status(500).json({ 
      message: 'Failed to fetch coordinator ratings',
      error: error instanceof Error ? error.message : 'Unknown error',
      ratings: []
    });
  }
}));

// Get current user's coordinator rating
router.get('/:id/my-rating', authenticate, authorize('user'), asyncHandler(async (req: AuthRequest, res) => {
  const { id: coordinatorId } = req.params;
  const connection = getConnection();

  const [userRating] = await connection.execute(`
    SELECT rating, review, context, job_id
    FROM coordinator_ratings
    WHERE coordinator_id = ? AND user_id = ?
  `, [coordinatorId, req.user!.id]);

  if ((userRating as any[]).length > 0) {
    res.json((userRating as any[])[0]);
  } else {
    res.json({ rating: null, review: null, context: null, job_id: null });
  }
}));

export default router;
