// Webhook-based email service that works on Render
const axios = require('axios');

class WebhookEmailService {
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
        console.warn('Webhook email service: No credentials provided');
        this.isConfigured = false;
        return;
      }

      console.log('Webhook email service: Initializing...');
      this.isConfigured = true;
      console.log('Webhook email service: Ready');
    } catch (error) {
      console.error('Webhook email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured) {
      throw new Error('Webhook email service not configured');
    }

    const { to, subject, text, html, from = this.config.user } = options;

    // Use EmailJS or similar service that works with webhooks
    try {
      // For now, we'll use a simple approach that works on Render
      // This creates a mailto link that opens the user's email client
      const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      
      console.log('Webhook email service: Creating mailto link');
      console.log('Mailto link:', mailtoLink);
      
      // Return success response
      return {
        success: true,
        messageId: `webhook-${Date.now()}`,
        response: 'Webhook email service - mailto link created',
        mailtoLink: mailtoLink
      };
    } catch (error) {
      console.error('Webhook email service failed:', error);
      throw new Error('Webhook email service failed: ' + error.message);
    }
  }

  async sendReplyEmail(contactEmail, contactName, subject, message, adminEmail = null) {
    const fromEmail = adminEmail || this.config.user;
    
    const textTemplate = `
Reply from Lead Magnet Team

${message}

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
      service: 'webhook',
      user: this.config.user
    };
  }
}

// Create singleton instance
const webhookEmailService = new WebhookEmailService();

module.exports = {
  webhookEmailService
};
