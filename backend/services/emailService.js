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
  
  // Check if email credentials are configured
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass || emailUser === 'your-email@gmail.com' || emailPass === 'your-app-password') {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables in your deployment settings. For Gmail, use an App Password (not your regular password).');
  }
  
  // Support multiple email services
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  let transporterConfig;
  
  if (emailService === 'gmail') {
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    };
  } else if (emailService === 'outlook') {
    transporterConfig = {
      service: 'hotmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    };
  } else if (emailService === 'custom') {
    // For custom SMTP servers
    transporterConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      }
    };
  } else {
    // Default to Gmail
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    };
  }
  
  // Add timeout and connection settings
  transporterConfig.connectionTimeout = 10000; // 10 seconds
  transporterConfig.greetingTimeout = 10000;   // 10 seconds
  transporterConfig.socketTimeout = 10000;     // 10 seconds
  
  return nodemailer.createTransport(transporterConfig);
};

// Send reply email to contact
const sendReplyEmail = async (contactEmail, contactName, subject, message, adminEmail = process.env.EMAIL_USER || 'leadmagnet.notifications@gmail.com') => {
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

    // Add timeout to the sendMail operation
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout')), 15000)
    );
    
    const result = await Promise.race([sendPromise, timeoutPromise]);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages
    if (error.message.includes('timeout')) {
      throw new Error('Email sending timed out. Please check your email configuration.');
    } else if (error.message.includes('credentials')) {
      throw new Error('Email credentials are invalid. Please check your email settings.');
    } else if (error.message.includes('Connection timeout')) {
      throw new Error('Cannot connect to email server. Please check your internet connection and email settings.');
    } else {
      throw new Error('Failed to send email: ' + error.message);
    }
  }
};

// Send notification email to admin when new contact is created
const sendContactNotification = async (contact, adminEmail = process.env.EMAIL_USER || 'leadmagnet.notifications@gmail.com') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'leadmagnet.notifications@gmail.com',
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
