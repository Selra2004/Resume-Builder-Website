import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user's notifications
router.get('/', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const connection = getConnection();
    
    try {
      let query = `
        SELECT 
          id, title, message, type, related_id, is_read, created_at, expires_at
        FROM user_notifications 
        WHERE user_id = ? AND expires_at > NOW()
      `;

      const queryParams: any[] = [req.user!.id];

      if (unread_only === 'true') {
        query += ' AND is_read = FALSE';
      }

      query += ' ORDER BY created_at DESC';

      // Add pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit as string), offset);

      const [notifications] = await connection.execute(query, queryParams);

      // Get unread count
      const [unreadCount] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM user_notifications 
        WHERE user_id = ? AND is_read = FALSE AND expires_at > NOW()
      `, [req.user!.id]);

      res.json({
        notifications,
        unread_count: (unreadCount as any[])[0].count,
        total: (notifications as any[]).length
      });

    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  })
);

// Mark notification as read
router.patch('/:id/read', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const connection = getConnection();
    
    try {
      // Verify ownership and update
      const [result] = await connection.execute(`
        UPDATE user_notifications 
        SET is_read = TRUE 
        WHERE id = ? AND user_id = ?
      `, [id, req.user!.id]);

      const affectedRows = (result as any).affectedRows;
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  })
);

// Mark all notifications as read
router.patch('/mark-all-read', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const connection = getConnection();
    
    try {
      const [result] = await connection.execute(`
        UPDATE user_notifications 
        SET is_read = TRUE 
        WHERE user_id = ? AND is_read = FALSE AND expires_at > NOW()
      `, [req.user!.id]);

      const affectedRows = (result as any).affectedRows;

      res.json({ 
        message: 'All notifications marked as read',
        updated_count: affectedRows
      });

    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  })
);

// Delete a notification
router.delete('/:id', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const connection = getConnection();
    
    try {
      const [result] = await connection.execute(`
        DELETE FROM user_notifications 
        WHERE id = ? AND user_id = ?
      `, [id, req.user!.id]);

      const affectedRows = (result as any).affectedRows;
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted' });

    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  })
);

// Get detailed notification with full content
router.get('/:id/details', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const connection = getConnection();
    
    try {
      // Get notification details
      const [notification] = await connection.execute(`
        SELECT 
          id, title, message, type, related_id, is_read, created_at, expires_at
        FROM user_notifications 
        WHERE id = ? AND user_id = ? AND expires_at > NOW()
      `, [id, req.user!.id]);

      if ((notification as any[]).length === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      const notificationData = (notification as any[])[0];
      let emailDetails = null;
      let interviewDetails = null;

      // Check if this is an interview completed notification - no email is sent for these
      const isInterviewCompleted = notificationData.title === 'Interview Completed' && 
                                  notificationData.type === 'application_status';

      if (isInterviewCompleted && notificationData.related_id) {
        // For interview completed notifications, fetch interview details instead of email
        try {
          const [interviewInfo] = await connection.execute(`
            SELECT 
              i.notes,
              i.interview_date,
              i.interview_mode,
              i.interview_location,
              i.interview_link,
              j.title as job_title,
              CASE 
                WHEN i.scheduled_by_type = 'company' THEN cp.company_name
                WHEN i.scheduled_by_type = 'coordinator' THEN CONCAT(coord_p.first_name, ' ', coord_p.last_name)
              END as employer_name
            FROM interviews i
            JOIN jobs j ON i.job_id = j.id
            LEFT JOIN company_profiles cp ON i.scheduled_by_type = 'company' AND i.scheduled_by_id = cp.company_id
            LEFT JOIN coordinator_profiles coord_p ON i.scheduled_by_type = 'coordinator' AND i.scheduled_by_id = coord_p.coordinator_id
            WHERE i.id = ? AND i.user_id = ?
          `, [notificationData.related_id, req.user!.id]);

          if ((interviewInfo as any[]).length > 0) {
            interviewDetails = (interviewInfo as any[])[0];
          }
        } catch (interviewError) {
          logger.warn('Could not fetch interview details:', interviewError);
        }
      } else if (notificationData.related_id) {
        // For other notifications, try to get email details based on related_id
        try {
          // Get the actual sent email content using the related_id as email_notifications.id
          const [emailNotifications] = await connection.execute(`
            SELECT 
              recipient_email, 
              subject, 
              body, 
              type, 
              is_sent,
              sent_at,
              error_message
            FROM email_notifications 
            WHERE id = ? AND recipient_email = (
              SELECT email FROM users WHERE id = ?
            )
          `, [notificationData.related_id, req.user!.id]);

          if ((emailNotifications as any[]).length > 0) {
            emailDetails = (emailNotifications as any[])[0];
          } else {
            // Fallback: Try to find recent emails for this user
            const [recentEmails] = await connection.execute(`
              SELECT 
                recipient_email, 
                subject, 
                body, 
                type, 
                is_sent,
                sent_at,
                error_message
              FROM email_notifications 
              WHERE recipient_email = (
                SELECT email FROM users WHERE id = ?
              )
              ORDER BY sent_at DESC 
              LIMIT 1
            `, [req.user!.id]);
            
            if ((recentEmails as any[]).length > 0) {
              emailDetails = (recentEmails as any[])[0];
            }
          }
        } catch (emailError) {
          logger.warn('Could not fetch email details:', emailError);
        }
      }

      // Automatically mark as read when viewing details
      if (!notificationData.is_read) {
        await connection.execute(`
          UPDATE user_notifications 
          SET is_read = TRUE 
          WHERE id = ? AND user_id = ?
        `, [id, req.user!.id]);
        notificationData.is_read = true;
      }

      res.json({
        notification: notificationData,
        emailDetails,
        interviewDetails,
        fullMessage: notificationData.message, // Full message content
        metadata: {
          auto_marked_read: !notificationData.is_read,
          has_email_details: !!emailDetails,
          has_interview_details: !!interviewDetails,
          is_interview_completed: isInterviewCompleted
        }
      });

    } catch (error) {
      logger.error('Error fetching notification details:', error);
      res.status(500).json({ message: 'Failed to fetch notification details' });
    }
  })
);

// Get notification statistics
router.get('/stats', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const connection = getConnection();
    
    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_count,
          COUNT(CASE WHEN type = 'interview_reminder' THEN 1 END) as interview_reminders,
          COUNT(CASE WHEN type = 'application_status' THEN 1 END) as application_updates,
          COUNT(CASE WHEN type = 'system' THEN 1 END) as system_notifications
        FROM user_notifications 
        WHERE user_id = ? AND expires_at > NOW()
      `, [req.user!.id]);

      res.json((stats as any[])[0]);

    } catch (error) {
      logger.error('Error fetching notification statistics:', error);
      res.status(500).json({ message: 'Failed to fetch notification statistics' });
    }
  })
);

export default router;
