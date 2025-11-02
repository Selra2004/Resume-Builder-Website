import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createConnection } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import companyRoutes from './routes/companies.js';
import jobRoutes from './routes/jobs.js';
import resumeRoutes from './routes/resumes.js';
import adminRoutes from './routes/admin.js';
import coordinatorRoutes from './routes/coordinator.js';
import uploadRoutes from './routes/upload.js';
import applicationActionRoutes from './routes/applicationActions.js';
import interviewRoutes from './routes/interviews.js';
import notificationRoutes from './routes/notifications.js';
import { CronJobService } from './services/cronJobs.js';

dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));

// Rate limiting - Increased for better UX during development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database connection
createConnection();

// Static file serving for uploads with CORS headers
app.use('/api/uploads', (req, res, next) => {
  // Set CORS headers for image serving
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coordinators', coordinatorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', applicationActionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database connection
  try {
    await createConnection();
    logger.info('✅ Database connected successfully');
    
    // Test email connection
    const { EmailService } = await import('./services/emailService.js');
    const emailConnectionWorks = await EmailService.testConnection();
    if (emailConnectionWorks) {
      logger.info('✅ SMTP connection verified successfully');
    } else {
      logger.warn('⚠️ SMTP connection failed - emails will not be sent');
    }
    
    // Initialize cron jobs after database connection
    CronJobService.initialize();
    
  } catch (error) {
    logger.error('❌ Failed to initialize database or cron jobs:', error);
  }
});

export default app;
