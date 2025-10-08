require('dotenv').config();

// Set the API key directly for testing
process.env.RESEND_API_KEY = 're_SRFUUZoR_LcUQFvFgvap3HXyXhf2haypL';

const { httpEmailService } = require('./services/httpEmailService');

async function testHttpService() {
  console.log('🌐 Testing HTTP API Email Service...\n');
  
  // Check configuration
  const status = httpEmailService.getStatus();
  console.log('📊 Service Status:', status);

  if (!status.configured) {
    console.error('❌ HTTP service not configured. Please set RESEND_API_KEY environment variable.');
    return;
  }

  // Test connection
  console.log('\n🔗 Testing API connection...');
  try {
    const connectionTest = await httpEmailService.testConnection();
    if (connectionTest) {
      console.log('✅ HTTP API connection successful');
    } else {
      console.error('❌ HTTP API connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test sending email
  console.log('\n📧 Testing email sending...');
  try {
    const testEmail = await httpEmailService.sendEmail({
      to: 'leadmagnet.notifications@gmail.com', // Send to verified email for testing
      subject: 'HTTP API Test - Lead Magnet',
      text: 'This is a test email from Lead Magnet using HTTP API.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">HTTP API Test - Lead Magnet</h2>
          <p>This is a test email from Lead Magnet admin panel using <strong>HTTP API</strong>.</p>
          <p>If you receive this, the HTTP email service is working correctly!</p>
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

testHttpService();
