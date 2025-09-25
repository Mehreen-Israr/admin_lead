let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('Nodemailer not available. Email functionality will be disabled.');
  nodemailer = null;
}

// Email configuration
const createTransporter = () => {
  if (!nodemailer) {
    throw new Error('Email service not configured. Please install nodemailer and configure email settings.');
  }
  
  // For development, you can use Gmail SMTP or any other email service
  // You'll need to set up environment variables for production
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password' // Use app password for Gmail
    }
  });
};

// Send reply email to contact
const sendReplyEmail = async (contactEmail, contactName, subject, message, adminEmail = 'admin@leadmagnet.com') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: adminEmail,
      to: contactEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Reply from Lead Magnet Admin</h2>
            <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <p>This email was sent from the Lead Magnet admin panel.</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
          </div>
        </div>
      `,
      text: message // Plain text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

// Send notification email to admin when new contact is created
const sendContactNotification = async (contact, adminEmail = 'admin@leadmagnet.com') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: adminEmail,
      subject: `New Contact: ${contact.name} - ${contact.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">New Contact Received</h2>
            <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3>Contact Details:</h3>
              <p><strong>Name:</strong> ${contact.name}</p>
              <p><strong>Email:</strong> ${contact.email}</p>
              <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
              <p><strong>Company:</strong> ${contact.company || 'Not provided'}</p>
              <p><strong>Service:</strong> ${contact.service || 'Not specified'}</p>
              <p><strong>Message:</strong></p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0;">
                ${contact.message || 'No message provided'}
              </div>
              <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `,
      text: `
New Contact Received

Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone || 'Not provided'}
Company: ${contact.company || 'Not provided'}
Service: ${contact.service || 'Not specified'}
Message: ${contact.message || 'No message provided'}
Received: ${new Date().toLocaleString()}
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Contact notification sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending contact notification:', error);
    throw new Error('Failed to send contact notification: ' + error.message);
  }
};

module.exports = {
  sendReplyEmail,
  sendContactNotification
};
