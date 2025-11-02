import cron from 'node-cron';
import { getConnection } from '../config/database.js';
import { EmailService } from './emailService.js';
import { logger } from '../utils/logger.js';

export class CronJobService {
  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) {
      logger.warn('Cron jobs already initialized');
      return;
    }

    logger.info('🔄 Initializing cron jobs...');

    // Run auto-cleanup every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupExpiredData();
    });

    // Send interview reminders every 10 minutes
    cron.schedule('*/10 * * * *', () => {
      this.sendInterviewReminders();
    });

    // Update overdue interview statuses every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.updateOverdueInterviews();
    });

    // Daily cleanup at midnight
    cron.schedule('0 0 * * *', () => {
      this.dailyCleanup();
    });

    this.isInitialized = true;
    logger.info('✅ Cron jobs initialized successfully');
  }

  /**
   * Clean up expired data (notifications and rejected applications)
   */
  static async cleanupExpiredData() {
    const connection = getConnection();
    
    try {
      // Clean up expired notifications
      const [notifResult] = await connection.execute(`
        DELETE FROM user_notifications 
        WHERE expires_at <= NOW()
      `);

      const notifDeleted = (notifResult as any).affectedRows;
      if (notifDeleted > 0) {
        logger.info(`🗑️ Cleaned up ${notifDeleted} expired notifications`);
      }

      // Clean up auto-delete applications
      const [appResult] = await connection.execute(`
        DELETE FROM job_applications 
        WHERE auto_delete_date <= NOW() AND auto_delete_date IS NOT NULL
      `);

      const appsDeleted = (appResult as any).affectedRows;
      if (appsDeleted > 0) {
        logger.info(`🗑️ Auto-deleted ${appsDeleted} rejected applications`);
      }

    } catch (error) {
      logger.error('Error in cleanupExpiredData:', error);
    }
  }

  /**
   * Send interview reminders (1 week, 1 day, 1 hour before)
   */
  static async sendInterviewReminders() {
    const connection = getConnection();
    
    try {
      // Get interviews that need reminders
      const [interviews] = await connection.execute(`
        SELECT 
          i.*,
          ja.user_id,
          ja.first_name,
          ja.last_name,
          ja.email,
          j.title as job_title,
          CASE 
            WHEN i.scheduled_by_type = 'company' THEN cp.company_name
            WHEN i.scheduled_by_type = 'coordinator' THEN CONCAT(coord_p.first_name, ' ', coord_p.last_name)
          END as company_name,
          TIMESTAMPDIFF(HOUR, NOW(), i.interview_date) as hours_until_interview,
          TIMESTAMPDIFF(MINUTE, NOW(), i.interview_date) as minutes_until_interview
        FROM interviews i
        JOIN job_applications ja ON i.application_id = ja.id
        JOIN jobs j ON i.job_id = j.id
        LEFT JOIN company_profiles cp ON i.scheduled_by_type = 'company' AND i.scheduled_by_id = cp.company_id
        LEFT JOIN coordinator_profiles coord_p ON i.scheduled_by_type = 'coordinator' AND i.scheduled_by_id = coord_p.coordinator_id
        WHERE i.status = 'scheduled' 
          AND i.interview_date > NOW()
          AND (
            (TIMESTAMPDIFF(HOUR, NOW(), i.interview_date) BETWEEN 167 AND 169 AND i.reminder_1week_sent = FALSE) OR
            (TIMESTAMPDIFF(HOUR, NOW(), i.interview_date) BETWEEN 23 AND 25 AND i.reminder_1day_sent = FALSE) OR
            (TIMESTAMPDIFF(MINUTE, NOW(), i.interview_date) BETWEEN 55 AND 65 AND i.reminder_1hour_sent = FALSE)
          )
      `);

      for (const interview of interviews as any[]) {
        const hoursUntil = interview.hours_until_interview;
        const minutesUntil = interview.minutes_until_interview;
        
        let reminderType: '1week' | '1day' | '1hour' | null = null;
        let updateField = '';

        // Determine reminder type
        if (hoursUntil >= 167 && hoursUntil <= 169 && !interview.reminder_1week_sent) {
          reminderType = '1week';
          updateField = 'reminder_1week_sent';
        } else if (hoursUntil >= 23 && hoursUntil <= 25 && !interview.reminder_1day_sent) {
          reminderType = '1day';
          updateField = 'reminder_1day_sent';
        } else if (minutesUntil >= 55 && minutesUntil <= 65 && !interview.reminder_1hour_sent) {
          reminderType = '1hour';
          updateField = 'reminder_1hour_sent';
        }

        if (reminderType && updateField) {
          try {
            // Send email reminder
            const emailLogId = await EmailService.sendInterviewReminder(reminderType, {
              to: interview.email,
              applicant_name: `${interview.first_name} ${interview.last_name}`,
              job_title: interview.job_title,
              company_name: interview.company_name,
              interview_date: new Date(interview.interview_date).toLocaleString(),
              interview_mode: interview.interview_mode,
              interview_location_link: interview.interview_location || interview.interview_link || ''
            });

            if (emailLogId) {
              // Mark reminder as sent
              await connection.execute(`
                UPDATE interviews SET ${updateField} = TRUE WHERE id = ?
              `, [interview.id]);

              // Add profile notification linked to the actual email
              await EmailService.addProfileNotification({
                userId: interview.user_id,
                title: `Interview Reminder - ${reminderType === '1week' ? '1 Week' : reminderType === '1day' ? 'Tomorrow' : '1 Hour'}`,
                message: `Interview for ${interview.job_title} at ${interview.company_name} - ${new Date(interview.interview_date).toLocaleString()}`,
                type: 'interview_reminder',
                relatedId: emailLogId // Use email log ID to link to actual sent email
              });

              logger.info(`📧 Sent ${reminderType} reminder for interview ${interview.id} to ${interview.email} (Email ID: ${emailLogId})`);
            }

          } catch (error) {
            logger.error(`Failed to send ${reminderType} reminder for interview ${interview.id}:`, error);
          }
        }
      }

    } catch (error) {
      logger.error('Error in sendInterviewReminders:', error);
    }
  }

  /**
   * Update overdue interview statuses
   */
  static async updateOverdueInterviews() {
    const connection = getConnection();
    
    try {
      // Get interviews that are overdue (1 hour past scheduled time)
      const [result] = await connection.execute(`
        UPDATE interviews 
        SET status = 'no_show', updated_at = NOW()
        WHERE status = 'scheduled' 
          AND interview_date < DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `);

      const updatedCount = (result as any).affectedRows;
      
      if (updatedCount > 0) {
        logger.info(`📅 Updated ${updatedCount} overdue interviews to 'no_show' status`);

        // Also update corresponding applications to rejected
        await connection.execute(`
          UPDATE job_applications ja
          JOIN interviews i ON ja.id = i.application_id
          SET ja.status = 'rejected',
              ja.rejection_reason = 'No show for scheduled interview',
              ja.auto_delete_date = DATE_ADD(NOW(), INTERVAL 10 DAY),
              ja.updated_at = NOW()
          WHERE i.status = 'no_show' 
            AND ja.status = 'interview_scheduled'
            AND i.updated_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        `);
      }

    } catch (error) {
      logger.error('Error in updateOverdueInterviews:', error);
    }
  }

  /**
   * Daily cleanup and maintenance tasks
   */
  static async dailyCleanup() {
    const connection = getConnection();
    
    try {
      // Clean up old OTP verifications (older than 24 hours)
      const [otpResult] = await connection.execute(`
        DELETE FROM otp_verifications 
        WHERE expires_at < NOW()
      `);

      const otpCleaned = (otpResult as any).affectedRows;
      if (otpCleaned > 0) {
        logger.info(`🗑️ Cleaned up ${otpCleaned} expired OTP records`);
      }

      // Clean up old application actions (older than 90 days)
      const [actionsResult] = await connection.execute(`
        DELETE FROM application_actions 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
      `);

      const actionsCleaned = (actionsResult as any).affectedRows;
      if (actionsCleaned > 0) {
        logger.info(`🗑️ Cleaned up ${actionsCleaned} old application action records`);
      }

      // Update job statuses (mark as expired if deadline passed)
      const [jobsResult] = await connection.execute(`
        UPDATE jobs 
        SET status = 'expired' 
        WHERE status = 'active' 
          AND application_deadline IS NOT NULL 
          AND application_deadline < NOW()
      `);

      const expiredJobs = (jobsResult as any).affectedRows;
      if (expiredJobs > 0) {
        logger.info(`📅 Marked ${expiredJobs} jobs as expired due to passed deadline`);
      }

    } catch (error) {
      logger.error('Error in dailyCleanup:', error);
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  static async runManualCleanup() {
    logger.info('🔧 Running manual cleanup...');
    await this.cleanupExpiredData();
    await this.updateOverdueInterviews();
    await this.dailyCleanup();
    logger.info('✅ Manual cleanup completed');
  }

  /**
   * Get cron job statistics
   */
  static async getStats() {
    const connection = getConnection();
    
    try {
      const [stats] = await connection.execute(`
        SELECT 
          (SELECT COUNT(*) FROM user_notifications WHERE expires_at <= NOW()) as expired_notifications,
          (SELECT COUNT(*) FROM job_applications WHERE auto_delete_date <= NOW() AND auto_delete_date IS NOT NULL) as deletable_applications,
          (SELECT COUNT(*) FROM interviews WHERE status = 'scheduled' AND interview_date < DATE_SUB(NOW(), INTERVAL 1 HOUR)) as overdue_interviews,
          (SELECT COUNT(*) FROM otp_verifications WHERE expires_at < NOW()) as expired_otps,
          (SELECT COUNT(*) FROM jobs WHERE status = 'active' AND application_deadline < NOW()) as expired_jobs
      `);

      return (stats as any[])[0];

    } catch (error) {
      logger.error('Error getting cron job stats:', error);
      return null;
    }
  }
}
