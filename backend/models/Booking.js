const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    // Calendly integration fields
    calendlyEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    calendlyEventUri: {
      type: String,
      required: true,
      trim: true
    },
    
    // Meeting details
    meetingType: {
      type: String,
      required: true,
      trim: true
    },
    meetingTitle: {
      type: String,
      required: true,
      trim: true
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    timezone: {
      type: String,
      required: true,
      trim: true
    },
    
    // Attendee information
    attendee: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      }
    },
    
    // Booking status
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    
    // Calendly URLs
    meetingUrl: {
      type: String,
      trim: true
    },
    rescheduleUrl: {
      type: String,
      trim: true
    },
    cancelUrl: {
      type: String,
      trim: true
    },
    
    // Lead source and tracking
    leadSource: {
      type: String,
      default: 'calendly_webhook',
      trim: true
    },
    followUpSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    
    // Admin notes
    adminNotes: {
      type: String,
      trim: true
    },
    
    // Timestamps
    confirmedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
BookingSchema.index({ 'attendee.email': 1 });
BookingSchema.index({ scheduledTime: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ calendlyEventId: 1 });

// Virtual for formatted booking date
BookingSchema.virtual('formattedBookingDate').get(function() {
  return this.scheduledTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted booking time
BookingSchema.virtual('formattedBookingTime').get(function() {
  return this.scheduledTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual for customer name (for compatibility)
BookingSchema.virtual('customerName').get(function() {
  return this.attendee.name;
});

// Virtual for customer email (for compatibility)
BookingSchema.virtual('customerEmail').get(function() {
  return this.attendee.email;
});

// Method to check if booking is upcoming
BookingSchema.methods.isUpcoming = function() {
  const now = new Date();
  return this.scheduledTime > now && this.status === 'scheduled';
};

// Method to check if booking is past
BookingSchema.methods.isPast = function() {
  const now = new Date();
  return this.scheduledTime < now || this.status === 'completed';
};

module.exports = mongoose.model('Booking', BookingSchema);
