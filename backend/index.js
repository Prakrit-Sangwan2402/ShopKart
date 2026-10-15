const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// 1. Load environment variables first
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

// Diagnostic check for Razorpay keys (masked, no secrets logged)
const rzpConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
if (rzpConfigured) {
  const maskedKey = process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.slice(0, 8)}...` : 'none';
  console.log(`💳 Razorpay Payment Gateway: CONFIGURED (Public Key: ${maskedKey})`);
} else {
  console.log('⚠️ Razorpay Payment Gateway: NOT CONFIGURED in backend/.env');
}

// 2. Configure public DNS resolvers to ensure SRV record resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch (err) {
  console.warn('Notice: Could not set custom DNS servers, using system default:', err.message);
}

// Route handlers
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Safe helper to mask credentials in MongoDB URI
function maskMongoUri(uri) {
  if (!uri) return 'NOT_CONFIGURED';
  try {
    return uri.replace(/\/\/(.*?):(.*?)@/, '//***:***@');
  } catch {
    return '[Protected URI]';
  }
}

// Safe helper to extract host and database name
function getUriMetadata(uri) {
  if (!uri) return { host: 'unknown', database: 'unknown' };
  try {
    const match = uri.match(/@([^/?]+)(?:\/([^?]*))?/);
    return {
      host: match ? match[1] : 'unknown',
      database: match && match[2] ? match[2] : '(default)',
    };
  } catch {
    return { host: 'unknown', database: 'unknown' };
  }
}

// Middleware: Enable CORS with credentials support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// Database availability middleware: Returns friendly 503 if DB is not connected
const ensureDbConnected = (req, res, next) => {
  // Allow logout even if database is offline (clears cookie)
  if (req.path === '/logout') {
    return next();
  }

  if (mongoose.connection.readyState === 1) {
    return next();
  }

  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const currentState = states[mongoose.connection.readyState] || 'unknown';

  return res.status(503).json({
    success: false,
    message: 'Database is currently unavailable. Please verify MongoDB Atlas cluster connectivity and status.',
    databaseStatus: currentState,
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  const isHealthy = dbState === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'ShopKart Backend API',
    database: dbState,
    timestamp: new Date().toISOString(),
  });
});

// Mount application routes
app.use('/api/customers', ensureDbConnected, customerRoutes);
app.use('/products', ensureDbConnected, productRoutes);
app.use('/api/products', ensureDbConnected, productRoutes);
app.use('/wishlist', ensureDbConnected, wishlistRoutes);
app.use('/api/wishlist', ensureDbConnected, wishlistRoutes);
app.use('/cart', ensureDbConnected, cartRoutes);
app.use('/api/cart', ensureDbConnected, cartRoutes);
app.use('/orders', ensureDbConnected, orderRoutes);
app.use('/api/orders', ensureDbConnected, orderRoutes);

// MongoDB Atlas connection logic
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is missing from backend/.env');
    return false;
  }

  const { host, database } = getUriMetadata(process.env.MONGO_URI);
  console.log(`📡 Connecting to MongoDB Atlas cluster at: ${host} (Database: ${database})...`);
  console.log(`🔒 Connection URI: ${maskMongoUri(process.env.MONGO_URI)}`);

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed.');
    console.error(`   Error Name: ${error.name}`);
    console.error(`   Error Message: ${error.message}`);

    if (error.reason?.servers) {
      console.error('   Individual Cluster Nodes:');
      for (const [address, server] of error.reason.servers) {
        console.error(`   - ${address}: ${server.error?.message || server.type}`);
      }
    }

    const errorStr = `${error.name} ${error.message} ${JSON.stringify(error.reason || '')}`;

    if (error.message && error.message.includes('bad auth')) {
      console.error('\n🔍 [Atlas Authentication Diagnosis]');
      console.error('   TLS handshake succeeded, but MongoDB Atlas rejected the database credentials (bad auth: authentication failed).');
      console.error('   Please check in MongoDB Atlas Dashboard (https://cloud.mongodb.com):');
      console.error('   1. Navigate to Security -> Database Access.');
      console.error('   2. Verify the username specified in MONGO_URI exists.');
      console.error('   3. If the password was forgotten, click "Edit" -> "Edit Password", set a new password, and update backend/.env.');
      console.error('   4. Ensure the database user has "Read and write to any database" privileges.\n');
    } else if (errorStr.includes('SSL alert number 80') || errorStr.includes('tlsv1 alert internal error')) {
      console.error('\n🔍 [Atlas Connection Diagnosis]');
      console.error('   MongoDB Atlas terminated the TLS handshake with "SSL alert number 80: tlsv1 alert internal error".');
      console.error('   TCP connection to port 27017 succeeded, but Atlas refused the secure session.');
      console.error('   Please verify in your MongoDB Atlas Dashboard (https://cloud.mongodb.com):');
      console.error('   1. Cluster Status: Inactivity pauses M0 free clusters. Check if "Cluster0" is PAUSED and click "Resume".');
      console.error('   2. Network Access: Confirm 0.0.0.0/0 is active in the IP Access List for this specific project.');
      console.error('   3. Local Network / Security: Verify your network or VPN is not intercepting port 27017 TLS traffic.\n');
    }

    return false;
  }
}

// Event listeners for MongoDB connection state changes
mongoose.connection.on('connected', () => {
  console.log('🔔 [Mongoose] Connection established.');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ [Mongoose] Connection lost.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ [Mongoose] Connection error:', err.message);
});

// Start HTTP server and trigger database connection cleanly
function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀 ShopKart server is running on http://localhost:${PORT}`);
    console.log(`🩺 Health check endpoint: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
    } else {
      console.error('❌ Server error:', err.message);
    }
  });

  // Connect asynchronously without terminating server on initial failure
  connectDB().catch((err) => {
    console.error('Database connection unexpected error:', err.message);
  });

  return server;
}

startServer();

module.exports = app;