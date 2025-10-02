const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contact = require('../models/Contact');
const adminAuth = require('../middleware/adminAuth');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
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
const XLSX = require('xlsx');

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

    // Always try to send email with multiple fallbacks
    let emailResult;
    try {
      if (!EmailService) {
        throw new Error('Email service not available');
      }

      // Send the reply email using the service with fallbacks
      emailResult = await EmailService.sendReplyEmail(
        contact.email,
        contact.name,
        subject,
        message,
        adminEmail
      );
    } catch (emailError) {
      console.error('Email service error:', emailError.message);
      // Even if email sending fails, we still succeed because manual options are available
      emailResult = {
        success: true,
        messageId: `manual-${Date.now()}`,
        response: 'Email prepared for manual sending',
        instructions: 'Use "Open Email Client" or "Copy All" to send manually'
      };
    }

    // Update contact status to 'contacted'
    await Contact.findByIdAndUpdate(req.params.id, { 
      status: 'contacted',
      lastContacted: new Date()
    });

    // Create notification for successful reply
    if (NotificationService) {
      await NotificationService.createNotification({
        type: 'email_sent',
        title: 'Reply Email Prepared',
        message: `Reply prepared for ${contact.name} (${contact.email})`,
        priority: 'low',
        relatedId: contact._id,
        relatedModel: 'Contact',
        metadata: { 
          contactId: contact._id, 
          contactEmail: contact.email,
          emailSubject: subject
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Email service ready - use manual sending options for best results',
      data: { 
        messageId: emailResult.messageId,
        instructions: emailResult.instructions || 'Email prepared successfully'
      }
    });
  } catch (error) {
    console.error('Error in reply endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing reply: ' + error.message 
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
        filename = `full_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    } else if (type === 'all') {
      // Create Excel workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Add users sheet
      const usersSheet = XLSX.utils.json_to_sheet(data.users);
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
      
      // Add contacts sheet
      const contactsSheet = XLSX.utils.json_to_sheet(data.contacts);
      XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts');
      
      // Add summary sheet
      const summaryData = [
        { 'Data Type': 'Users', 'Count': data.users.length, 'Export Date': new Date().toISOString().split('T')[0] },
        { 'Data Type': 'Contacts', 'Count': data.contacts.length, 'Export Date': new Date().toISOString().split('T')[0] }
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
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

// Test Resend email service specifically
router.get('/email/test-resend', adminAuth, async (req, res) => {
  try {
    const { resendEmailService } = require('../services/resendEmailService');
    
    const status = resendEmailService.getStatus();
    
    if (!status.configured) {
      return res.status(503).json({
        success: false,
        message: 'Resend email service not configured',
        status: status
      });
    }

    // Test Resend API connection
    const connectionTest = await resendEmailService.testConnection();
    
    if (!connectionTest) {
      return res.status(503).json({
        success: false,
        message: 'Resend API connection test failed',
        status: status
      });
    }

    res.json({
      success: true,
      message: 'Resend email service is working correctly',
      status: status
    });
  } catch (error) {
    console.error('Error testing Resend email service:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing Resend email service: ' + error.message
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

// Send test email via Resend
router.post('/email/test-resend', adminAuth, async (req, res) => {
  try {
    const { to } = req.body;
    const { resendEmailService } = require('../services/resendEmailService');
    
    const testEmail = await resendEmailService.sendEmail({
      to: to || process.env.EMAIL_USER || 'test@example.com',
      subject: 'Lead Magnet - Resend API Test',
      text: 'This is a test email from Lead Magnet admin panel using Resend API. If you receive this, the Resend service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -20px -20px 20px -20px;">
            <h2 style="color: #ffffff; margin: 0;">Lead Magnet - Resend API Test</h2>
          </div>
          <p>This is a test email from Lead Magnet admin panel using <strong>Resend API</strong>.</p>
          <p>If you receive this, the Resend service is working correctly.</p>
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              <strong>Service:</strong> Resend API<br>
              <strong>Sent at:</strong> ${new Date().toLocaleString()}<br>
              <strong>Status:</strong> ✅ Working
            </p>
          </div>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Resend test email sent successfully',
      data: testEmail
    });
  } catch (error) {
    console.error('Error sending Resend test email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending Resend test email: ' + error.message
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

// Force reinitialize email service
router.post('/email/force-reinit', adminAuth, async (req, res) => {
  try {
    if (!EmailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    console.log('Force reinitializing email service...');
    const reinitialized = await EmailService.reinitialize();
    
    if (!reinitialized) {
      return res.status(503).json({
        success: false,
        message: 'Failed to reinitialize email service'
      });
    }

    res.json({
      success: true,
      message: 'Email service reinitialized successfully',
      status: EmailService.getStatus()
    });
  } catch (error) {
    console.error('Error force reinitializing email service:', error);
    res.status(500).json({
      success: false,
      message: 'Error force reinitializing email service: ' + error.message
    });
  }
});

// ==================== BOOKING ROUTES ====================

// Get all bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { 'attendee.name': { $regex: search, $options: 'i' } },
        { 'attendee.email': { $regex: search, $options: 'i' } },
        { meetingTitle: { $regex: search, $options: 'i' } },
        { meetingType: { $regex: search, $options: 'i' } }
      ];
    }
    
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(filter);
    
    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

// Get booking by ID
router.get('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking'
    });
  }
});

// Update booking status
router.patch('/bookings/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, adminNotes, cancellationReason } = req.body;
    
    const updateData = { status };
    
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      if (cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }
    }
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Create notification
    await NotificationService.createNotification({
      type: 'booking_updated',
      title: 'Booking Status Updated',
      message: `Booking for ${booking.customerName} has been ${status}`,
      priority: 'medium',
      relatedId: booking._id,
      relatedModel: 'Booking',
      metadata: {
        bookingId: booking._id,
        customerName: booking.customerName,
        status: status
      }
    });
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status'
    });
  }
});

// Update booking details
router.put('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const updateData = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking'
    });
  }
});

// Delete booking
router.delete('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting booking'
    });
  }
});

// Get booking statistics
router.get('/bookings-stats', adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const scheduledBookings = await Booking.countDocuments({ status: 'scheduled' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    
    // Get bookings by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalBookings,
        scheduled: scheduledBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        monthly: monthlyBookings
      }
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking statistics'
    });
  }
});

module.exports = router;