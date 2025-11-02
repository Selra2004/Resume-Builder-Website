import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getConnection } from '../config/database.js';
import { 
  hashPassword, 
  comparePassword, 
  generateJWT, 
  generateOTP, 
  generateToken,
  validatePassword,
  validateAsiatechEmail,
  validateEmail
} from '../utils/auth.js';
import { EmailService } from '../services/emailService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Register User (OJT/Alumni)
router.post('/register/user', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!validateAsiatechEmail(email)) {
    return res.status(400).json({ message: 'Invalid Asiatech email format. Use: 1-xxxxxx@asiatech.edu.ph' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  const connection = getConnection();

  // Check if user already exists
  const [existingUsers] = await connection.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if ((existingUsers as any[]).length > 0) {
    return res.status(409).json({ message: 'User already exists' });
  }

  // Generate OTP and verification token
  const otp = generateOTP();
  const verificationToken = generateToken();
  const hashedPassword = await hashPassword(password);

  // Store OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  console.log('Storing OTP:', { email, otp, purpose: 'registration', otpExpires });
  await connection.execute(
    'INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp, 'registration', otpExpires]
  );
  console.log('OTP stored successfully in database');

  // Create user
  const [result] = await connection.execute(
    'INSERT INTO users (email, password_hash, verification_token) VALUES (?, ?, ?)',
    [email, hashedPassword, verificationToken]
  );

  // Send OTP email
  const emailSent = await EmailService.sendOTP(email, otp, 'registration');
  
  if (!emailSent) {
    logger.warn(`Failed to send OTP to ${email}`);
  }

  res.status(201).json({
    message: 'User registered successfully. Please check your email for verification code.',
    userId: (result as any).insertId,
    emailSent
  });
}));

// Register Coordinator
router.post('/register/coordinator', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  const connection = getConnection();

  // Check if coordinator already exists
  const [existingCoordinators] = await connection.execute(
    'SELECT id FROM coordinators WHERE email = ?',
    [email]
  );

  if ((existingCoordinators as any[]).length > 0) {
    return res.status(409).json({ message: 'Coordinator already exists' });
  }

  // Generate OTP and verification token
  const otp = generateOTP();
  const verificationToken = generateToken();
  const hashedPassword = await hashPassword(password);

  // Store OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  console.log('Storing OTP for coordinator:', { email, otp, purpose: 'registration', otpExpires });
  await connection.execute(
    'INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp, 'registration', otpExpires]
  );
  console.log('Coordinator OTP stored successfully in database');

  // Create coordinator
  const [result] = await connection.execute(
    'INSERT INTO coordinators (email, password_hash, verification_token) VALUES (?, ?, ?)',
    [email, hashedPassword, verificationToken]
  );

  // Send OTP email
  await EmailService.sendOTP(email, otp, 'coordinator registration');

  res.status(201).json({
    message: 'Coordinator registered successfully. Please verify your email and wait for admin approval.',
    coordinatorId: (result as any).insertId
  });
}));

// Register Company (invitation-based)
router.post('/register/company', asyncHandler(async (req, res) => {
  const { email, password, invitationToken } = req.body;

  if (!email || !password || !invitationToken) {
    return res.status(400).json({ message: 'Email, password, and invitation code are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  const connection = getConnection();

  // Verify invitation token
  const [invitations] = await connection.execute(`
    SELECT 
      id, 
      coordinator_id, 
      company_email, 
      status, 
      expires_at 
    FROM company_invitations 
    WHERE token = ? AND status = 'pending' AND expires_at > NOW()
  `, [invitationToken]);

  if ((invitations as any[]).length === 0) {
    return res.status(400).json({ message: 'Invalid or expired invitation code' });
  }

  const invitation = (invitations as any[])[0];

  // Check if the email matches the invitation
  if (invitation.company_email !== email) {
    return res.status(400).json({ message: 'Email does not match the invitation' });
  }

  // Check if company already exists
  const [existingCompanies] = await connection.execute(
    'SELECT id FROM companies WHERE email = ?',
    [email]
  );

  if ((existingCompanies as any[]).length > 0) {
    return res.status(409).json({ message: 'Company already exists' });
  }

  // Generate OTP and verification token
  const otp = generateOTP();
  const verificationToken = generateToken();
  const hashedPassword = await hashPassword(password);

  // Store OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await connection.execute(
    'INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp, 'registration', otpExpires]
  );

  // Create company with coordinator affiliation (auto-approved since they have invitation)
  const [result] = await connection.execute(
    'INSERT INTO companies (email, password_hash, verification_token, invited_by_coordinator_id, is_approved) VALUES (?, ?, ?, ?, TRUE)',
    [email, hashedPassword, verificationToken, invitation.coordinator_id]
  );

  const companyId = (result as any).insertId;

  // Mark invitation as used
  await connection.execute(
    'UPDATE company_invitations SET status = "used", used_at = NOW(), company_id = ? WHERE id = ?',
    [companyId, invitation.id]
  );

  // Create coordinator affiliation record
  await connection.execute(
    'INSERT INTO company_coordinator_affiliations (company_id, coordinator_id, invitation_id) VALUES (?, ?, ?)',
    [companyId, invitation.coordinator_id, invitation.id]
  );

  // Send OTP email
  await EmailService.sendOTP(email, otp, 'company registration');

  res.status(201).json({
    message: 'Company registered successfully. Please verify your email to continue.',
    companyId: companyId
  });
}));

// Register Admin
router.post('/register/admin', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Email, password, first name, and last name are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  const connection = getConnection();

  // Check if admin already exists
  const [existingAdmins] = await connection.execute(
    'SELECT id FROM admins WHERE email = ?',
    [email]
  );

  if ((existingAdmins as any[]).length > 0) {
    return res.status(409).json({ message: 'Admin already exists' });
  }

  // Generate OTP and verification token
  const otp = generateOTP();
  const verificationToken = generateToken();
  const hashedPassword = await hashPassword(password);

  // Store OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await connection.execute(
    'INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp, 'registration', otpExpires]
  );

  // Create admin account (pending approval)
  const [result] = await connection.execute(
    'INSERT INTO admins (email, password_hash, verification_token, is_verified, is_approved) VALUES (?, ?, ?, ?, ?)',
    [email, hashedPassword, verificationToken, false, false]
  );

  const adminId = (result as any).insertId;

  // Create admin profile
  await connection.execute(
    'INSERT INTO admin_profiles (admin_id, first_name, last_name) VALUES (?, ?, ?)',
    [adminId, firstName, lastName]
  );

  // Send OTP email
  await EmailService.sendOTP(email, otp, 'admin registration');

  logger.info(`New admin registration: ${email}`);

  res.status(201).json({
    message: 'Admin registered successfully. Please verify your email and wait for approval from existing admin.',
    adminId: adminId
  });
}));

// Verify OTP
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { email, otp, purpose = 'registration' } = req.body;

  console.log('Verify OTP request:', { email, otp, purpose });

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  let otpRecords: any[] = [];
  let connection: any;
  
  try {
    connection = getConnection();

    // Find valid OTP
    console.log('Searching for OTP:', { email, otp, purpose });
    
    // First, let's see ALL OTPs for this email
    const [allOtps] = await connection.execute(
      'SELECT * FROM otp_verifications WHERE email = ? ORDER BY created_at DESC',
      [email]
    );
    console.log('All OTPs for email:', allOtps);
    
    // Check current time in both UTC and local (for debugging)
    const debugTime = new Date();
    console.log('Current time check:', { 
      jsTime: debugTime.toISOString(), 
      localTime: debugTime.toLocaleString(),
      mysqlTime: debugTime.toISOString().slice(0, 19).replace('T', ' ')
    });
    
    // Fixed: Get OTP record and check expiration properly
    const [records] = await connection.execute(
      'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND purpose = ? AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email, otp, purpose]
    );
    otpRecords = records as any[];

    console.log('OTP search result:', otpRecords);

    if ((otpRecords as any[]).length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const otpRecord = (otpRecords as any[])[0];
    
    // Fix timezone issue: Database stores local time, but JS interprets as UTC
    // Add 8 hours (Philippines timezone offset) to correct the interpretation
    const dbExpiryTime = new Date(otpRecord.expires_at);
    const correctedExpiryTime = new Date(dbExpiryTime.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours
    const currentTime = new Date();
    
    console.log('Time comparison (timezone corrected):', {
      dbTime: otpRecord.expires_at,
      dbAsUTC: dbExpiryTime.toISOString(),
      correctedExpiry: correctedExpiryTime.toISOString(),
      currentTime: currentTime.toISOString(),
      isValid: currentTime <= correctedExpiryTime,
      timeDifferenceMinutes: (correctedExpiryTime.getTime() - currentTime.getTime()) / (1000 * 60)
    });
    
    if (currentTime > correctedExpiryTime) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    
    console.log('OTP is valid - proceeding with verification');
    
    // Mark OTP as used
    await connection.execute(
      'UPDATE otp_verifications SET is_used = TRUE WHERE id = ?',
      [otpRecord.id]
    );
    
    // Determine user type and table
    let userTable: string;
    let userRole: string;

    // Check if it's an admin registration
    const [admins] = await connection.execute('SELECT id, "admin" as role FROM admins WHERE email = ?', [email]);
    if ((admins as any[]).length > 0) {
      userTable = 'admins';
      userRole = 'admin';
    } else if (validateAsiatechEmail(email)) {
      userTable = 'users';
      userRole = 'user';
    } else {
      const [users] = await connection.execute('SELECT id, "user" as role FROM users WHERE email = ?', [email]);
      const [coordinators] = await connection.execute('SELECT id, "coordinator" as role FROM coordinators WHERE email = ?', [email]);
      const [companies] = await connection.execute('SELECT id, "company" as role FROM companies WHERE email = ?', [email]);

      if ((users as any[]).length > 0) {
        userTable = 'users';
        userRole = 'user';
      } else if ((coordinators as any[]).length > 0) {
        userTable = 'coordinators';
        userRole = 'coordinator';
      } else if ((companies as any[]).length > 0) {
        userTable = 'companies';
        userRole = 'company';
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Update user verification status
    await connection.execute(
      `UPDATE ${userTable} SET is_verified = TRUE WHERE email = ?`,
      [email]
    );

    console.log(`User verified successfully in ${userTable} table for ${userRole}`);

    // Get user details for response (include is_approved for non-user roles)
    const selectQuery = userRole === 'user' 
      ? `SELECT id, email FROM ${userTable} WHERE email = ?`
      : `SELECT id, email, is_approved FROM ${userTable} WHERE email = ?`;
    
    const [userDetails] = await connection.execute(selectQuery, [email]);

    const user = (userDetails as any[])[0];
    user.role = userRole;

    // Generate JWT token
    const token = generateJWT({ id: user.id, email: user.email, role: user.role });
    
    // Send welcome email (only for non-admin roles - admins get it after approval)
    if (userRole !== 'admin') {
      try {
        await EmailService.sendWelcomeEmail(email, email.split('@')[0], userRole);
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail the verification if email sending fails
      }
    }

    // Different response based on user role
    if (userRole === 'admin') {
      return res.json({
        message: '✅ Email verified! IMPORTANT: You must complete your admin profile with all personal and professional details to be eligible for approval by an existing administrator.',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: true
        },
        requiresProfileCompletion: true,
        nextStep: 'complete-profile'
      });
    } else if (userRole === 'coordinator') {
      return res.json({
        message: '✅ Email verified! Please complete your coordinator profile with your personal information and the course you will be representing.',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: true
        },
        requiresProfileCompletion: true,
        nextStep: 'complete-profile'
      });
    } else if (userRole === 'company') {
      return res.json({
        message: '✅ Email verified! Please complete your company/business profile to continue.',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: true,
          isApproved: user.is_approved ?? true // Companies are auto-approved
        },
        requiresProfileCompletion: true,
        nextStep: 'complete-profile'
      });
    } else {
      return res.json({
        message: 'Email verified successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: true
        }
      });
    }
    
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const connection = getConnection();

  // Determine user type and fetch user
  let user: any = null;
  let tableName: string = '';
  let userRole: string = '';

  // Check users table (OJT/Alumni)
  if (validateAsiatechEmail(email)) {
    const [users] = await connection.execute(
      'SELECT id, email, password_hash, is_verified FROM users WHERE email = ?',
      [email]
    );
    if ((users as any[]).length > 0) {
      user = (users as any[])[0];
      tableName = 'users';
      userRole = 'user';
    }
  } else {
    // Check other tables
    const tables = [
      { name: 'coordinators', role: 'coordinator' },
      { name: 'companies', role: 'company' },
      { name: 'admins', role: 'admin' }
    ];

    for (const table of tables) {
      const [results] = await connection.execute(
        `SELECT id, email, password_hash, is_verified, is_approved FROM ${table.name} WHERE email = ?`,
        [email]
      );
      if ((results as any[]).length > 0) {
        user = (results as any[])[0];
        tableName = table.name;
        userRole = table.role;
        break;
      }
    }
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if user is verified
  if (!user.is_verified) {
    return res.status(401).json({ message: 'Please verify your email first' });
  }

  // Check if user is approved (for coordinators, companies, admins)
  if (user.hasOwnProperty('is_approved') && !user.is_approved) {
    return res.status(401).json({ message: 'Account pending approval' });
  }

  // Generate JWT token
  const token = generateJWT({ id: user.id, email: user.email, role: userRole });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: userRole,
      isVerified: user.is_verified,
      isApproved: user.is_approved !== undefined ? user.is_approved : true
    }
  });
}));

// Resend OTP
router.post('/resend-otp', asyncHandler(async (req, res) => {
  const { email, purpose = 'registration' } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const connection = getConnection();

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Store new OTP
  await connection.execute(
    'INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp, purpose, otpExpires]
  );

  // Send OTP email
  const emailSent = await EmailService.sendOTP(email, otp, purpose);

  res.json({
    message: 'OTP sent successfully',
    emailSent
  });
}));

// Forgot Password
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const connection = getConnection();

  // Find user in appropriate table
  let userExists = false;
  let tableName = '';

  const tables = ['users', 'coordinators', 'companies', 'admins'];
  
  for (const table of tables) {
    const [results] = await connection.execute(
      `SELECT id FROM ${table} WHERE email = ?`,
      [email]
    );
    if ((results as any[]).length > 0) {
      userExists = true;
      tableName = table;
      break;
    }
  }

  if (!userExists) {
    // Don't reveal if email exists for security
    return res.json({ message: 'If the email exists, a reset code has been sent.' });
  }

  // Generate reset token and OTP
  const resetToken = generateToken();
  const otp = generateOTP();
  const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store reset token
  await connection.execute(
    `UPDATE ${tableName} SET reset_token = ?, reset_token_expires = ? WHERE email = ?`,
    [resetToken, resetExpires, email]
  );

  // Store OTP
  await connection.execute(
    'INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp, 'password_reset', otpExpires]
  );

  // Send OTP email
  await EmailService.sendOTP(email, otp, 'password reset');

  res.json({
    message: 'If the email exists, a reset code has been sent.',
    resetToken // Frontend will need this for the reset process
  });
}));

// Reset Password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email, otp, resetToken, newPassword } = req.body;

  if (!email || !otp || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  const connection = getConnection();

  // Verify OTP
  const [otpRecords] = await connection.execute(
    'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND purpose = ? AND expires_at > NOW() AND is_used = FALSE',
    [email, otp, 'password_reset']
  );

  if ((otpRecords as any[]).length === 0) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Find user and verify reset token
  let userTable = '';
  const tables = ['users', 'coordinators', 'companies', 'admins'];
  
  for (const table of tables) {
    const [results] = await connection.execute(
      `SELECT id FROM ${table} WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()`,
      [email, resetToken]
    );
    if ((results as any[]).length > 0) {
      userTable = table;
      break;
    }
  }

  if (!userTable) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset token
  await connection.execute(
    `UPDATE ${userTable} SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?`,
    [hashedPassword, email]
  );

  // Mark OTP as used
  await connection.execute(
    'UPDATE otp_verifications SET is_used = TRUE WHERE id = ?',
    [(otpRecords as any[])[0].id]
  );

  res.json({
    message: 'Password reset successful'
  });
}));

export default router;
