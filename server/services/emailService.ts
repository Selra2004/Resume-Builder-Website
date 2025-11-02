import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { Connection } from 'mysql2/promise';
import { getConnection } from '../config/database.js';

interface EmailData {
  to: string;
  applicant_name: string;
  job_title: string;
  company_name: string;
  interview_date?: string;
  interview_mode?: 'onsite' | 'online';
  interview_location_link?: string;
  notes?: string;
  reason?: string;
  details?: string;
}

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: 'interview_reminder' | 'application_status' | 'system';
  relatedId?: number;
}

export class EmailService {
  /**
   * Create transporter with current environment variables
   */
  private static createTransporter() {
    const isGmail = process.env.EMAIL_SERVICE === 'gmail';
    
    const config = {
      host: isGmail ? 'smtp.gmail.com' : (process.env.SMTP_HOST || 'localhost'),
      port: isGmail ? 587 : parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    };

    logger.info(`📧 Creating SMTP transporter: ${config.host}:${config.port} (Gmail: ${isGmail})`);
    
    return nodemailer.createTransport(config);
  }

  /**
   * Test SMTP connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      logger.info('📧 SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('📧 SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Send application acceptance email with interview details
   */
  static async sendAcceptanceEmail(emailData: EmailData): Promise<number | null> {
    try {
      const template = await this.getEmailTemplate('application_accepted');
      if (!template) {
        logger.error('Application accepted email template not found');
        return null;
      }

      const notesSection = emailData.notes ? 
        `<h4>Additional Notes:</h4><p>${emailData.notes}</p>` : '';
      
      const notesText = emailData.notes ? `Notes: ${emailData.notes}` : '';

      const subject = this.replaceVariables(template.subject, emailData);
      const htmlBody = this.replaceVariables(template.body_html, {
        ...emailData,
        notes_section: notesSection,
        notes_text: notesText
      });
      const textBody = this.replaceVariables(template.body_text, {
        ...emailData,
        notes_text: notesText
      });

      // Send email and return the email log ID
      const emailLogId = await this.sendEmail({
        to: emailData.to,
        subject,
        html: htmlBody,
        text: textBody
      });

      return emailLogId;
    } catch (error) {
      logger.error('Error in sendAcceptanceEmail:', error);
      return null;
    }
  }

  /**
   * Send application rejection email
   */
  static async sendRejectionEmail(emailData: EmailData): Promise<number | null> {
    try {
      const template = await this.getEmailTemplate('application_rejected');
      if (!template) {
        logger.error('Application rejected email template not found');
        return null;
      }

      const reasonSection = emailData.reason ? 
        `<h4>Feedback:</h4><p>${emailData.reason}</p>` : '';
      
      const reasonText = emailData.reason ? `Reason: ${emailData.reason}` : '';

      const subject = this.replaceVariables(template.subject, emailData);
      const htmlBody = this.replaceVariables(template.body_html, {
        ...emailData,
        reason_section: reasonSection,
        reason_text: reasonText
      });
      const textBody = this.replaceVariables(template.body_text, {
        ...emailData,
        reason_text: reasonText
      });

      // Send email and return the email log ID
      const emailLogId = await this.sendEmail({
        to: emailData.to,
        subject,
        html: htmlBody,
        text: textBody
      });

      return emailLogId;
    } catch (error) {
      logger.error('Error in sendRejectionEmail:', error);
      return null;
    }
  }

  /**
   * Send hired notification email
   */
  static async sendHiredEmail(emailData: EmailData): Promise<number | null> {
    try {
      const template = await this.getEmailTemplate('applicant_hired');
      if (!template) {
        logger.error('Applicant hired email template not found');
        return null;
      }

      const detailsSection = emailData.details ? 
        `<h4>Next Steps:</h4><p>${emailData.details}</p>` : '';
      
      const detailsText = emailData.details ? `Details: ${emailData.details}` : '';

      const subject = this.replaceVariables(template.subject, emailData);
      const htmlBody = this.replaceVariables(template.body_html, {
        ...emailData,
        details_section: detailsSection,
        details_text: detailsText
      });
      const textBody = this.replaceVariables(template.body_text, {
        ...emailData,
        details_text: detailsText
      });

      // Send email and return the email log ID
      const emailLogId = await this.sendEmail({
        to: emailData.to,
        subject,
        html: htmlBody,
        text: textBody
      });

      return emailLogId;
    } catch (error) {
      logger.error('Error in sendHiredEmail:', error);
      return null;
    }
  }

  /**
   * Send post-interview rejection email
   */
  static async sendPostInterviewRejectionEmail(emailData: EmailData): Promise<number | null> {
    try {
      const template = await this.getEmailTemplate('post_interview_rejected');
      if (!template) {
        logger.error('Post interview rejection email template not found');
        return null;
      }

      const feedbackSection = emailData.reason ? 
        `<h4>Feedback:</h4><p>${emailData.reason}</p>` : '';
      
      const feedbackText = emailData.reason ? `Feedback: ${emailData.reason}` : '';

      const subject = this.replaceVariables(template.subject, emailData);
      const htmlBody = this.replaceVariables(template.body_html, {
        ...emailData,
        feedback_section: feedbackSection,
        feedback_text: feedbackText
      });
      const textBody = this.replaceVariables(template.body_text, {
        ...emailData,
        feedback_text: feedbackText
      });

      // Send email and return the email log ID
      const emailLogId = await this.sendEmail({
        to: emailData.to,
        subject,
        html: htmlBody,
        text: textBody
      });

      return emailLogId;
    } catch (error) {
      logger.error('Error in sendPostInterviewRejectionEmail:', error);
      return null;
    }
  }

  /**
   * Send interview reminder emails (1 week, 1 day, 1 hour)
   */
  static async sendInterviewReminder(
    reminderType: '1week' | '1day' | '1hour',
    emailData: EmailData
  ): Promise<number | null> {
    try {
      const templateName = `interview_reminder_${reminderType}`;
      const template = await this.getEmailTemplate(templateName);
      
      if (!template) {
        logger.error(`Interview reminder template not found: ${templateName}`);
        return null;
      }

      const subject = this.replaceVariables(template.subject, emailData);
      const htmlBody = this.replaceVariables(template.body_html, emailData);
      const textBody = this.replaceVariables(template.body_text, emailData);

      // Send email and return the email log ID
      const emailLogId = await this.sendEmail({
        to: emailData.to,
        subject,
        html: htmlBody,
        text: textBody
      });

      return emailLogId;
    } catch (error) {
      logger.error(`Error in send${reminderType}Reminder:`, error);
      return null;
    }
  }


  /**
   * Get user's unread notifications
   */
  static async getUserNotifications(userId: number): Promise<any[]> {
    const connection = getConnection();
    try {
      const [notifications] = await connection.execute(`
        SELECT id, title, message, type, created_at, is_read
        FROM user_notifications 
        WHERE user_id = ? AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 50
      `, [userId]);

      return notifications as any[];
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: number): Promise<void> {
    const connection = getConnection();
    try {
      await connection.execute(`
        UPDATE user_notifications 
        SET is_read = TRUE 
        WHERE id = ?
      `, [notificationId]);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  /**
   * Clean up expired notifications (called by cron job)
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    const connection = getConnection();
    try {
      const [result] = await connection.execute(`
        DELETE FROM user_notifications 
        WHERE expires_at <= NOW()
      `);

      logger.info(`Cleaned up expired notifications: ${(result as any).affectedRows} rows deleted`);
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
    }
  }

  /**
   * Get email template from database
   */
  private static async getEmailTemplate(templateName: string): Promise<any> {
    const connection = getConnection();
    try {
      const [templates] = await connection.execute(`
        SELECT subject, body_html, body_text 
        FROM email_templates 
        WHERE template_name = ?
      `, [templateName]);

      const templateArray = templates as any[];
      return templateArray.length > 0 ? templateArray[0] : null;
    } catch (error) {
      logger.error('Error fetching email template:', error);
      return null;
    }
  }

  /**
   * Replace variables in email templates
   */
  private static replaceVariables(template: string, data: any): string {
    let result = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      const value = data[key] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Send OTP email for registration/verification
   */
  static async sendOTP(email: string, otp: string, purpose: string): Promise<boolean> {
    try {
      const subject = `Your OTP Code for ${purpose}`;
      const html = `
        <h2>Email Verification</h2>
        <p>Your OTP code for ${purpose} is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #16a34a; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `;
      const text = `Your OTP code for ${purpose}: ${otp}. This code will expire in 10 minutes.`;

      await this.sendEmail({ to: email, subject, html, text });
      return true;
    } catch (error) {
      logger.error('Error sending OTP email:', error);
      return false;
    }
  }

  /**
   * Send approval/rejection email for admin decisions
   */
  static async sendApprovalEmail(email: string, type: string, approved: boolean, reason?: string): Promise<boolean> {
    try {
      const subject = approved 
        ? `Account Approved - Welcome to Asiatech Career Center!`
        : `Account Application Update`;
      
      const html = approved 
        ? `
          <h2>Congratulations! Your account has been approved</h2>
          <p>Your ${type} account for Asiatech Career Center has been approved by our admin team.</p>
          <p>You can now log in and start using the platform.</p>
          <p>Best regards,<br>Asiatech Career Center Admin Team</p>
        `
        : `
          <h2>Account Application Update</h2>
          <p>We regret to inform you that your ${type} account application has not been approved at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You may reapply in the future if you believe this decision was made in error.</p>
          <p>Best regards,<br>Asiatech Career Center Admin Team</p>
        `;

      const text = approved
        ? `Your ${type} account has been approved! You can now log in to Asiatech Career Center.`
        : `Your ${type} account application was not approved. ${reason ? `Reason: ${reason}` : ''}`;

      await this.sendEmail({ to: email, subject, html, text });
      return true;
    } catch (error) {
      logger.error('Error sending approval email:', error);
      return false;
    }
  }

  /**
   * Send welcome email after successful registration
   */
  static async sendWelcomeEmail(email: string, name: string, role: string): Promise<boolean> {
    try {
      const subject = 'Welcome to Asiatech Career Center!';
      const html = `
        <h2>Welcome to Asiatech Career Center, ${name}!</h2>
        <p>Your ${role} account has been successfully created.</p>
        <p>You can now log in and start exploring opportunities.</p>
        <p>Best regards,<br>Asiatech Career Center Team</p>
      `;
      const text = `Welcome to Asiatech Career Center, ${name}! Your ${role} account has been successfully created.`;

      await this.sendEmail({ to: email, subject, html, text });
      return true;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send company invitation email from coordinator
   */
  static async sendCompanyInvitation(invitationData: {
    recipientEmail: string;
    recipientName: string;
    coordinatorName: string;
    coordinatorEmail: string;
    course: string;
    invitationLink: string;
    invitationCode: string;
  }): Promise<boolean> {
    try {
      const subject = `Invitation to Join Asiatech Career Center - ${invitationData.course}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #28a745; margin-bottom: 10px;">You're Invited to Join Asiatech Career Center!</h2>
            <p style="color: #666; font-size: 16px;">Invitation from ${invitationData.coordinatorName}</p>
          </div>
          
          <p>Dear ${invitationData.recipientName},</p>
          <p>You have been invited by <strong>${invitationData.coordinatorName}</strong> (${invitationData.coordinatorEmail}) to join Asiatech Career Center as a company partner for the <strong>${invitationData.course}</strong> program.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border: 2px solid #28a745; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h3 style="color: #28a745; margin: 0 0 15px 0;">Your Invitation Code</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; border: 2px dashed #28a745;">
              ${invitationData.invitationCode}
            </div>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
              Copy this code to use during registration
            </p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #28a745; margin: 0 0 15px 0;">How to Register:</h4>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Visit the <a href="${invitationData.invitationLink}" style="color: #007bff;">ACC Registration Page</a></li>
              <li>Select "Company/Business Owner" as your role</li>
              <li>Enter the invitation code above when prompted</li>
              <li>Complete your company profile</li>
            </ol>
          </div>
          
          <p><strong>As a company partner, you will be able to:</strong></p>
          <ul style="line-height: 1.6;">
            <li>Post job opportunities for students and graduates</li>
            <li>Review and manage job applications</li>
            <li>Connect with talented students from ${invitationData.course}</li>
            <li>Schedule interviews and make hiring decisions</li>
            <li>Access a pool of qualified candidates</li>
          </ul>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">⚠️ Important:</p>
            <p style="margin: 5px 0 0 0;">This invitation code is valid for 7 days and can only be used once. Please register as soon as possible to secure your access.</p>
          </div>
          
          <p>If you have any questions about the registration process or the platform, please don't hesitate to contact the coordinator:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Coordinator:</strong> ${invitationData.coordinatorName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Email:</strong> <a href="mailto:${invitationData.coordinatorEmail}" style="color: #007bff;">${invitationData.coordinatorEmail}</a></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationData.invitationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Start Registration Now
            </a>
          </div>
          
          <p>Thank you for your interest in partnering with Asiatech Career Center!</p>
          
          <p>Best regards,<br><strong>Asiatech Career Center Team</strong></p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This invitation expires on ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}. If you're not interested in joining, you can safely ignore this email.
          </p>
        </div>
      `;

      const text = `You're invited to join Asiatech Career Center by ${invitationData.coordinatorName}.

Your Invitation Code: ${invitationData.invitationCode}

To register:
1. Visit: ${invitationData.invitationLink}
2. Select "Company/Business Owner" as your role
3. Enter the invitation code: ${invitationData.invitationCode}
4. Complete your company profile

This invitation is valid for 7 days. For questions, contact ${invitationData.coordinatorEmail}.`;

      await this.sendEmail({ to: invitationData.recipientEmail, subject, html, text });
      logger.info(`Company invitation sent to ${invitationData.recipientEmail} by coordinator ${invitationData.coordinatorName}`);
      return true;

    } catch (error) {
      logger.error('Error sending company invitation:', error);
      return false;
    }
  }

  /**
   * Send email using nodemailer
   */
  private static async sendEmail({
    to, subject, html, text
  }: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<number | null> {
    const connection = getConnection();
    let emailLogId: number | null = null;
    let emailSent = false;
    
    try {
      const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'noreply@asiatech.edu.ph';
      
      // Log email configuration for debugging
      logger.info(`📧 Sending email via ${process.env.EMAIL_SERVICE === 'gmail' ? 'Gmail' : 'Custom SMTP'} to ${to}`);
      
      // Create transporter dynamically to use current environment variables
      const transporter = this.createTransporter();
      
      // First, log the email to database before sending
      const [result] = await connection.execute(`
        INSERT INTO email_notifications (
          recipient_email, 
          subject, 
          body, 
          type, 
          is_sent, 
          error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        to,
        subject,
        html,
        'system_email',
        false, // Will be updated to true if sent successfully
        null
      ]);
      
      emailLogId = (result as any).insertId;
      
      // Now attempt to send the email
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        text
      });

      // Update the email log to mark as sent successfully
      await connection.execute(`
        UPDATE email_notifications 
        SET is_sent = TRUE, sent_at = NOW() 
        WHERE id = ?
      `, [emailLogId]);
      
      emailSent = true;
      logger.info(`✅ Email sent successfully to ${to}: ${subject} (Log ID: ${emailLogId})`);
      
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}: ${subject}`, error);
      
      // Update email log with error if we created one
      if (emailLogId) {
        try {
          await connection.execute(`
            UPDATE email_notifications 
            SET error_message = ? 
            WHERE id = ?
          `, [
            error instanceof Error ? error.message : 'Unknown error',
            emailLogId
          ]);
        } catch (updateError) {
          logger.error('Failed to update email error log:', updateError);
        }
      }
      
      // Don't throw error to prevent breaking application flow
      // The notification will still be added to user's profile
    }
    
    return emailLogId; // Return the email log ID for linking with notifications
  }


  /**
   * Add profile notification for in-app notifications
   */
  static async addProfileNotification(notificationData: {
    userId: number;
    title: string;
    message: string;
    type: 'interview_reminder' | 'application_status' | 'system';
    relatedId?: number;
  }): Promise<boolean> {
    const connection = getConnection();
    
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire after 7 days

      await connection.execute(`
        INSERT INTO user_notifications (
          user_id, title, message, type, related_id, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notificationData.userId,
        notificationData.title,
        notificationData.message,
        notificationData.type,
        notificationData.relatedId || null,
        expiresAt
      ]);

      logger.info(`Profile notification added for user ${notificationData.userId}: ${notificationData.title}`);
      return true;

    } catch (error) {
      logger.error('Error adding profile notification:', error);
      return false;
    }
  }
}