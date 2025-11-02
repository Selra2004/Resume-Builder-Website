import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authenticateForProfileCompletion, authorize, AuthRequest } from '../middleware/auth.js';
import { getConnection } from '../config/database.js';
import { EmailService } from '../services/emailService.js';
import { UploadService } from '../services/uploadService.js';

const router = express.Router();

// Get pending approvals
router.get('/pending-approvals', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  // Get pending coordinators with profile information
  const [coordinators] = await connection.execute(`
    SELECT 
      c.id, 
      c.email, 
      c.created_at, 
      'coordinator' as type,
      cp.first_name,
      cp.last_name,
      cp.designated_course,
      cp.profile_photo,
      cp.is_profile_complete
    FROM coordinators c
    LEFT JOIN coordinator_profiles cp ON c.id = cp.coordinator_id
    WHERE c.is_verified = TRUE AND c.is_approved = FALSE
    ORDER BY c.created_at ASC
  `);

  // Get pending companies
  const [companies] = await connection.execute(`
    SELECT c.id, c.email, c.created_at, 'company' as type
    FROM companies c
    WHERE c.is_verified = TRUE AND c.is_approved = FALSE
    ORDER BY c.created_at ASC
  `);

  // Get pending admins with profile information
  const [admins] = await connection.execute(`
    SELECT 
      a.id, 
      a.email, 
      a.created_at, 
      'admin' as type,
      ap.first_name,
      ap.last_name,
      ap.position,
      ap.department,
      ap.profile_photo_url,
      ap.is_profile_complete
    FROM admins a
    LEFT JOIN admin_profiles ap ON a.id = ap.admin_id
    WHERE a.is_verified = TRUE AND a.is_approved = FALSE
    ORDER BY a.created_at ASC
  `);

  const pending = [
    ...(coordinators as any[]),
    ...(companies as any[]),
    ...(admins as any[])
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());


  res.json(pending);
}));

// Approve user
router.post('/approve/:type/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { type, id } = req.params;
  const connection = getConnection();

  const validTypes = ['coordinator', 'company', 'admin'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid user type' });
  }

  const tableName = type === 'coordinator' ? 'coordinators' : 
                   type === 'company' ? 'companies' : 'admins';

  // Check if user exists and is verified
  const [user] = await connection.execute(
    `SELECT id, email FROM ${tableName} WHERE id = ? AND is_verified = TRUE AND is_approved = FALSE`,
    [id]
  );

  if ((user as any[]).length === 0) {
    return res.status(404).json({ message: 'User not found or already processed' });
  }

  const userEmail = (user as any[])[0].email;

  // For admin and coordinator types, check if profile is complete
  if (type === 'admin') {
    const [adminProfile] = await connection.execute(
      'SELECT is_profile_complete FROM admin_profiles WHERE admin_id = ?',
      [id]
    );

    if ((adminProfile as any[]).length === 0 || !(adminProfile as any[])[0].is_profile_complete) {
      return res.status(400).json({ 
        message: 'Cannot approve admin: Profile is not complete. Admin must complete their profile first.' 
      });
    }
  } else if (type === 'coordinator') {
    const [coordinatorProfile] = await connection.execute(
      'SELECT is_profile_complete FROM coordinator_profiles WHERE coordinator_id = ?',
      [id]
    );

    if ((coordinatorProfile as any[]).length === 0 || !(coordinatorProfile as any[])[0].is_profile_complete) {
      return res.status(400).json({ 
        message: 'Cannot approve coordinator: Profile is not complete. Coordinator must complete their profile first.' 
      });
    }
  }

  // Approve user
  await connection.execute(
    `UPDATE ${tableName} SET is_approved = TRUE WHERE id = ?`,
    [id]
  );

  // Send approval email notification
  try {
    await EmailService.sendApprovalEmail(userEmail, type, true);
    
    // For admins, also send welcome email after approval
    if (type === 'admin') {
      await EmailService.sendWelcomeEmail(userEmail, userEmail.split('@')[0], 'admin');
    }
  } catch (emailError) {
    console.warn('Failed to send approval/welcome email:', emailError);
    // Don't fail the approval if email sending fails
  }

  res.json({ message: `${type} approved successfully` });
}));

// Reject user
router.post('/reject/:type/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { type, id } = req.params;
  const { reason } = req.body || {}; // Optional rejection reason
  const connection = getConnection();

  const validTypes = ['coordinator', 'company', 'admin'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid user type' });
  }

  const tableName = type === 'coordinator' ? 'coordinators' : 
                   type === 'company' ? 'companies' : 'admins';

  // Check if user exists and get email
  const [user] = await connection.execute(
    `SELECT id, email FROM ${tableName} WHERE id = ?`,
    [id]
  );

  if ((user as any[]).length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const userEmail = (user as any[])[0].email;

  // Send rejection email notification before deleting
  try {
    await EmailService.sendApprovalEmail(userEmail, type, false, reason);
  } catch (emailError) {
    console.warn('Failed to send rejection email:', emailError);
    // Don't fail the rejection if email sending fails
  }

  // Delete user (rejection)
  await connection.execute(
    `DELETE FROM ${tableName} WHERE id = ?`,
    [id]
  );

  res.json({ message: `${type} rejected and removed successfully` });
}));

// Get all users
router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [users] = await connection.execute(`
    SELECT 
      u.id,
      u.email,
      u.created_at,
      up.first_name,
      up.last_name,
      up.student_type,
      'user' as role
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE u.is_verified = TRUE
    ORDER BY u.created_at DESC
  `);

  res.json(users);
}));

// Get all coordinators with full profile information
router.get('/coordinators', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [coordinators] = await connection.execute(`
    SELECT 
      c.id,
      c.email,
      c.is_verified,
      c.is_approved,
      c.created_at,
      cp.first_name,
      cp.last_name,
      cp.contact_number,
      cp.age,
      cp.birthdate,
      cp.gender,
      cp.designated_course,
      cp.profile_photo,
      cp.is_profile_complete
    FROM coordinators c
    LEFT JOIN coordinator_profiles cp ON c.id = cp.coordinator_id
    ORDER BY c.created_at DESC
  `);

  res.json(coordinators);
}));

// Get all companies
router.get('/companies', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [companies] = await connection.execute(`
    SELECT 
      c.id,
      c.email,
      c.is_approved,
      c.created_at,
      cp.company_name,
      cp.business_summary,
      cp.profile_photo,
      'company' as role
    FROM companies c
    LEFT JOIN company_profiles cp ON c.id = cp.company_id
    WHERE c.is_verified = TRUE
    ORDER BY c.created_at DESC
  `);

  // Process profile photos
  const processedCompanies = (companies as any[]).map(company => ({
    ...company,
    profile_photo: UploadService.getPhotoUrl(company.profile_photo)
  }));

  res.json(processedCompanies);
}));

// Get all admins with full profile details
router.get('/admins', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [admins] = await connection.execute(`
    SELECT 
      a.id,
      a.email,
      a.is_approved,
      a.created_at,
      ap.first_name,
      ap.last_name,
      ap.contact_number,
      ap.age,
      ap.birthdate,
      ap.gender,
      ap.position,
      ap.department,
      ap.profile_photo_url,
      ap.is_profile_complete,
      'admin' as role
    FROM admins a
    LEFT JOIN admin_profiles ap ON a.id = ap.admin_id
    WHERE a.is_verified = TRUE
    ORDER BY a.created_at DESC
  `);

  res.json(admins);
}));

// Get all jobs
router.get('/jobs', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [jobs] = await connection.execute(`
    SELECT 
      j.id,
      j.title,
      j.work_type as job_type,
      j.experience_level,
      j.location,
      CASE WHEN j.status = 'active' THEN 1 ELSE 0 END as is_active,
      j.created_at,
      CASE 
        WHEN j.created_by_type = 'coordinator' THEN 
          COALESCE(CONCAT(cp.first_name, ' ', cp.last_name), j.coordinator_name, 'Unknown Coordinator')
        WHEN j.created_by_type = 'company' THEN 
          COALESCE(company_p.company_name, j.company_name, j.business_owner_name, 'Unknown Company')
      END as company_name,
      j.category as category_name
    FROM jobs j
    LEFT JOIN coordinator_profiles cp ON j.created_by_type = 'coordinator' AND j.created_by_id = cp.coordinator_id
    LEFT JOIN company_profiles company_p ON j.created_by_type = 'company' AND j.created_by_id = company_p.company_id
    ORDER BY j.created_at DESC
  `);

  res.json(jobs);
}));

// Admin profile operations
router.get('/profile', authenticateForProfileCompletion, asyncHandler(async (req: AuthRequest, res) => {
  const connection = getConnection();
  
  const [adminProfile] = await connection.execute(`
    SELECT 
      a.id,
      a.email,
      ap.first_name,
      ap.last_name,
      ap.contact_number,
      ap.age,
      ap.birthdate,
      ap.gender,
      ap.position,
      ap.department,
      ap.profile_photo_url,
      COALESCE(ap.is_profile_complete, FALSE) as is_profile_complete
    FROM admins a
    LEFT JOIN admin_profiles ap ON a.id = ap.admin_id
    WHERE a.id = ?
  `, [req.user!.id]);

  if ((adminProfile as any[]).length === 0) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  res.json((adminProfile as any[])[0]);
}));

// Complete admin profile (used during registration)
router.post('/complete-profile', authenticateForProfileCompletion, asyncHandler(async (req: AuthRequest, res) => {
  const { 
    firstName, 
    lastName, 
    contactNumber, 
    age, 
    birthdate, 
    gender, 
    position, 
    department, 
    profilePhotoUrl 
  } = req.body;

  if (!firstName || !lastName || !contactNumber || !age || !birthdate || !gender || !position || !profilePhotoUrl) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  const connection = getConnection();

  // Check if profile already exists
  const [existingProfile] = await connection.execute(
    'SELECT id FROM admin_profiles WHERE admin_id = ?',
    [req.user!.id]
  );

  if ((existingProfile as any[]).length > 0) {
    // Update existing profile
    await connection.execute(
      `UPDATE admin_profiles SET 
        first_name = ?, last_name = ?, contact_number = ?, age = ?, birthdate = ?, 
        gender = ?, position = ?, department = ?, profile_photo_url = ?, 
        is_profile_complete = TRUE, updated_at = NOW() 
       WHERE admin_id = ?`,
      [firstName, lastName, contactNumber, age, birthdate, gender, position, department, profilePhotoUrl, req.user!.id]
    );
  } else {
    // Create new profile
    await connection.execute(
      `INSERT INTO admin_profiles 
        (admin_id, first_name, last_name, contact_number, age, birthdate, gender, position, department, profile_photo_url, is_profile_complete) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [req.user!.id, firstName, lastName, contactNumber, age, birthdate, gender, position, department, profilePhotoUrl]
    );
  }

  res.json({ 
    message: 'Profile completed successfully! Your account is now pending admin approval.',
    profileComplete: true
  });
}));

// Update admin profile (for editing later)
router.put('/profile', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { 
    firstName, 
    lastName, 
    contactNumber, 
    age, 
    birthdate, 
    gender, 
    position, 
    department, 
    profilePhotoUrl 
  } = req.body;
  const connection = getConnection();

  // Check if profile exists
  const [existingProfile] = await connection.execute(
    'SELECT id FROM admin_profiles WHERE admin_id = ?',
    [req.user!.id]
  );

  if ((existingProfile as any[]).length > 0) {
    // Update existing profile
    if (profilePhotoUrl) {
      // Update with photo URL
      await connection.execute(
        `UPDATE admin_profiles SET 
          first_name = ?, last_name = ?, contact_number = ?, age = ?, birthdate = ?, 
          gender = ?, position = ?, department = ?, profile_photo_url = ?, updated_at = NOW() 
         WHERE admin_id = ?`,
        [firstName, lastName, contactNumber, age, birthdate, gender, position, department, profilePhotoUrl, req.user!.id]
      );
    } else {
      // Update without changing photo URL
      await connection.execute(
        `UPDATE admin_profiles SET 
          first_name = ?, last_name = ?, contact_number = ?, age = ?, birthdate = ?, 
          gender = ?, position = ?, department = ?, updated_at = NOW() 
         WHERE admin_id = ?`,
        [firstName, lastName, contactNumber, age, birthdate, gender, position, department, req.user!.id]
      );
    }
  } else {
    // Create new profile
    await connection.execute(
      `INSERT INTO admin_profiles 
        (admin_id, first_name, last_name, contact_number, age, birthdate, gender, position, department, profile_photo_url, is_profile_complete) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [req.user!.id, firstName, lastName, contactNumber, age, birthdate, gender, position, department, profilePhotoUrl]
    );
  }

  res.json({ message: 'Admin profile updated successfully' });
}));

// Delete admin account (for admin management)
router.delete('/admins/:id', authenticate, authorize('admin'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const currentAdminId = req.user!.id;
  const connection = getConnection();

  // Prevent admin from deleting themselves
  if (parseInt(id) === currentAdminId) {
    return res.status(400).json({ message: 'Cannot delete your own admin account' });
  }

  // Check if admin exists
  const [admin] = await connection.execute(
    'SELECT id, email FROM admins WHERE id = ?',
    [id]
  );

  if ((admin as any[]).length === 0) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  // Check if there's at least one other admin remaining
  const [adminCount] = await connection.execute(
    'SELECT COUNT(*) as count FROM admins WHERE is_approved = TRUE AND id != ?',
    [id]
  );

  if ((adminCount as any[])[0].count <= 1) {
    return res.status(400).json({ message: 'Cannot delete admin - at least one admin must remain in the system' });
  }

  // Delete admin profile first (foreign key constraint)
  await connection.execute(
    'DELETE FROM admin_profiles WHERE admin_id = ?',
    [id]
  );

  // Delete admin account
  await connection.execute(
    'DELETE FROM admins WHERE id = ?',
    [id]
  );

  const adminEmail = (admin as any[])[0].email;
  res.json({ message: `Admin account ${adminEmail} deleted successfully` });
}));

export default router;
