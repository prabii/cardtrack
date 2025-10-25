const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const SocketService = require('./services/socketService');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;

// Connect to MongoDB
connectDB();

// Seed default users if they don't exist
async function ensureDefaultUsers() {
  try {
    const defaults = [
      { name: 'Alice Admin', email: 'admin@codershive.com', password: 'Admin@12345', role: 'admin' },
      { name: 'Mark Manager', email: 'manager@codershive.com', password: 'Manager@12345', role: 'manager' },
      { name: 'Gary Gateway', email: 'gateway@codershive.com', password: 'Gateway@12345', role: 'gateway_manager' },
      { name: 'Mia Member', email: 'member@codershive.com', password: 'Member@12345', role: 'member' }
    ];

    for (const u of defaults) {
      const existing = await User.findOne({ email: u.email.toLowerCase() });
      if (!existing) {
        const user = new User(u);
        await user.save();
        console.log(`✅ Seeded user: ${u.email} (${u.role})`);
      }
    }
  } catch (e) {
    console.warn('⚠️ Failed to seed default users:', e?.message || e);
  }
}

// CORS configuration - Allow both development and production
const corsOptions = {
  origin: [
    // Development origins
    'http://localhost:5173',  // Vite default port
    'http://localhost:5174',  // Current frontend port
    'http://localhost:5175',  // Alternative frontend port
    'http://localhost:4028',  // Your previous frontend port
    'http://localhost:3000',  // Alternative React port
    'http://localhost:3001',  // Previous backend port
    'http://localhost:3003',  // Current backend port
    'http://localhost:3004',  // Alternative backend port
    // Production origins (add your actual frontend domains)
    process.env.FRONTEND_URL,
    'https://cardtrack-ke78.vercel.app',  // Your actual Vercel domain
    'https://cardtracker-pro.vercel.app',
    'https://cardtracker-pro.netlify.app',
    'https://cardtracker-pro.onrender.com',
    // Allow all Vercel domains
    /^https:\/\/.*\.vercel\.app$/,
    // Allow all Netlify domains
    /^https:\/\/.*\.netlify\.app$/,
    // Allow all Render domains
    /^https:\/\/.*\.onrender\.com$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
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
app.use('/api/reports', require('./routes/reports'));
app.use('/api/company', require('./routes/company'));

// Initialize Socket.IO
const socketService = new SocketService(server);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CardTracker Pro API is running',
    timestamp: new Date().toISOString(),
    allowedOrigins: corsOptions.origin,
    connectedUsers: socketService.getConnectedUsers().length
  });
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
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);

  await ensureDefaultUsers();
});

// Export socket service for use in other modules
module.exports = { app, server, socketService };
