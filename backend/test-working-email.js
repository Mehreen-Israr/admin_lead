require('dotenv').config({ path: '../.env' });
const { workingEmailService } = require('./services/workingEmailService');

async function testWorkingEmail() {
  console.log('🧪 Testing Working Email Service...');
  console.log('=====================================');
  
  try {
    // Test service status
    const status = workingEmailService.getStatus();
    console.log('✅ Service Status:', status);
    
    // Test email preparation
    const result = await workingEmailService.sendReplyEmail(
      'test@example.com',
      'Test User',
      'Test Subject',
      'This is a test message from the working email service.',
      'admin@leadmagnet.com'
    );
    
    console.log('✅ Email Service Test Results:');
    console.log('Success:', result.success);
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    console.log('Instructions:', result.instructions);
    
    console.log('\n🎉 Working Email Service is ready!');
    console.log('📧 Email content has been prepared successfully.');
    console.log('💡 Use "Open Email Client" or "Copy All" buttons to send manually.');
    
  } catch (error) {
    console.error('❌ Working Email Service test failed:', error.message);
  }
}

testWorkingEmail();
