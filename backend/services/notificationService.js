const Notification = require('../models/Notification');

class NotificationService {
  static async createNotification({
    title,
    message,
    type,
    priority = 'medium',
    relatedId = null,
    relatedModel = null,
    metadata = {}
  }) {
    try {
      const notification = new Notification({
        title,
        message,
        type,
        priority,
        relatedId,
        relatedModel,
        metadata
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  static async createUserRegistrationNotification(user) {
    return this.createNotification({
      title: 'New user registered',
      message: `${user.name} (${user.email}) has registered`,
      type: 'user_registered',
      priority: 'medium',
      relatedId: user._id,
      relatedModel: 'User',
      metadata: {
        userEmail: user.email,
        userName: user.name
      }
    });
  }
  
  static async createContactFormNotification(contact) {
    return this.createNotification({
      title: 'Contact form submitted',
      message: `New contact from ${contact.name} (${contact.email})`,
      type: 'contact_submitted',
      priority: 'high',
      relatedId: contact._id,
      relatedModel: 'Contact',
      metadata: {
        contactEmail: contact.email,
        contactName: contact.name,
        company: contact.company
      }
    });
  }
  
  static async createSystemNotification(title, message, priority = 'medium') {
    return this.createNotification({
      title,
      message,
      type: 'system',
      priority
    });
  }
}

module.exports = NotificationService;