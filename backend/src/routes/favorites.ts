
import { Router } from 'express';
import { db } from '../index';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import * as admin from 'firebase-admin';

const router = Router();

// Get user favorites
router.get('/:userId', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.params;
        if (req.user?.uid !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const doc = await db.collection('user_favorites').doc(userId).get();
        if (doc.exists) {
            return res.status(200).json(doc.data()?.stationIds || []);
        } else {
            // No favorites list found - return empty array (user just hasn't favorited anything yet)
            return res.status(200).json([]);
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching favorites', error });
    }
});

// Add a favorite
router.post('/:userId', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.params;
        if (req.user?.uid !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { stationId } = req.body;
        if (!stationId) {
            return res.status(400).json({ message: 'Station ID is required' });
        }
        await db.collection('user_favorites').doc(userId).set({
            stationIds: admin.firestore.FieldValue.arrayUnion(stationId)
        }, { merge: true });
        return res.status(201).json({ message: 'Favorite added successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error adding favorite', error });
    }
});

// Remove a favorite
router.delete('/:userId/:stationId', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId, stationId } = req.params;
        if (req.user?.uid !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        await db.collection('user_favorites').doc(userId).update({
            stationIds: admin.firestore.FieldValue.arrayRemove(stationId)
        });
        return res.status(200).json({ message: 'Favorite removed successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error removing favorite', error });
    }
});

export default router;
