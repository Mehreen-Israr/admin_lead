// Test script for Resend email service
require('dotenv').config();

// Set the API key directly for testing
process.env.RESEND_API_KEY = 're_SRFUUZoR_LcUQFvFgvap3HXyXhf2haypL';

const { resendEmailService } = require('./services/resendEmailService');

async function testResendService() {
  console.log('🧪 Testing Resend Email Service...\n');
  
  // Check configuration
  const status = resendEmailService.getStatus();
  console.log('📊 Service Status:', status);
  
  if (!status.configured) {
    console.error('❌ Resend service not configured. Please set RESEND_API_KEY environment variable.');
    return;
  }
  
  // Test connection
  console.log('\n🔗 Testing API connection...');
  try {
    const connectionTest = await resendEmailService.testConnection();
    if (connectionTest) {
      console.log('✅ Resend API connection successful');
    } else {
      console.log('❌ Resend API connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test sending email
  console.log('\n📧 Testing email sending...');
  try {
    const testEmail = await resendEmailService.sendEmail({
      to: 'leadmagnet.notifications@gmail.com', // Must use verified email for @resend.dev
      subject: 'Resend API Test - Lead Magnet',
      text: 'This is a test email from Lead Magnet using Resend API.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Resend API Test - Lead Magnet</h2>
          <p>This is a test email from Lead Magnet using <strong>Resend API</strong>.</p>
          <p>If you receive this, the Resend service is working correctly!</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
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
testResendService().catch(console.error);
