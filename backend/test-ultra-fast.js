require('dotenv').config();

// Set the credentials directly for testing
process.env.EMAIL_HOST = 'smtp.gmail.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'leadmagnet.notifications@gmail.com';
process.env.EMAIL_PASS = 'drjipelanfuflzbt';

const { ultraFastEmailService } = require('./services/ultraFastEmailService');

async function testUltraFastService() {
  console.log('🚀 Testing Ultra-Fast Email Service...\n');
  
  // Check configuration
  const status = ultraFastEmailService.getStatus();
  console.log('📊 Service Status:', status);

  if (!status.configured) {
    console.error('❌ Ultra-fast service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    return;
  }

  // Test connection
  console.log('\n🔗 Testing SMTP connection...');
  try {
    const connectionTest = await ultraFastEmailService.testConnection();
    if (connectionTest) {
      console.log('✅ Ultra-fast SMTP connection successful');
    } else {
      console.error('❌ Ultra-fast SMTP connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test sending email
  console.log('\n📧 Testing email sending...');
  try {
    const testEmail = await ultraFastEmailService.sendEmail({
      to: 'mehreenisrar.26@gmail.com', // Test sending to a contact email
      subject: 'Ultra-Fast Test - Lead Magnet',
      text: 'This is a test email from Lead Magnet using ultra-fast SMTP.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Ultra-Fast Test - Lead Magnet</h2>
          <p>This is a test email from Lead Magnet admin panel using <strong>ultra-fast SMTP</strong>.</p>
          <p>If you receive this, the ultra-fast email service is working correctly!</p>
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

testUltraFastService();
