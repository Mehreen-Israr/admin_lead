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
      currency: { type: String, trim: true },
      // Some documents keep amount at root (price). Keep optional amount for future use.
      amount: { type: Number, min: 0 },
      discount: { type: String, trim: true },
      popular: { type: Boolean, default: false },
      trialDays: { type: Number, default: 0 }
    },
    // Root price mirrors your collection (required)
    price: { type: Number, required: true, min: 0, default: 0 },
    // Root currency is legacy/fallback only
    currency: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Ensure logo mirrors imageUrl if one is missing (compat)
PackageSchema.pre('save', function (next) {
  if (!this.logo && this.imageUrl) this.logo = this.imageUrl;
  if (!this.imageUrl && this.logo) this.imageUrl = this.logo;
  // Map root price/currency into pricing object when provided
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


