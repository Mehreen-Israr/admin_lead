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
      // Monthly pricing (base price)
      monthly: { 
        amount: { type: Number, min: 0 },
        discount: { type: String, trim: true }
      },
      // Quarterly pricing (3 months with discount)
      quarterly: { 
        amount: { type: Number, min: 0 },
        discount: { type: String, trim: true },
        autoCalculated: { type: Boolean, default: true }
      },
      // Yearly pricing (12 months with bigger discount)
      yearly: { 
        amount: { type: Number, min: 0 },
        discount: { type: String, trim: true },
        autoCalculated: { type: Boolean, default: true }
      },
      // Legacy fields for backward compatibility
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
  
  // Initialize pricing object if it doesn't exist
  if (!this.pricing) {
    this.pricing = {};
  }
  
  // Map root price/currency into pricing object when provided
  if (this.price != null && (!this.pricing.amount && !this.pricing.monthly?.amount)) {
    this.pricing.amount = this.price;
    this.pricing.monthly = this.pricing.monthly || {};
    this.pricing.monthly.amount = this.price;
  }
  
  if (this.currency && !this.pricing.currency) {
    this.pricing.currency = this.currency;
  }
  
  // Auto-calculate quarterly and yearly prices if they're set to auto-calculate
  const monthlyPrice = this.pricing.monthly?.amount || this.pricing.amount || this.price;
  
  if (monthlyPrice && monthlyPrice > 0) {
    // Initialize pricing plans if they don't exist
    this.pricing.monthly = this.pricing.monthly || {};
    this.pricing.quarterly = this.pricing.quarterly || {};
    this.pricing.yearly = this.pricing.yearly || {};
    
    // Set monthly price
    this.pricing.monthly.amount = monthlyPrice;
    
    // Auto-calculate quarterly (3 months with 10% discount)
    if (this.pricing.quarterly.autoCalculated !== false) {
      const quarterlyBase = monthlyPrice * 3;
      const quarterlyDiscount = 0.10; // 10% discount
      this.pricing.quarterly.amount = Math.round(quarterlyBase * (1 - quarterlyDiscount));
      this.pricing.quarterly.discount = '10%';
      this.pricing.quarterly.autoCalculated = true;
    }
    
    // Auto-calculate yearly (12 months with 20% discount)
    if (this.pricing.yearly.autoCalculated !== false) {
      const yearlyBase = monthlyPrice * 12;
      const yearlyDiscount = 0.20; // 20% discount
      this.pricing.yearly.amount = Math.round(yearlyBase * (1 - yearlyDiscount));
      this.pricing.yearly.discount = '20%';
      this.pricing.yearly.autoCalculated = true;
    }
  }
  
  next();
});

module.exports = mongoose.model('Package', PackageSchema);


