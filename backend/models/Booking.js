const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    // Customer information
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    customerPhone: {
      type: String,
      trim: true
    },
    
    // Booking details
    serviceType: {
      type: String,
      required: true,
      trim: true
    },
    bookingDate: {
      type: Date,
      required: true
    },
    bookingTime: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      default: 60
    },
    
    // Location information
    location: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    
    // Booking status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending'
    },
    
    // Additional information
    notes: {
      type: String,
      trim: true
    },
    specialRequirements: {
      type: String,
      trim: true
    },
    
    // Pricing
    price: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    
    // Payment information
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      trim: true
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
BookingSchema.index({ customerEmail: 1 });
BookingSchema.index({ bookingDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ createdAt: -1 });

// Virtual for formatted booking date
BookingSchema.virtual('formattedBookingDate').get(function() {
  return this.bookingDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted booking time
BookingSchema.virtual('formattedBookingTime').get(function() {
  return this.bookingTime;
});

// Method to check if booking is upcoming
BookingSchema.methods.isUpcoming = function() {
  const now = new Date();
  const bookingDateTime = new Date(`${this.bookingDate.toDateString()} ${this.bookingTime}`);
  return bookingDateTime > now && this.status === 'confirmed';
};

// Method to check if booking is past
BookingSchema.methods.isPast = function() {
  const now = new Date();
  const bookingDateTime = new Date(`${this.bookingDate.toDateString()} ${this.bookingTime}`);
  return bookingDateTime < now || this.status === 'completed';
};

module.exports = mongoose.model('Booking', BookingSchema);
