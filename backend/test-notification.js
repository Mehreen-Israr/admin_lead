// Test script for notification model with new types
require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');

async function testNotificationTypes() {
  try {
    console.log('🧪 Testing Notification Model with new types...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test creating notifications with new types
    const testNotifications = [
      {
        title: 'Email Sent Test',
        message: 'Test email sent successfully',
        type: 'email_sent',
        priority: 'low'
      },
      {
        title: 'Booking Updated Test',
        message: 'Test booking status updated',
        type: 'booking_updated',
        priority: 'medium'
      }
    ];
    
    console.log('📝 Testing notification creation...');
    
    for (const notificationData of testNotifications) {
      try {
        const notification = new Notification(notificationData);
        await notification.save();
        console.log(`✅ Created notification: ${notificationData.type}`);
      } catch (error) {
        console.error(`❌ Failed to create ${notificationData.type}:`, error.message);
      }
    }
    
    // Clean up test notifications
    console.log('\n🧹 Cleaning up test notifications...');
    await Notification.deleteMany({ 
      type: { $in: ['email_sent', 'booking_updated'] },
      title: { $regex: /Test/ }
    });
    console.log('✅ Test notifications cleaned up');
    
    console.log('\n🎉 Notification model test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test
testNotificationTypes().catch(console.error);
