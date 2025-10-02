require('dotenv').config();

// Set the credentials directly for testing
process.env.EMAIL_HOST = 'smtp.gmail.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'leadmagnet.notifications@gmail.com';
process.env.EMAIL_PASS = 'drjipelanfuflzbt';

const { renderEmailService } = require('./services/renderEmailService');

async function testRenderService() {
  console.log('🧪 Testing Render-Optimized Email Service...\n');
  
  // Check configuration
  const status = renderEmailService.getStatus();
  console.log('📊 Service Status:', status);

  if (!status.configured) {
    console.error('❌ Render service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    return;
  }

  // Test connection
  console.log('\n🔗 Testing SMTP connection...');
  try {
    const connectionTest = await renderEmailService.testConnection();
    if (connectionTest) {
      console.log('✅ Render SMTP connection successful');
    } else {
      console.error('❌ Render SMTP connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test sending email
  console.log('\n📧 Testing email sending...');
  try {
    const testEmail = await renderEmailService.sendEmail({
      to: 'mehreenisrar.26@gmail.com', // Test sending to a contact email
      subject: 'Render-Optimized Test - Lead Magnet',
      text: 'This is a test email from Lead Magnet using Render-optimized SMTP.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Render-Optimized Test - Lead Magnet</h2>
          <p>This is a test email from Lead Magnet admin panel using <strong>Render-optimized SMTP</strong>.</p>
          <p>If you receive this, the Render email service is working correctly!</p>
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

testRenderService();
