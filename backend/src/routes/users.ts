import { Router } from 'express';
import { db } from '../index';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Self-update user preferences (e.g., language)
router.post('/self-update', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { prefersLanguage, notificationsEnabled, welcomeShown } = req.body;
        const updateData: Record<string, unknown> = {};
        if (prefersLanguage) {
            if (!['en', 'zh'].includes(prefersLanguage)) {
                return res.status(400).json({ message: 'Invalid language' });
            }
            updateData.prefersLanguage = prefersLanguage;
        }
        if (typeof notificationsEnabled === 'boolean') {
            updateData.notificationsEnabled = notificationsEnabled;
        }
        if (typeof welcomeShown === 'boolean') {
            updateData.welcomeShown = welcomeShown;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No data to update' });
        }

        await db.collection('users').doc(userId).set(updateData, { merge: true });
        return res.status(200).json({ message: 'Preferences updated', updateData });
    } catch (error) {
        console.error('Error updating user preferences', error);
        return res.status(500).json({ message: 'Error updating user preferences', error });
    }
});

export default router;
