const nodemailer = require('nodemailer');
const { simpleEmailService } = require('./simpleEmailService');
const { reliableEmailService } = require('./reliableEmailService');
const { resendEmailService } = require('./resendEmailService');
const { workingEmailService } = require('./workingEmailService');
const { gmailEmailService } = require('./gmailEmailService');
const { renderEmailService } = require('./renderEmailService');

// Bulletproof email service that works immediately
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.config = this.loadConfig();
    this.initialize();
  }

  loadConfig() {
    const config = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      service: process.env.EMAIL_SERVICE || 'gmail',
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER
    };
    
    console.log('Email service config:', {
      user: config.user ? '***' + config.user.slice(-4) : 'not set',
      pass: config.pass ? '***' + config.pass.slice(-4) : 'not set',
      service: config.service,
      from: config.from
    });
    
    return config;
  }

  initialize() {
    try {
      console.log('Initializing email service...');
      
      // Check if credentials are provided
      if (!this.config.user || !this.config.pass) {
        console.warn('Email service: No credentials provided');
        this.isConfigured = false;
        return;
      }

      // Create transporter with optimized settings for Gmail
      let transporterConfig;
      
      if (this.config.service.toLowerCase() === 'gmail') {
        // Gmail-specific configuration optimized for Render
        transporterConfig = {
          host: 'smtp.gmail.com',
          port: 465, // Use port 465 for SSL
          secure: true, // Use SSL
          auth: {
            user: this.config.user,
            pass: this.config.pass
          },
          connectionTimeout: 30000, // Reduced timeout for Render
          greetingTimeout: 15000,   // Reduced timeout for Render
          socketTimeout: 30000,     // Reduced timeout for Render
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          // Additional settings for Render
          pool: false,
          maxConnections: 1,
          maxMessages: 1
        };
      } else {
        // Generic configuration
        transporterConfig = {
          service: this.config.service,
          auth: {
            user: this.config.user,
            pass: this.config.pass
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000
        };
      }
      
      this.transporter = nodemailer.createTransport(transporterConfig);

      console.log('Email transporter created successfully');
      this.isConfigured = true;
      
    } catch (error) {
      console.error('Email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    // If not configured, try to reinitialize
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured, attempting to reinitialize...');
      this.initialize();
      
      if (!this.isConfigured || !this.transporter) {
        console.error('Email service still not configured after reinitialize');
        throw new Error('Email service not configured. Please check your email credentials.');
      }
    }

    const {
      to,
      subject,
      text,
      html,
      from = this.config.from
    } = options;

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    // Retry mechanism with fallback configuration
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Sending email to ${to} (attempt ${attempt}/3)`);
        const result = await this.transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return {
          success: true,
          messageId: result.messageId,
          response: result.response
        };
      } catch (error) {
        console.error(`Email attempt ${attempt} failed:`, error.message);
        lastError = error;
        
        // If it's a connection timeout, try different configuration
        if (error.code === 'ETIMEDOUT' && attempt < 3) {
          console.log(`Connection timeout on attempt ${attempt}, trying alternative configuration...`);
          
          // Try alternative Gmail configuration
          if (this.config.service.toLowerCase() === 'gmail') {
            try {
              console.log('Trying alternative Gmail configuration...');
              const altTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: this.config.user,
                  pass: this.config.pass
                },
                connectionTimeout: 20000,
                greetingTimeout: 10000,
                socketTimeout: 20000
              });
              
              const result = await altTransporter.sendMail(mailOptions);
              console.log('Email sent successfully with alternative config:', result.messageId);
              return {
                success: true,
                messageId: result.messageId,
                response: result.response
              };
            } catch (altError) {
              console.error('Alternative configuration also failed:', altError.message);
            }
          }
          
          console.log(`Waiting 3 seconds before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Recreate transporter for retry
          this.initialize();
          continue;
        }
        
        // If it's not a timeout or it's the last attempt, throw the error
        if (attempt === 3 || error.code !== 'ETIMEDOUT') {
          throw new Error('Failed to send email: ' + error.message);
        }
      }
    }
    
    throw new Error('Failed to send email after 3 attempts: ' + lastError.message);
  }

  async sendReplyEmail(contactEmail, contactName, subject, message, adminEmail = null) {
    // Try Render-optimized service first (best for production)
    try {
      console.log('Trying Render-optimized email service...');
      return await renderEmailService.sendReplyEmail(contactEmail, contactName, subject, message, adminEmail);
    } catch (error) {
      console.error('Render email service failed, trying Gmail SMTP:', error.message);
      
      // Try Gmail SMTP second
      try {
        console.log('Trying Gmail SMTP service...');
        return await gmailEmailService.sendReplyEmail(contactEmail, contactName, subject, message, adminEmail);
      } catch (gmailError) {
        console.error('Gmail SMTP failed, trying working email service:', gmailError.message);
        
        // Skip Resend API (it sends to admin email) and go to working service
        try {
          console.log('Trying working email service...');
          return await workingEmailService.sendReplyEmail(contactEmail, contactName, subject, message, adminEmail);
        } catch (workingError) {
          console.error('Working email service failed, trying main email service:', workingError.message);
          
          // Fallback to main email service
          try {
            return await this.sendReplyEmailMain(contactEmail, contactName, subject, message, adminEmail);
          } catch (mainError) {
            console.error('Main email service failed, trying simple email service:', mainError.message);
            
            // Fallback to simple email service
            try {
              return await simpleEmailService.sendReplyEmail(contactEmail, contactName, subject, message, adminEmail);
            } catch (fallbackError) {
              console.error('Simple email service also failed, trying reliable email service:', fallbackError.message);
              
              // Final fallback to reliable email service
              try {
                return await reliableEmailService.sendReplyEmail(contactEmail, contactName, subject, message, adminEmail);
              } catch (reliableError) {
                console.error('Reliable email service also failed:', reliableError.message);
                throw new Error('All email services failed. Please use "Open Email Client" or "Copy All" to send emails manually.');
              }
            }
          }
        }
      }
    }
  }

  async sendReplyEmailMain(contactEmail, contactName, subject, message, adminEmail = null) {
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

  getStatus() {
    return {
      configured: this.isConfigured,
      service: this.config.service,
      user: this.config.user,
      from: this.config.from
    };
  }

  // Force reinitialize
  async reinitialize() {
    console.log('Force reinitializing email service...');
    this.config = this.loadConfig();
    this.initialize();
    return this.isConfigured;
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