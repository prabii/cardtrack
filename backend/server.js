const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const SocketService = require('./services/socketService');
const User = require('./models/User');
const Gateway = require('./models/Gateway');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;

// Connect to MongoDB
connectDB();

// Get default permissions based on role
function getDefaultPermissions(userRole) {
  const permissions = {
    admin: [
      'view_cardholders', 'create_cardholders', 'edit_cardholders', 'delete_cardholders',
      'view_bill_payments', 'create_bill_payments', 'process_bill_payments',
      'view_gateways', 'manage_gateways', 'view_reports', 'manage_company',
      'manage_users', 'view_all_data'
    ],
    manager: [
      'view_cardholders', 'create_cardholders', 'edit_cardholders', 'delete_cardholders',
      'view_bill_payments', 'create_bill_payments', 'process_bill_payments',
      'view_reports', 'view_all_data'
    ],
    member: [
      'view_cardholders', 'create_cardholders', 'edit_cardholders',
      'view_bill_payments', 'create_bill_payments'
    ],
    gateway_manager: [
      'view_gateways', 'manage_gateways', 'view_bill_payments', 'process_bill_payments',
      'view_reports', 'view_all_data'
    ],
    operator: [
      'view_cardholders', 'edit_cardholders',
      'view_bill_payments', 'process_bill_payments',
      'view_transactions', 'verify_transactions',
      'view_gateways',
      'view_reports', 'manage_alerts'
    ]
  };
  return permissions[userRole] || permissions.member;
}

// Seed default users if they don't exist
async function ensureDefaultUsers() {
  try {
    const defaults = [
      { name: 'Alice Admin', email: 'admin@codershive.com', password: 'Admin@12345', role: 'admin' },
      { name: 'Mark Manager', email: 'manager@codershive.com', password: 'Manager@12345', role: 'manager' },
      { name: 'Gary Gateway', email: 'gateway@codershive.com', password: 'Gateway@12345', role: 'gateway_manager' },
      { name: 'Mia Member', email: 'member@codershive.com', password: 'Member@12345', role: 'member' },
      { name: 'Oscar Operator', email: 'operator@codershive.com', password: 'Operator@12345', role: 'operator' }
    ];

    for (const u of defaults) {
      const existing = await User.findOne({ email: u.email.toLowerCase() });
      if (!existing) {
        const user = new User({
          ...u,
          permissions: getDefaultPermissions(u.role),
          isActive: true
        });
        await user.save();
        console.log(`✅ Seeded user: ${u.email} (${u.role})`);
      } else {
        // Update existing user to ensure correct role, permissions, and active status
        if (existing.role !== u.role || !existing.isActive || existing.permissions.length === 0) {
          existing.role = u.role;
          existing.permissions = getDefaultPermissions(u.role);
          existing.isActive = true;
          // Only update password if it seems incorrect (check if it's not hashed properly)
          // Note: This won't update password if it's already correct
          await existing.save();
          console.log(`🔄 Updated user: ${u.email} (${u.role})`);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Failed to seed default users:', e?.message || e);
  }
}

// Seed default gateways if they don't exist
async function ensureDefaultGateways() {
  try {
    const defaults = [
      { name: 'PayPoint', description: 'PayPoint Payment Gateway' },
      { name: 'InstantMudra', description: 'InstantMudra Payment Gateway' }
    ];

    for (const gateway of defaults) {
      const existing = await Gateway.findOne({ name: gateway.name });
      if (!existing) {
        const newGateway = new Gateway({
          ...gateway,
          isActive: true
        });
        await newGateway.save();
        console.log(`✅ Seeded gateway: ${gateway.name}`);
      } else {
        // Ensure gateway is active
        if (!existing.isActive) {
          existing.isActive = true;
          await existing.save();
          console.log(`🔄 Activated gateway: ${gateway.name}`);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Failed to seed default gateways:', e?.message || e);
  }
}

// CORS configuration - Allow both development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowlist from environment (comma-separated)
    const envOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const allowedOrigins = [
      // Development origins
      'http://localhost:5173',  // Vite default port
      'http://localhost:5174',  // Current frontend port
      'http://localhost:5175',  // Alternative frontend port
      'http://localhost:4028',  // Your previous frontend port
      'http://localhost:3000',  // Alternative React port
      'http://localhost:3001',  // Previous backend port
      'http://localhost:3003',  // Current backend port
      'http://localhost:3004',  // Alternative backend port
      // Production origins
      process.env.FRONTEND_URL,
      'https://cardtrack-ke78.vercel.app',  // Your actual Vercel domain
      'https://cardtrack-xi.vercel.app',    // Current Vercel domain
      'https://cardtracker-pro.vercel.app',
      'https://cardtracker-pro.netlify.app',
      'https://cardtracker-pro.onrender.com',
      'http://84.247.136.87',               // VPS IP (HTTP)
      'https://84.247.136.87',              // VPS IP (HTTPS)
      ...envOrigins
    ].filter(Boolean); // Remove undefined values
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Allowed origin (exact match):', origin);
      return callback(null, true);
    }
    
    // Check regex patterns for Vercel, Netlify, Render
    if (/^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.netlify\.app$/.test(origin) ||
        /^https:\/\/.*\.onrender\.com$/.test(origin)) {
      console.log('CORS: Allowed origin (regex match):', origin);
      return callback(null, true);
    }
    
    // Also allow VPS IP with or without port (HTTP or HTTPS)
    if (origin.startsWith('http://84.247.136.87') || origin.startsWith('https://84.247.136.87')) {
      console.log('CORS: Allowed origin (VPS IP):', origin);
      return callback(null, true);
    }
    
    // Log the origin for debugging
    console.log('CORS: Blocked origin:', origin);
    console.log('CORS: Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));

// Manual CORS preflight handler for additional safety
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cardholders', require('./routes/cardholders'));
app.use('/api/statements', require('./routes/statements'));
app.use('/api/banks', require('./routes/banks'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/bank-summaries', require('./routes/bankSummaries'));
app.use('/api/bill-payments', require('./routes/billPayments'));
app.use('/api/gateways', require('./routes/gateways'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/company', require('./routes/company'));
app.use('/api/alerts', require('./routes/alerts'));

// Initialize Socket.IO
const socketService = new SocketService(server);
// Make socketService available globally for routes
global.socketService = socketService;

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    // Get allowed origins list for display
    const envOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:4028',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:3004',
      process.env.FRONTEND_URL,
      'https://cardtrack-ke78.vercel.app',
      'https://cardtrack-xi.vercel.app',
      'https://cardtracker-pro.vercel.app',
      'https://cardtracker-pro.netlify.app',
      'https://cardtracker-pro.onrender.com',
      'http://84.247.136.87',
      ...envOrigins
    ].filter(Boolean);

    res.json({
      success: true,
      message: 'CardTracker Pro API is running',
      timestamp: new Date().toISOString(),
      allowedOrigins: allowedOrigins,
      connectedUsers: socketService ? socketService.getConnectedUsers().length : 0
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User endpoints: http://localhost:${PORT}/api/user`);
  console.log(`👥 Cardholder endpoints: http://localhost:${PORT}/api/cardholders`);
  console.log(`📄 Statement endpoints: http://localhost:${PORT}/api/statements`);
  console.log(`🏦 Bank endpoints: http://localhost:${PORT}/api/banks`);
  console.log(`💳 Transaction endpoints: http://localhost:${PORT}/api/transactions`);
  console.log(`💸 Bill Payment endpoints: http://localhost:${PORT}/api/bill-payments`);
  console.log(`🌐 Gateway endpoints: http://localhost:${PORT}/api/gateways`);
  console.log(`📊 Report endpoints: http://localhost:${PORT}/api/reports`);
  console.log(`🏢 Company endpoints: http://localhost:${PORT}/api/company`);
  console.log(`🌐 CORS enabled for: Vercel, Netlify, Render domains and localhost`);

  await ensureDefaultUsers();
  await ensureDefaultGateways();
});

// Export socket service for use in other modules
module.exports = { app, server, socketService };
