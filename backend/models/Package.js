const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    platform: { type: String, trim: true },
    description: { type: String, trim: true },
    features: { type: [String], default: [] },
    logo: { type: String, trim: true },
    // Keep legacy fields for backward compatibility with existing UI
    benefits: { type: [String], default: [] },
    imageUrl: { type: String, trim: true },
    // New pricing object structure matching DB
    pricing: {
      currency: { type: String, default: 'USD' },
      amount: { type: Number, min: 0 },
      discount: { type: String, trim: true },
      popular: { type: Boolean, default: false },
      trialDays: { type: Number, default: 0 }
    },
    // Legacy flat price/currency for compatibility (optional)
    price: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Ensure logo mirrors imageUrl if one is missing (compat)
PackageSchema.pre('save', function (next) {
  if (!this.logo && this.imageUrl) this.logo = this.imageUrl;
  if (!this.imageUrl && this.logo) this.imageUrl = this.logo;
  // Map legacy price/currency into pricing.amount/currency when provided
  if (this.price != null && (!this.pricing || this.pricing.amount == null)) {
    this.pricing = this.pricing || {};
    this.pricing.amount = this.price;
  }
  if (this.currency && (!this.pricing || !this.pricing.currency)) {
    this.pricing = this.pricing || {};
    this.pricing.currency = this.currency;
  }
  next();
});

module.exports = mongoose.model('Package', PackageSchema);


