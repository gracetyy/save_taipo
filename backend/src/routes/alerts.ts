import { Router } from 'express';
import { firestore } from '../services/firebase';

const router = Router();

// Get global alert
router.get('/global', async (req, res) => {
    try {
        const alertDoc = await firestore.collection('settings').doc('globalAlert').get();
        if (alertDoc.exists) {
            res.json(alertDoc.data());
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error('Error fetching global alert:', error);
        res.status(500).json({ error: 'Failed to fetch global alert' });
    }
});

// Set global alert
router.post('/global', async (req, res) => {
    try {
        const { message, userId } = req.body;
        await firestore.collection('settings').doc('globalAlert').set({
            message,
            updatedBy: userId,
            updatedAt: Date.now(),
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error setting global alert:', error);
        res.status(500).json({ error: 'Failed to set global alert' });
    }
});

// Clear global alert
router.delete('/global', async (req, res) => {
    try {
        await firestore.collection('settings').doc('globalAlert').delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing global alert:', error);
        res.status(500).json({ error: 'Failed to clear global alert' });
    }
});

export default router;
