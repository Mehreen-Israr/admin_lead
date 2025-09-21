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

// User Schema (same as auth.js)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verify admin authentication
    await adminAuth(req);
    
    // GET /api/users - Get all users
    if (req.method === 'GET') {
      const { id } = req.query;
      
      // Get specific user by ID
      if (id) {
        const user = await User.findById(id).select('-password');
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        return res.json({
          success: true,
          data: user
        });
      }
      
      // Get all users
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 });
      
      return res.json({
        success: true,
        count: users.length,
        data: users
      });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Users API error:', error);
    
    if (error.message.includes('token') || error.message.includes('Access denied')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
}