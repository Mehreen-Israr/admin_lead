const nodemailer = require('nodemailer');

// Professional email service with comprehensive error handling
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.config = this.loadConfig();
    this.initializeTransporter();
  }

  loadConfig() {
    const config = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER
    };
    
    console.log('Email service config loaded:', {
      user: config.user ? '***' + config.user.slice(-4) : 'not set',
      pass: config.pass ? '***' + config.pass.slice(-4) : 'not set',
      service: config.service,
      from: config.from
    });
    
    return config;
  }

  initializeTransporter() {
    try {
      // Check if email credentials are provided
      if (!this.config.user || !this.config.pass) {
        console.warn('Email service: No credentials provided. Email functionality disabled.');
        console.warn('Please set EMAIL_USER and EMAIL_PASS environment variables in Render.');
        return;
      }

      // Check for default/placeholder values
      if (this.config.user === 'your-email@gmail.com' || 
          this.config.pass === 'your-app-password' ||
          this.config.user.includes('your-email') ||
          this.config.pass.includes('your-')) {
        console.warn('Email service: Placeholder credentials detected. Email functionality disabled.');
        console.warn('Please set real email credentials in Render environment variables.');
        return;
      }

      let transporterConfig;

      // Configure based on service type
      switch (this.config.service.toLowerCase()) {
        case 'gmail':
          transporterConfig = {
            service: 'gmail',
            auth: {
              user: this.config.user,
              pass: this.config.pass
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 20000,
            rateLimit: 5
          };
          break;

        case 'outlook':
        case 'hotmail':
          transporterConfig = {
            service: 'hotmail',
            auth: {
              user: this.config.user,
              pass: this.config.pass
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
          };
          break;

        case 'custom':
          transporterConfig = {
            host: this.config.host || 'smtp.gmail.com',
            port: this.config.port,
            secure: this.config.secure,
            auth: {
              user: this.config.user,
              pass: this.config.pass
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
          };
          break;

        default:
          transporterConfig = {
            service: 'gmail',
            auth: {
              user: this.config.user,
              pass: this.config.pass
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
          };
      }

      this.transporter = nodemailer.createTransporter(transporterConfig);
      this.isConfigured = true;
      
      // Test the connection
      this.testConnection();
      
    } catch (error) {
      console.error('Email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async testConnection() {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
      console.log('Email service: Connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service: Connection verification failed:', error);
      this.isConfigured = false;
      return false;
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Email service not configured. Please check your email credentials.');
    }

    const {
      to,
      subject,
      text,
      html,
      replyTo = this.config.replyTo,
      from = this.config.from
    } = options;

    const mailOptions = {
      from: `${from} <${this.config.user}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      text: text,
      html: html,
      replyTo: replyTo,
      headers: {
        'X-Mailer': 'Lead Magnet Admin',
        'X-Priority': '3',
        'Importance': 'normal'
      }
    };

    try {
      console.log(`Email service: Sending email to ${to}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email service: Email sent successfully. Message ID: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Email service: Send failed:', error);
      
      // Provide specific error messages
      if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Please check your email credentials.');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Email connection failed. Please check your internet connection.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Email sending timed out. Please try again.');
      } else {
        throw new Error(`Email sending failed: ${error.message}`);
      }
    }
  }

  // Send reply email to contact
  async sendReplyEmail(contactEmail, contactName, subject, message, adminEmail = null) {
    const fromEmail = adminEmail || this.config.from;
    
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
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                This email was sent from the Lead Magnet admin panel.<br>
                If you have any questions, please don't hesitate to contact us.
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

    const textTemplate = `
Reply from Lead Magnet Team

${message}

---
This email was sent from the Lead Magnet admin panel.
If you have any questions, please don't hesitate to contact us.
    `;

    return await this.sendEmail({
      to: contactEmail,
      subject: subject,
      text: textTemplate,
      html: htmlTemplate,
      from: fromEmail
    });
  }

  // Send notification email to admin
  async sendContactNotification(contact, adminEmail = null) {
    const toEmail = adminEmail || this.config.from;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact - Lead Magnet</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">New Lead Received</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Lead Magnet Admin Panel</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">Contact Details</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #333333;">${contact.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Email:</td>
                  <td style="padding: 8px 0; color: #333333;">${contact.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Phone:</td>
                  <td style="padding: 8px 0; color: #333333;">${contact.phone || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Company:</td>
                  <td style="padding: 8px 0; color: #333333;">${contact.company || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Service:</td>
                  <td style="padding: 8px 0; color: #333333;">${contact.service || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Received:</td>
                  <td style="padding: 8px 0; color: #333333;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
              
              ${contact.message ? `
                <div style="margin-top: 20px;">
                  <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px;">Message:</h3>
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #dee2e6;">
                    ${contact.message.replace(/\n/g, '<br>')}
                  </div>
                </div>
              ` : ''}
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

    const textTemplate = `
New Lead Received - Lead Magnet

Contact Details:
Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone || 'Not provided'}
Company: ${contact.company || 'Not provided'}
Service: ${contact.service || 'Not specified'}
Received: ${new Date().toLocaleString()}

${contact.message ? `Message:\n${contact.message}` : ''}

---
This notification was sent from the Lead Magnet admin panel.
    `;

    return await this.sendEmail({
      to: toEmail,
      subject: `New Lead: ${contact.name} - ${contact.email}`,
      text: textTemplate,
      html: htmlTemplate,
      from: this.config.from
    });
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured,
      service: this.config.service,
      user: this.config.user,
      from: this.config.from
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export functions for backward compatibility
const sendReplyEmail = async (contactEmail, contactName, subject, message, adminEmail) => {
  return await emailService.sendReplyEmail(contactEmail, contactName, subject, message, adminEmail);
};

const sendContactNotification = async (contact, adminEmail) => {
  return await emailService.sendContactNotification(contact, adminEmail);
};

const createContactFormNotification = async (contact) => {
  return await emailService.sendContactNotification(contact);
};

module.exports = {
  sendReplyEmail,
  sendContactNotification,
  createContactFormNotification,
  emailService
};