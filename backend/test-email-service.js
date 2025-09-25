// Test script to verify email service works
const EmailService = require('./services/emailService');

async function testEmailService() {
  console.log('Testing email service...');
  
  try {
    // Check service status
    const status = EmailService.emailService.getStatus();
    console.log('Email service status:', status);
    
    if (!status.configured) {
      console.log('❌ Email service not configured');
      return false;
    }
    
    console.log('✅ Email service is configured');
    
    // Test sending a simple email
    console.log('Testing email sending...');
    const result = await EmailService.sendReplyEmail(
      'leadmagnet.notifications@gmail.com', // Send to self for testing
      'Test User',
      'Test Email from Lead Magnet',
      'This is a test email to verify the email service is working correctly.\n\nIf you receive this, the email service is working!',
      'leadmagnet.notifications@gmail.com'
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    return false;
  }
}

// Run the test
testEmailService().then(success => {
  if (success) {
    console.log('🎉 Email service test passed!');
    process.exit(0);
  } else {
    console.log('💥 Email service test failed');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
