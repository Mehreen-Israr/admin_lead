// Simple email service that works reliably on Render
const nodemailer = require('nodemailer');

class SimpleEmailService {
  constructor() {
    this.isConfigured = false;
    this.config = this.loadConfig();
    this.initialize();
  }

  loadConfig() {
    return {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      service: process.env.EMAIL_SERVICE || 'gmail'
    };
  }

  initialize() {
    try {
      if (!this.config.user || !this.config.pass) {
        console.warn('Simple email service: No credentials provided');
        this.isConfigured = false;
        return;
      }

      console.log('Simple email service: Initializing...');
      this.isConfigured = true;
      console.log('Simple email service: Ready');
    } catch (error) {
      console.error('Simple email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured) {
      throw new Error('Simple email service not configured');
    }

    const { to, subject, text, html, from = this.config.user } = options;

    // Try multiple Gmail configurations
    const configurations = [
      // Configuration 1: Standard Gmail
      {
        service: 'gmail',
        auth: {
          user: this.config.user,
          pass: this.config.pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      },
      // Configuration 2: Direct SMTP
      {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false
        }
      },
      // Configuration 3: SSL
      {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false
        }
      }
    ];

    let lastError;
    for (let i = 0; i < configurations.length; i++) {
      try {
        console.log(`Trying email configuration ${i + 1}/${configurations.length}`);
        const transporter = nodemailer.createTransport(configurations[i]);
        
        const mailOptions = {
          from: from,
          to: to,
          subject: subject,
          text: text,
          html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully with configuration', i + 1);
        return {
          success: true,
          messageId: result.messageId,
          response: result.response
        };
      } catch (error) {
        console.error(`Configuration ${i + 1} failed:`, error.message);
        lastError = error;
        
        // If not the last configuration, try the next one
        if (i < configurations.length - 1) {
          console.log('Trying next configuration...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw new Error('All email configurations failed: ' + lastError.message);
  }

  async sendReplyEmail(contactEmail, contactName, subject, message, adminEmail = null) {
    const fromEmail = adminEmail || this.config.user;
    
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

  getStatus() {
    return {
      configured: this.isConfigured,
      service: this.config.service,
      user: this.config.user
    };
  }
}

// Create singleton instance
const simpleEmailService = new SimpleEmailService();

module.exports = {
  simpleEmailService
};
