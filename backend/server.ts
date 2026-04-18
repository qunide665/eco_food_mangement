import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';

// Import API routes
import authRoutes from './routes/auth';
import budgetRoutes from './routes/budgets';
import dishRoutes from './routes/dishes';
import expenseRoutes from './routes/expenses';
import recommendationRoutes from './routes/recommendations';

// Configuration
import { SERVER_CONFIG } from './config/constants';

// Middleware
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Static Files
 */
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(REACT_BUILD_FOLDER, {
    setHeaders: (res, path) => {
      // Disable caching for CSS and JS files to ensure changes are reflected immediately
      if (path.endsWith('.css') || path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    setHeaders: (res, path) => {
      // Disable caching for CSS and JS files in assets folder
      if (path.endsWith('.css') || path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/recommendations', recommendationRoutes);

/**
 * SPA Fallback Route
 * Handles client-side routing for React Router
 * Must be registered after all API routes
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

/**
 * Error Handler
 * Must be the last middleware
 */
app.use(errorHandler as ErrorRequestHandler);

/**
 * Start Server
 */
app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server ready on port ${SERVER_CONFIG.PORT}`);
});

export default app;
