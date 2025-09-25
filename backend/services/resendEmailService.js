// Professional email service using Resend API that works on Render
const axios = require('axios');

class ResendEmailService {
  constructor() {
    this.isConfigured = false;
    this.config = this.loadConfig();
    this.initialize();
  }

  loadConfig() {
    return {
      apiKey: process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY,
      fromEmail: process.env.EMAIL_USER || 'leadmagnet.notifications@gmail.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Lead Magnet Admin'
    };
  }

  initialize() {
    try {
      if (!this.config.apiKey) {
        console.warn('Resend email service: No API key provided');
        this.isConfigured = false;
        return;
      }

      console.log('Resend email service: Initializing...');
      this.isConfigured = true;
      console.log('Resend email service: Ready');
    } catch (error) {
      console.error('Resend email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured) {
      throw new Error('Resend email service not configured. Please set RESEND_API_KEY environment variable.');
    }

    const { to, subject, text, html, from = this.config.fromEmail } = options;

    try {
      console.log('Sending email via Resend API...');
      
      const emailData = {
        from: `${this.config.fromName} <${from}>`,
        to: [to],
        subject: subject,
        text: text,
        html: html
      };

      const response = await axios.post('https://api.resend.com/emails', emailData, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('Email sent successfully via Resend API');
      return {
        success: true,
        messageId: response.data.id,
        response: 'Email sent via Resend API',
        data: response.data
      };

    } catch (error) {
      console.error('Resend API failed:', error.response?.data || error.message);
      throw new Error('Resend API failed: ' + (error.response?.data?.message || error.message));
    }
  }

  async sendReplyEmail(contactEmail, contactName, subject, message, adminEmail = null) {
    const fromEmail = adminEmail || this.config.fromEmail;
    
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
      service: 'resend',
      fromEmail: this.config.fromEmail
    };
  }
}

// Create singleton instance
const resendEmailService = new ResendEmailService();

module.exports = {
  resendEmailService
};
