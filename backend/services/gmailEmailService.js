// Gmail SMTP email service using Nodemailer
const nodemailer = require('nodemailer');

class GmailEmailService {
  constructor() {
    this.isConfigured = false;
    this.transporter = null;
    this.config = this.loadConfig();
    this.initialize();
  }

  loadConfig() {
    return {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      user: process.env.EMAIL_USER || 'leadmagnet.notifications@gmail.com',
      pass: process.env.EMAIL_PASS || 'drjipelanfuflzbt'
    };
  }

  initialize() {
    try {
      console.log('Gmail email service: Initializing...');
      
      if (!this.config.user || !this.config.pass) {
        console.warn('Gmail email service: No credentials provided');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: false, // false = TLS on port 587
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        tls: {
          rejectUnauthorized: false, // avoids TLS issues on Render
        },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000
      });

      console.log('Gmail email service: Ready');
      this.isConfigured = true;
    } catch (error) {
      console.error('Gmail email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Gmail email service not configured. Please check your email credentials.');
    }

    const { to, subject, text, html, from = this.config.user } = options;

    try {
      console.log('Sending email via Gmail SMTP...');
      
      const mailOptions = {
        from: `"Lead Magnet Admin" <${from}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        text: text,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully via Gmail SMTP:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        response: 'Email sent via Gmail SMTP',
        data: info
      };

    } catch (error) {
      console.error('Gmail SMTP failed:', error);
      throw new Error('Gmail SMTP failed: ' + error.message);
    }
  }

  async sendReplyEmail(contactEmail, contactName, subject, message, adminEmail = null) {
    const fromEmail = adminEmail || this.config.user;
    
    const textTemplate = `
Reply from Lead Magnet Team

Hi ${contactName},

${message}

Best regards,
Lead Magnet Team

---
This email was sent from the Lead Magnet admin panel.
If you have any questions, please don't hesitate to contact us.
    `;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reply from Lead Magnet</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Lead Magnet</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Professional Lead Management</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">Reply from our team</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #333333; line-height: 1.6;">
                Hi ${contactName},<br><br>
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                Best regards,<br>
                Lead Magnet Team
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Lead Magnet. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: contactEmail, // Send directly to the contact
      subject: subject,
      text: textTemplate,
      html: htmlTemplate,
      from: fromEmail
    });
  }

  async testConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Gmail SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('Gmail SMTP connection test failed:', error.message);
      return false;
    }
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      service: 'gmail-smtp',
      fromEmail: this.config.user,
      fromName: 'Lead Magnet Admin'
    };
  }
}

// Create singleton instance
const gmailEmailService = new GmailEmailService();

module.exports = {
  gmailEmailService
};
