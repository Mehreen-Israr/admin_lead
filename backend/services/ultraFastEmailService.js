const nodemailer = require('nodemailer');

class UltraFastEmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.config = this.loadConfig();
    this.initialize();
  }

  loadConfig() {
    return {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      fromName: process.env.EMAIL_FROM_NAME || 'Lead Magnet Admin'
    };
  }

  initialize() {
    try {
      console.log('Ultra-fast email service: Initializing...');

      if (!this.config.user || !this.config.pass) {
        console.warn('Ultra-fast email service: No credentials provided');
        this.isConfigured = false;
        return;
      }

      // Ultra-aggressive settings for Render
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: false,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        // Ultra-aggressive timeouts for Render
        connectionTimeout: 8000,   // 8 seconds
        greetingTimeout: 5000,     // 5 seconds
        socketTimeout: 8000,      // 8 seconds
        // No pooling
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
        // No retries
        retryDelay: 0,
        retryAttempts: 0
      });

      console.log('Ultra-fast email service: Ready');
      this.isConfigured = true;
    } catch (error) {
      console.error('Ultra-fast email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Ultra-fast email service not configured. Please check your email credentials.');
    }

    const { to, subject, text, html, from = this.config.user } = options;

    try {
      console.log('Sending email via ultra-fast SMTP...');
      
      const mailOptions = {
        from: `"Lead Magnet Admin" <${from}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        text: text,
        html: html,
        headers: {
          'X-Mailer': 'Lead Magnet Admin Panel',
          'X-Priority': '3'
        }
      };

      // Ultra-aggressive timeout for Render
      const sendWithTimeout = (mailOptions, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Email send timeout'));
          }, timeout);

          this.transporter.sendMail(mailOptions, (error, info) => {
            clearTimeout(timer);
            if (error) {
              reject(error);
            } else {
              resolve(info);
            }
          });
        });
      };

      const info = await sendWithTimeout(mailOptions);
      console.log('Email sent successfully via ultra-fast SMTP:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        response: 'Email sent via ultra-fast SMTP',
        data: info
      };

    } catch (error) {
      console.error('Ultra-fast SMTP failed:', error);
      throw new Error('Ultra-fast SMTP failed: ' + error.message);
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
      console.log('Ultra-fast SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('Ultra-fast SMTP connection test failed:', error.message);
      return false;
    }
  }

  async reinitialize() {
    console.log('Reinitializing ultra-fast email service...');
    this.config = this.loadConfig();
    this.initialize();
    return this.isConfigured;
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      service: 'ultra-fast-smtp',
      fromEmail: this.config.user,
      fromName: this.config.fromName
    };
  }
}

const ultraFastEmailService = new UltraFastEmailService();

module.exports = {
  ultraFastEmailService
};
