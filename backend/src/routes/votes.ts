import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const getDb = () => admin.firestore();

// GET user's vote for a station
router.get('/:userId/:stationId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const { userId, stationId } = req.params;

    if (req.user?.uid !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await db.collection('votes').doc(`${userId}_${stationId}`).get();

    if (!doc.exists) {
      return res.json({ voteType: null });
    }

    return res.json({ voteType: doc.data()?.voteType });
  } catch (error) {
    console.error('Error fetching vote:', error);
    return res.status(500).json({ error: 'Failed to fetch vote' });
  }
});

// GET all votes for a user
router.get('/user/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const { userId } = req.params;

    if (req.user?.uid !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const snapshot = await db.collection('votes')
      .where('userId', '==', userId)
      .get();

    const votes: Record<string, 'UP' | 'DOWN'> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      votes[data.stationId] = data.voteType;
    });

    return res.json(votes);
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return res.status(500).json({ error: 'Failed to fetch user votes' });
  }
});

export { router as votesRouter };