const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contact = require('../models/Contact');
const adminAuth = require('../middleware/adminAuth');
const Package = require('../models/Package');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
let EmailService;
try {
  EmailService = require('../services/emailService');
} catch (error) {
  console.warn('Email service not available:', error.message);
  EmailService = null;
}
const json2csv = require('json2csv').parse;

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// Get user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// Update user
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// Get all contacts
router.get('/contacts', adminAuth, async (req, res) => {
  try {
    const contacts = await Contact.find({})
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts'
    });
  }
});

// Get contact by ID
router.get('/contacts/:id', adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact'
    });
  }
});

// Delete contact
router.delete('/contacts/:id', adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting contact'
    });
  }
});

// Packages CRUD
router.get('/packages', adminAuth, async (req, res) => {
  try {
    const packages = await Package.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching packages' });
  }
});

router.get('/packages/:id', adminAuth, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching package' });
  }
});

router.post('/packages', adminAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const pkg = new Package({
      name: body.name,
      platform: body.platform,
      description: body.description,
      features: Array.isArray(body.features) ? body.features : (body.features ? [body.features] : []),
      logo: body.logo,
      benefits: Array.isArray(body.benefits) ? body.benefits : (body.benefits ? [body.benefits] : []),
      imageUrl: body.imageUrl,
      pricing: body.pricing,
      price: body.price || 0, // Ensure price is never undefined
      currency: body.currency,
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: body.sortOrder || 0
    });
    await pkg.save();
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error creating package:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + errors.join(', ') 
      });
    }
    res.status(500).json({ success: false, message: 'Server error while creating package' });
  }
});

router.put('/packages/:id', adminAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const update = {
      name: body.name,
      platform: body.platform,
      description: body.description,
      features: Array.isArray(body.features) ? body.features : (body.features ? [body.features] : []),
      logo: body.logo,
      benefits: Array.isArray(body.benefits) ? body.benefits : (body.benefits ? [body.benefits] : []),
      imageUrl: body.imageUrl,
      pricing: body.pricing,
      price: body.price,
      currency: body.currency,
      isActive: body.isActive,
      sortOrder: body.sortOrder
    };
    const pkg = await Package.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ success: false, message: 'Server error while updating package' });
  }
});

router.delete('/packages/:id', adminAuth, async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting package' });
  }
});

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const verifiedUsers = await User.countDocuments({ isActive: true });
    
    // Get recent users (last 7 days for "this week")
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get recent contacts (last 7 days for "this week")
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Calculate verification rate
    const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalContacts,
        verifiedUsers,
        recentUsers,
        recentContacts,
        verificationRate
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// Update contact status (mark as read/unread)
router.patch('/contacts/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact status'
    });
  }
});

// Archive/Unarchive contact
router.patch('/contacts/:id/archive', adminAuth, async (req, res) => {
  try {
    const { isArchived } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isArchived },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error archiving contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving contact'
    });
  }
});

// Send reply email to contact
router.post('/contacts/:id/reply', adminAuth, async (req, res) => {
  try {
    const { subject, message, adminEmail } = req.body;
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (!EmailService) {
      return res.status(503).json({ 
        success: false, 
        message: 'Email service not configured. Please set up email credentials.' 
      });
    }

    // Send the reply email
    const emailResult = await EmailService.sendReplyEmail(
      contact.email,
      contact.name,
      subject,
      message,
      adminEmail
    );

    // Update contact status to 'contacted'
    await Contact.findByIdAndUpdate(req.params.id, { 
      status: 'contacted',
      lastContacted: new Date()
    });

    // Create notification for successful reply
    await NotificationService.createNotification({
      type: 'email_sent',
      title: 'Reply Email Sent',
      message: `Reply sent to ${contact.name} (${contact.email})`,
      priority: 'low',
      relatedId: contact._id,
      relatedModel: 'Contact',
      metadata: { 
        contactId: contact._id, 
        contactEmail: contact.email,
        emailSubject: subject
      }
    });

    res.json({ 
      success: true, 
      message: 'Reply email sent successfully',
      data: { messageId: emailResult.messageId }
    });
  } catch (error) {
    console.error('Error sending reply email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while sending reply email: ' + error.message 
    });
  }
});

// Get all notifications
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = unreadOnly === 'true' ? { isRead: false } : {};
    
    const notifications = await Notification.find(filter)
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/mark-all-read', adminAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications'
    });
  }
});

// Delete notification
router.delete('/notifications/:id', adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
});

// In your contact creation route (or wherever contacts are created)
router.post('/contacts', adminAuth, async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    
    // Create notification for new contact
    await NotificationService.createContactFormNotification(contact);
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating contact'
    });
  }
});

// Add new user endpoint
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user (password will be hashed automatically by the User model pre-save hook)
    const user = new User({
      name,
      email,
      password, // Pass plain password, let the model handle hashing
      role,
      isActive: true
    });

    await user.save();

    // Create notification for user creation
    await NotificationService.createNotification({
      type: 'user_created',
      title: 'New User Added',
      message: `User ${name} has been manually added to the system`,
      priority: 'medium',
      relatedId: user._id,
      relatedModel: 'User',
      metadata: { userId: user._id, userEmail: email }
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
});

// Export data endpoint
router.get('/export/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv' } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = await User.find({}).select('-password').lean();
        filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'contacts':
        data = await Contact.find({}).lean();
        filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'all':
        const users = await User.find({}).select('-password').lean();
        const contacts = await Contact.find({}).lean();
        data = { users, contacts };
        filename = `full_export_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Use: users, contacts, or all'
        });
    }

    if (format === 'csv' && type !== 'all') {
      const csv = json2csv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    }

    // Create notification for data export
    await NotificationService.createNotification({
      type: 'data_exported',
      title: 'Data Export Completed',
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} data has been exported`,
      data: { exportType: type, format, timestamp: new Date() }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting data'
    });
  }
});

// System settings endpoints
router.get('/settings', adminAuth, async (req, res) => {
  try {
    // For now, return basic system info
    const settings = {
      systemName: 'LeadMagnet Admin',
      version: '1.0.0',
      maintenance: false,
      registrationEnabled: true,
      emailNotifications: true,
      maxUsers: 1000,
      dataRetentionDays: 365
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
});

router.put('/settings', adminAuth, async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real app, you'd save these to a database
    // For now, just return success
    
    // Create notification for settings update
    await NotificationService.createNotification({
      type: 'settings_updated',
      title: 'System Settings Updated',
      message: 'System configuration has been modified',
      data: { updatedSettings: Object.keys(settings), timestamp: new Date() }
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
});

// Get recent activity
router.get('/activity', adminAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent notifications as activity
    const activities = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Transform notifications to activity format
    const formattedActivities = activities.map(notification => ({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      description: notification.message,
      timestamp: notification.createdAt,
      icon: getActivityIcon(notification.type),
      color: getActivityColor(notification.type)
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity'
    });
  }
});

// Helper functions for activity formatting
function getActivityIcon(type) {
  const iconMap = {
    'user_registered': 'fas fa-user-check',
    'user_created': 'fas fa-user-plus',
    'contact_submitted': 'fas fa-envelope',
    'data_exported': 'fas fa-file-export',
    'settings_updated': 'fas fa-cog',
    'system_maintenance': 'fas fa-exclamation-triangle'
  };
  return iconMap[type] || 'fas fa-info-circle';
}

function getActivityColor(type) {
  const colorMap = {
    'user_registered': 'success',
    'user_created': 'success',
    'contact_submitted': 'primary',
    'data_exported': 'info',
    'settings_updated': 'warning',
    'system_maintenance': 'warning'
  };
  return colorMap[type] || 'primary';
}

// Test email service
router.get('/email/test', adminAuth, async (req, res) => {
  try {
    if (!EmailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const status = EmailService.getStatus();
    
    if (!status.configured) {
      return res.status(503).json({
        success: false,
        message: 'Email service not configured',
        status: status
      });
    }

    // Test connection
    const connectionTest = await EmailService.testConnection();
    
    if (!connectionTest) {
      return res.status(503).json({
        success: false,
        message: 'Email connection test failed',
        status: status
      });
    }

    res.json({
      success: true,
      message: 'Email service is working correctly',
      status: status
    });
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email service: ' + error.message
    });
  }
});

// Reinitialize email service
router.post('/email/reinitialize', adminAuth, async (req, res) => {
  try {
    if (!EmailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const reinitialized = await EmailService.reinitialize();
    
    if (!reinitialized) {
      return res.status(503).json({
        success: false,
        message: 'Failed to reinitialize email service'
      });
    }

    res.json({
      success: true,
      message: 'Email service reinitialized successfully'
    });
  } catch (error) {
    console.error('Error reinitializing email service:', error);
    res.status(500).json({
      success: false,
      message: 'Error reinitializing email service: ' + error.message
    });
  }
});

// Send test email
router.post('/email/test', adminAuth, async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!EmailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    const testEmail = await EmailService.sendEmail({
      to: to || process.env.EMAIL_USER,
      subject: 'Lead Magnet - Email Service Test',
      text: 'This is a test email from Lead Magnet admin panel. If you receive this, the email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Lead Magnet - Email Service Test</h2>
          <p>This is a test email from Lead Magnet admin panel.</p>
          <p>If you receive this, the email service is working correctly.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: testEmail
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email: ' + error.message
    });
  }
});

// Debug email service
router.get('/email/debug', adminAuth, async (req, res) => {
  try {
    const debugInfo = {
      emailServiceAvailable: !!EmailService,
      environmentVariables: {
        EMAIL_USER: process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-4) : 'not set',
        EMAIL_PASS: process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'not set',
        EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'not set',
        EMAIL_FROM: process.env.EMAIL_FROM || 'not set'
      },
      serviceStatus: EmailService ? EmailService.getStatus() : 'not available'
    };

    res.json({
      success: true,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error getting email debug info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting email debug info: ' + error.message
    });
  }
});

module.exports = router;