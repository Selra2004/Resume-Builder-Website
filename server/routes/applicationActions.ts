import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { EmailService } from '../services/emailService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Accept Application and Schedule Interview
router.post('/applications/:applicationId/accept', 
  authenticate, 
  authorize('coordinator', 'company'), 
  asyncHandler(async (req: AuthRequest, res) => {
    const { applicationId } = req.params;
    const { interviewDate, interviewMode, interviewLocation, interviewLink, notes } = req.body;

    const connection = getConnection();
    
    try {
      await connection.beginTransaction();

      // Get application details
      const [applications] = await connection.execute(`
        SELECT 
          ja.*,
          j.title as job_title,
          j.created_by_type,
          j.created_by_id,
          up.profile_photo
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        LEFT JOIN user_profiles up ON ja.user_id = up.user_id
        WHERE ja.id = ?
      `, [applicationId]);

      const application = (applications as any[])[0];
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check authorization - only job creator can accept
      if (application.created_by_type !== req.user!.role || 
          application.created_by_id !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to accept this application' });
      }

      // Get company/coordinator name
      let companyName = 'Unknown Company';
      if (req.user!.role === 'company') {
        const [company] = await connection.execute(`
          SELECT company_name FROM company_profiles WHERE company_id = ?
        `, [req.user!.id]);
        companyName = (company as any[])[0]?.company_name || 'Unknown Company';
      } else if (req.user!.role === 'coordinator') {
        const [coordinator] = await connection.execute(`
          SELECT CONCAT(first_name, ' ', last_name) as name FROM coordinator_profiles WHERE coordinator_id = ?
        `, [req.user!.id]);
        companyName = (coordinator as any[])[0]?.name || 'Coordinator';
      }

      // Create interview record
      const [interviewResult] = await connection.execute(`
        INSERT INTO interviews (
          application_id, job_id, user_id, scheduled_by_type, scheduled_by_id,
          interview_date, interview_mode, interview_location, interview_link, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        applicationId,
        application.job_id,
        application.user_id,
        req.user!.role,
        req.user!.id,
        interviewDate,
        interviewMode,
        interviewLocation,
        interviewLink,
        notes
      ]);

      const interviewId = (interviewResult as any).insertId;

      // Update application status
      await connection.execute(`
        UPDATE job_applications 
        SET status = 'interview_scheduled', 
            scheduled_interview_date = ?,
            interview_id = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [interviewDate, interviewId, applicationId]);

      // Log action
      await connection.execute(`
        INSERT INTO application_actions (
          application_id, action_type, action_by_type, action_by_id, action_by_name, notes, email_sent
        ) VALUES (?, 'accepted', ?, ?, ?, ?, TRUE)
      `, [
        applicationId,
        req.user!.role,
        req.user!.id,
        companyName,
        notes || null
      ]);

      await connection.commit();

      // Send acceptance email
      const emailLogId = await EmailService.sendAcceptanceEmail({
        to: application.email,
        applicant_name: `${application.first_name} ${application.last_name}`,
        job_title: application.job_title,
        company_name: companyName,
        interview_date: new Date(interviewDate).toLocaleString(),
        interview_mode: interviewMode,
        interview_location_link: interviewLocation || interviewLink,
        notes
      });

      // Add profile notification linked to the actual email
      await EmailService.addProfileNotification({
        userId: application.user_id,
        title: 'Interview Scheduled',
        message: `Your application for ${application.job_title} has been accepted! Interview scheduled for ${new Date(interviewDate).toLocaleString()}`,
        type: 'application_status',
        relatedId: emailLogId || interviewId // Use email log ID if available
      });

      logger.info(`Application ${applicationId} accepted by ${req.user!.role} ${req.user!.id}`);

      res.json({
        message: 'Application accepted and interview scheduled',
        interviewId,
        emailSent: !!emailLogId
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error accepting application:', error);
      res.status(500).json({ message: 'Failed to accept application' });
    }
  })
);

// Reject Application
router.post('/applications/:applicationId/reject',
  authenticate,
  authorize('coordinator', 'company'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const connection = getConnection();

    try {
      await connection.beginTransaction();

      // Get application details
      const [applications] = await connection.execute(`
        SELECT 
          ja.*,
          j.title as job_title,
          j.created_by_type,
          j.created_by_id
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ?
      `, [applicationId]);

      const application = (applications as any[])[0];
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check authorization
      if (application.created_by_type !== req.user!.role || 
          application.created_by_id !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to reject this application' });
      }

      // Get company/coordinator name
      let companyName = 'Unknown Company';
      if (req.user!.role === 'company') {
        const [company] = await connection.execute(`
          SELECT company_name FROM company_profiles WHERE company_id = ?
        `, [req.user!.id]);
        companyName = (company as any[])[0]?.company_name || 'Unknown Company';
      } else if (req.user!.role === 'coordinator') {
        const [coordinator] = await connection.execute(`
          SELECT CONCAT(first_name, ' ', last_name) as name FROM coordinator_profiles WHERE coordinator_id = ?
        `, [req.user!.id]);
        companyName = (coordinator as any[])[0]?.name || 'Coordinator';
      }

      // Set auto-delete date (10 days from now)
      const autoDeleteDate = new Date();
      autoDeleteDate.setDate(autoDeleteDate.getDate() + 10);

      // Update application status
      await connection.execute(`
        UPDATE job_applications 
        SET status = 'rejected',
            rejection_reason = ?,
            auto_delete_date = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [reason || null, autoDeleteDate, applicationId]);

      // Log action
      await connection.execute(`
        INSERT INTO application_actions (
          application_id, action_type, action_by_type, action_by_id, action_by_name, 
          reason, auto_delete_date, email_sent
        ) VALUES (?, 'rejected', ?, ?, ?, ?, ?, TRUE)
      `, [
        applicationId,
        req.user!.role,
        req.user!.id,
        companyName,
        reason || null,
        autoDeleteDate
      ]);

      await connection.commit();

      // Send rejection email
      const emailLogId = await EmailService.sendRejectionEmail({
        to: application.email,
        applicant_name: `${application.first_name} ${application.last_name}`,
        job_title: application.job_title,
        company_name: companyName,
        reason
      });

      logger.info(`Application ${applicationId} rejected by ${req.user!.role} ${req.user!.id}`);

      res.json({
        message: 'Application rejected and email sent',
        emailSent: !!emailLogId,
        autoDeleteDate
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error rejecting application:', error);
      res.status(500).json({ message: 'Failed to reject application' });
    }
  })
);

// Hire Applicant (post-interview)
router.post('/applications/:applicationId/hire',
  authenticate,
  authorize('coordinator', 'company'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { applicationId } = req.params;
    const { details } = req.body;

    const connection = getConnection();

    try {
      await connection.beginTransaction();

      // Get application details
      const [applications] = await connection.execute(`
        SELECT 
          ja.*,
          j.title as job_title,
          j.created_by_type,
          j.created_by_id
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ?
      `, [applicationId]);

      const application = (applications as any[])[0];
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check authorization
      if (application.created_by_type !== req.user!.role || 
          application.created_by_id !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to hire this applicant' });
      }

      // Get company/coordinator name
      let employerName = 'Unknown Company';
      if (req.user!.role === 'company') {
        const [company] = await connection.execute(`
          SELECT company_name FROM company_profiles WHERE company_id = ?
        `, [req.user!.id]);
        employerName = (company as any[])[0]?.company_name || 'Unknown Company';
      } else if (req.user!.role === 'coordinator') {
        const [coordinator] = await connection.execute(`
          SELECT CONCAT(first_name, ' ', last_name) as name FROM coordinator_profiles WHERE coordinator_id = ?
        `, [req.user!.id]);
        employerName = (coordinator as any[])[0]?.name || 'Coordinator';
      }

      // Update application status
      await connection.execute(`
        UPDATE job_applications 
        SET status = 'hired', updated_at = NOW()
        WHERE id = ?
      `, [applicationId]);

      // Create employment record
      await connection.execute(`
        INSERT INTO user_employment_status (
          user_id, application_id, job_id, employer_type, employer_id, 
          employer_name, job_title, hired_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        application.user_id,
        applicationId,
        application.job_id,
        req.user!.role,
        req.user!.id,
        employerName,
        application.job_title
      ]);

      // Log action
      await connection.execute(`
        INSERT INTO application_actions (
          application_id, action_type, action_by_type, action_by_id, action_by_name, notes, email_sent
        ) VALUES (?, 'hired', ?, ?, ?, ?, TRUE)
      `, [
        applicationId,
        req.user!.role,
        req.user!.id,
        employerName,
        details || null
      ]);

      await connection.commit();

      // Send hired email
      const emailLogId = await EmailService.sendHiredEmail({
        to: application.email,
        applicant_name: `${application.first_name} ${application.last_name}`,
        job_title: application.job_title,
        company_name: employerName,
        details
      });

      // Add profile notification linked to the actual email
      await EmailService.addProfileNotification({
        userId: application.user_id,
        title: 'Congratulations! You\'ve been hired!',
        message: `You have been hired for the position of ${application.job_title} at ${employerName}`,
        type: 'application_status',
        relatedId: emailLogId || parseInt(applicationId) // Use email log ID if available
      });

      logger.info(`Application ${applicationId} hired by ${req.user!.role} ${req.user!.id}`);

      res.json({
        message: 'Applicant hired successfully',
        emailSent: !!emailLogId
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error hiring applicant:', error);
      res.status(500).json({ message: 'Failed to hire applicant' });
    }
  })
);

// Reject Applicant After Interview
router.post('/applications/:applicationId/post-interview-reject',
  authenticate,
  authorize('coordinator', 'company'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const connection = getConnection();

    try {
      await connection.beginTransaction();

      // Get application details
      const [applications] = await connection.execute(`
        SELECT 
          ja.*,
          j.title as job_title,
          j.created_by_type,
          j.created_by_id
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND ja.status = 'pending_review'
      `, [applicationId]);

      const application = (applications as any[])[0];
      if (!application) {
        return res.status(404).json({ message: 'Application not found or not in review status' });
      }

      // Check authorization
      if (application.created_by_type !== req.user!.role || 
          application.created_by_id !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to reject this applicant' });
      }

      // Get company/coordinator name
      let companyName = 'Unknown Company';
      if (req.user!.role === 'company') {
        const [company] = await connection.execute(`
          SELECT company_name FROM company_profiles WHERE company_id = ?
        `, [req.user!.id]);
        companyName = (company as any[])[0]?.company_name || 'Unknown Company';
      } else if (req.user!.role === 'coordinator') {
        const [coordinator] = await connection.execute(`
          SELECT CONCAT(first_name, ' ', last_name) as name FROM coordinator_profiles WHERE coordinator_id = ?
        `, [req.user!.id]);
        companyName = (coordinator as any[])[0]?.name || 'Coordinator';
      }

      // Set auto-delete date (10 days from now)
      const autoDeleteDate = new Date();
      autoDeleteDate.setDate(autoDeleteDate.getDate() + 10);

      // Update application status
      await connection.execute(`
        UPDATE job_applications 
        SET status = 'rejected',
            rejection_reason = ?,
            auto_delete_date = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [reason || 'Not selected after interview', autoDeleteDate, applicationId]);

      // Log action
      await connection.execute(`
        INSERT INTO application_actions (
          application_id, action_type, action_by_type, action_by_id, action_by_name, 
          reason, auto_delete_date, email_sent
        ) VALUES (?, 'rejected', ?, ?, ?, ?, ?, TRUE)
      `, [
        applicationId,
        req.user!.role,
        req.user!.id,
        companyName,
        reason || 'Not selected after interview',
        autoDeleteDate
      ]);

      await connection.commit();

      // Send post-interview rejection email
      const emailSent = await EmailService.sendPostInterviewRejectionEmail({
        to: application.email,
        applicant_name: `${application.first_name} ${application.last_name}`,
        job_title: application.job_title,
        company_name: companyName,
        reason
      });

      logger.info(`Post-interview rejection for application ${applicationId} by ${req.user!.role} ${req.user!.id}`);

      res.json({
        message: 'Post-interview rejection processed and email sent',
        emailSent,
        autoDeleteDate
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error processing post-interview rejection:', error);
      res.status(500).json({ message: 'Failed to process rejection' });
    }
  })
);

export default router;

