import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { stationsRouter } from './routes/stations';
import { tasksRouter } from './routes/tasks';
import { votesRouter } from './routes/votes';
import categoriesRouter from './routes/categories';
import itemsRouter from './routes/items';
import favoritesRouter from './routes/favorites';
import rolesRouter from './routes/roles';
import authRouter from './routes/auth';
import alertsRouter from './routes/alerts';
import { transportRouter } from './routes/transport';

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Create a router for all API routes
const apiRouter = express.Router();

// Mount routes on the API router
apiRouter.use('/auth', authRouter);
apiRouter.use('/stations', stationsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/votes', votesRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/items', itemsRouter);
apiRouter.use('/favorites', favoritesRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/transport', transportRouter);
apiRouter.use('/alerts', alertsRouter);

// Health check on the API router
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), version: '1.1.0' });
});

// Mount the API router at both / and /api to support both direct function calls and hosting rewrites
app.use('/', apiRouter);
app.use('/api', apiRouter);

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Export Firestore instance for use in routes
export const db = admin.firestore();
