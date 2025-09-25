// Test script to verify email service configuration
const nodemailer = require('nodemailer');

console.log('Testing email service configuration...');

// Check environment variables
console.log('Environment variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-4) : 'not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'not set');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'not set');

// Test email configuration
async function testEmailConfig() {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured');
      return false;
    }

    console.log('✅ Email credentials found');

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    });

    console.log('✅ Transporter created');

    // Test connection
    console.log('Testing connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully');

    // Send test email
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Lead Magnet - Email Test',
      text: 'This is a test email from Lead Magnet backend.',
      html: '<h2>Lead Magnet - Email Test</h2><p>This is a test email from Lead Magnet backend.</p>'
    });

    console.log('✅ Test email sent successfully');
    console.log('Message ID:', result.messageId);
    return true;

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    return false;
  }
}

// Run the test
testEmailConfig().then(success => {
  if (success) {
    console.log('🎉 Email service is working correctly!');
    process.exit(0);
  } else {
    console.log('💥 Email service test failed');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
