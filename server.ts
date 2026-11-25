import express, { Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes';
import universityRoutes from './server/routes/universityRoutes';
import userRoutes from './server/routes/userRoutes';
import adminRoutes from './server/routes/adminRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import productRoutes from './server/routes/productRoutes';
import offerRoutes from './server/routes/offerRoutes';
import chatRoutes from './server/routes/chatRoutes';
import reviewRoutes from './server/routes/reviewRoutes';
import reportRoutes from './server/routes/reportRoutes';
import uploadRoutes from './server/routes/uploadRoutes';
import { prisma } from './server/db/prisma';
import { seedDatabase } from './prisma/seed';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy headers (Render / Railway / Cloudflare HTTPS)
app.set('trust proxy', 1);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory serving (dev fallback when Supabase Storage is not configured)
const uploadsPath = path.resolve(process.cwd(), 'public', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint (used by Render & uptime monitors)
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'unimart-api',
      database: 'connected',
      version: '2.0.0-postgres',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      service: 'unimart-api',
      database: 'disconnected',
      error: err?.message || 'Database connection unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Global API error handler
app.use('/api/*', (err: any, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal server error',
  });
});

async function startServer() {
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$connect();
      await seedDatabase();
    } catch (dbErr: any) {
      console.warn('[UniMart] Database init/seed warning:', dbErr?.message || dbErr);
    }
  } else {
    console.warn('[UniMart] DATABASE_URL is not set in .env — configure PostgreSQL before calling DB endpoints.');
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[UniMart] Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start UniMart server:', err);
  process.exit(1);
});
