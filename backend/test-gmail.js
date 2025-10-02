// Test script for Gmail SMTP email service
require('dotenv').config();
const { gmailEmailService } = require('./services/gmailEmailService');

async function testGmailService() {
  console.log('🧪 Testing Gmail SMTP Email Service...\n');
  
  // Check configuration
  const status = gmailEmailService.getStatus();
  console.log('📊 Service Status:', status);
  
  if (!status.configured) {
    console.error('❌ Gmail service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    return;
  }
  
  // Test connection
  console.log('\n🔗 Testing SMTP connection...');
  try {
    const connectionTest = await gmailEmailService.testConnection();
    if (connectionTest) {
      console.log('✅ Gmail SMTP connection successful');
    } else {
      console.log('❌ Gmail SMTP connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test sending email
  console.log('\n📧 Testing email sending...');
  try {
    const testEmail = await gmailEmailService.sendEmail({
      to: 'leadmagnet.notifications@gmail.com', // Send to your own email for testing
      subject: 'Gmail SMTP Test - Lead Magnet',
      text: 'This is a test email from Lead Magnet using Gmail SMTP.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Gmail SMTP Test - Lead Magnet</h2>
          <p>This is a test email from Lead Magnet using <strong>Gmail SMTP</strong>.</p>
          <p>If you receive this, the Gmail service is working correctly!</p>
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              <strong>Service:</strong> Gmail SMTP<br>
              <strong>Sent at:</strong> ${new Date().toLocaleString()}<br>
              <strong>Status:</strong> ✅ Working
            </p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Email ID:', testEmail.messageId);
    console.log('📊 Response:', testEmail.response);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
  }
}

// Run the test
testGmailService().catch(console.error);
