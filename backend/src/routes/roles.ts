
import { Router } from 'express';
import { db } from '../index';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { UserRole } from '../../../types';

const router = Router();

// Get a user's role
router.get('/:userId', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.params;
        if (req.user?.uid !== userId && req.user?.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return res.status(200).json({ role: userDoc.data()?.role });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching user role', error });
    }
});

// Self-update role (only for allowed roles)
router.post('/self-update', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { role } = req.body;

        // Validate role - only allow specific roles for self-update
        const allowedRoles = [UserRole.RESIDENT, UserRole.VOLUNTEER, UserRole.DRIVER];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role for self-update' });
        }

        await db.collection('users').doc(userId).set({ role }, { merge: true });
        return res.status(200).json({ message: 'User role updated successfully', role });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating user role', error });
    }
});

// Set a user's role
router.put('/:userId', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        await db.collection('users').doc(userId).set({ role }, { merge: true });
        res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user role', error });
    }
});

export default router;