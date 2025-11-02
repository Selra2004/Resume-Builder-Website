import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { EmailService } from '../services/emailService.js';
import { logger } from '../utils/logger.js';
import { UploadService } from '../services/uploadService.js';

const router = express.Router();

// Get all scheduled interviews for current user (coordinator/company)
router.get('/scheduled', 
  authenticate, 
  authorize('coordinator', 'company'), 
  asyncHandler(async (req: AuthRequest, res) => {
    const connection = getConnection();
    
    try {
      const query = `
        SELECT 
          i.*,
          ja.first_name,
          ja.last_name,
          ja.email,
          ja.phone,
          ja.position_applying_for,
          ja.status as application_status,
          up.profile_photo,
          j.title as job_title,
          CASE 
            WHEN i.scheduled_by_type = 'company' THEN cp.company_name
            WHEN i.scheduled_by_type = 'coordinator' THEN CONCAT(coord_p.first_name, ' ', coord_p.last_name)
          END as company_name,
          TIMESTAMPDIFF(HOUR, NOW(), i.interview_date) as hours_until_interview,
          CASE WHEN i.interview_date < NOW() THEN 1 ELSE 0 END as is_overdue
        FROM interviews i
        JOIN job_applications ja ON i.application_id = ja.id
        JOIN jobs j ON i.job_id = j.id
        LEFT JOIN user_profiles up ON ja.user_id = up.user_id
        LEFT JOIN company_profiles cp ON i.scheduled_by_type = 'company' AND i.scheduled_by_id = cp.company_id
        LEFT JOIN coordinator_profiles coord_p ON i.scheduled_by_type = 'coordinator' AND i.scheduled_by_id = coord_p.coordinator_id
        WHERE i.scheduled_by_type = ? AND i.scheduled_by_id = ?
          AND ja.status NOT IN ('hired', 'rejected')
        ORDER BY 
          CASE WHEN i.interview_date < NOW() THEN 0 ELSE 1 END,
          ABS(TIMESTAMPDIFF(HOUR, NOW(), i.interview_date))
      `;

      const [interviews] = await connection.execute(query, [req.user!.role, req.user!.id]);

      // Process profile photos
      const processedInterviews = (interviews as any[]).map(interview => ({
        ...interview,
        profile_photo: UploadService.getPhotoUrl(interview.profile_photo),
        is_overdue: Boolean(interview.is_overdue)
      }));

      res.json(processedInterviews);

    } catch (error) {
      logger.error('Error fetching scheduled interviews:', error);
      res.status(500).json({ message: 'Failed to fetch scheduled interviews' });
    }
  })
);

// Update interview status
router.patch('/:id/status', 
  authenticate, 
  authorize('coordinator', 'company'), 
  asyncHandler(async (req: AuthRequest, res) => {
    const { id: interviewId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'cancelled', 'no_show'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const connection = getConnection();
    
    try {
      // Verify ownership
      const [interviews] = await connection.execute(`
        SELECT i.*, ja.user_id, ja.first_name, ja.last_name, ja.email, j.title as job_title
        FROM interviews i
        JOIN job_applications ja ON i.application_id = ja.id
        JOIN jobs j ON i.job_id = j.id
        WHERE i.id = ? AND i.scheduled_by_type = ? AND i.scheduled_by_id = ?
      `, [interviewId, req.user!.role, req.user!.id]);

      const interview = (interviews as any[])[0];
      if (!interview) {
        return res.status(404).json({ message: 'Interview not found or not authorized' });
      }

      // Update interview status
      await connection.execute(`
        UPDATE interviews SET status = ?, updated_at = NOW() WHERE id = ?
      `, [status, interviewId]);

      // Update application status based on interview status
      let newApplicationStatus = 'interview_scheduled';
      
      if (status === 'completed') {
        newApplicationStatus = 'pending_review';
        
        // Send notification to user
        await EmailService.addProfileNotification({
          userId: interview.user_id,
          title: 'Interview Completed',
          message: `Your interview for ${interview.job_title} has been completed. The employer will contact you soon with their decision.`,
          type: 'application_status',
          relatedId: parseInt(interviewId)
        });
      } else if (status === 'cancelled') {
        newApplicationStatus = 'under_review';
      } else if (status === 'no_show') {
        newApplicationStatus = 'rejected';
        
        // Automatically reject application for no-show
        const autoDeleteDate = new Date();
        autoDeleteDate.setDate(autoDeleteDate.getDate() + 10);
        
        await connection.execute(`
          UPDATE job_applications 
          SET status = 'rejected', 
              rejection_reason = 'No show for scheduled interview',
              auto_delete_date = ?,
              updated_at = NOW()
          WHERE id = ?
        `, [autoDeleteDate, interview.application_id]);

        // Send notification
        const emailLogId = await EmailService.sendRejectionEmail({
          to: interview.email,
          applicant_name: `${interview.first_name} ${interview.last_name}`,
          job_title: interview.job_title,
          company_name: 'Company', // Will be filled by email service
          reason: 'Unfortunately, you did not attend the scheduled interview.'
        });
        
        // Add profile notification linked to email if sent
        if (emailLogId) {
          await EmailService.addProfileNotification({
            userId: interview.user_id,
            title: 'Interview No-Show - Application Rejected',
            message: `Your application for ${interview.job_title} has been rejected due to missing the scheduled interview. Check your email for details.`,
            type: 'application_status',
            relatedId: emailLogId
          });
        }
      }

      // Update application status if not no-show (no-show handled above)
      if (status !== 'no_show') {
        await connection.execute(`
          UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?
        `, [newApplicationStatus, interview.application_id]);
      }

      logger.info(`Interview ${interviewId} status updated to ${status} by ${req.user!.role} ${req.user!.id}`);

      res.json({ 
        message: 'Interview status updated successfully',
        newApplicationStatus
      });

    } catch (error) {
      logger.error('Error updating interview status:', error);
      res.status(500).json({ message: 'Failed to update interview status' });
    }
  })
);

// Get interview statistics
router.get('/stats', 
  authenticate, 
  authorize('coordinator', 'company'), 
  asyncHandler(async (req: AuthRequest, res) => {
    const connection = getConnection();
    
    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_interviews,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
          COUNT(CASE WHEN interview_date < NOW() AND status = 'scheduled' THEN 1 END) as overdue,
          COUNT(CASE WHEN interview_date >= NOW() AND interview_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR) THEN 1 END) as next_24h
        FROM interviews 
        WHERE scheduled_by_type = ? AND scheduled_by_id = ?
      `, [req.user!.role, req.user!.id]);

      res.json((stats as any[])[0]);

    } catch (error) {
      logger.error('Error fetching interview statistics:', error);
      res.status(500).json({ message: 'Failed to fetch interview statistics' });
    }
  })
);

export default router;
