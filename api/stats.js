const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB connection with caching
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) return cachedConnection;
  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  cachedConnection = connection;
  return connection;
}

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  status: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// Admin Auth Helper
async function adminAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Access denied. No token provided.');
  
  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-password');
  
  if (!user || user.role !== 'admin') {
    throw new Error('Access denied. Admin privileges required.');
  }
  
  return user;
}

export default async function handler(req, res) {
  await connectToDatabase();
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verify admin authentication
    await adminAuth(req);
    
    if (req.method === 'GET') {
      // Calculate statistics
      const totalUsers = await User.countDocuments();
      const totalContacts = await Contact.countDocuments();
      const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
      
      // Calculate "this week" data
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      });
      
      const recentContacts = await Contact.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      });
      
      // Calculate verification rate
      const verificationRate = totalUsers > 0 ? 
        Math.round((verifiedUsers / totalUsers) * 100) : 0;
      
      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalContacts,
          verifiedUsers,
          verificationRate,
          recentUsers,
          recentContacts
        }
      });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Stats API error:', error);
    
    if (error.message.includes('token') || error.message.includes('Access denied')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
}