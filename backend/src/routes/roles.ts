
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

// Request to become a driver
router.post('/request-driver', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { vehicleType, licensePlate, otherDetails } = req.body;

        if (!vehicleType || !licensePlate) {
            return res.status(400).json({ message: 'Vehicle type and license plate are required' });
        }

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingRequest = await db.collection('driverRequests').doc(userId).get();
        if (existingRequest.exists && existingRequest.data()?.status === 'PENDING') {
            return res.status(400).json({ message: 'You already have a pending driver request' });
        }

        const requestData = {
            userId,
            email: req.user?.email,
            name: userDoc.data()?.name,
            status: 'PENDING',
            vehicleType,
            licensePlate,
            otherDetails,
            createdAt: Date.now(),
        };

        await db.collection('driverRequests').doc(userId).set(requestData);
        return res.status(200).json({ message: 'Driver request submitted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error submitting driver request', error });
    }
});

// Approve a driver request
router.post('/approve-driver/:userId', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req, res) => {
    try {
        const { userId } = req.params;
        const driverRequestRef = db.collection('driverRequests').doc(userId);
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
            const driverRequestDoc = await transaction.get(driverRequestRef);
            if (!driverRequestDoc.exists || driverRequestDoc.data()?.status !== 'PENDING') {
                throw new Error('No pending driver request found for this user');
            }

            transaction.update(driverRequestRef, { status: 'APPROVED' });
            transaction.update(userRef, { role: UserRole.DRIVER });
        });

        return res.status(200).json({ message: 'Driver request approved successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: 'Error approving driver request', error: error.message });
    }
});

// Reject a driver request
router.post('/reject-driver/:userId', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const driverRequestRef = db.collection('driverRequests').doc(userId);

        await driverRequestRef.update({ status: 'REJECTED', rejectionReason: reason });

        return res.status(200).json({ message: 'Driver request rejected successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error rejecting driver request', error });
    }
});

// Get all pending driver requests
router.get('/driver-requests', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req, res) => {
    try {
        const snapshot = await db.collection('driverRequests').where('status', '==', 'PENDING').orderBy('createdAt', 'asc').get();
        const requests = snapshot.docs.map(doc => doc.data());
        return res.status(200).json(requests);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching driver requests', error });
    }
});

// Self-claim volunteer role
router.post('/self-claim-volunteer', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await db.collection('users').doc(userId).set({ role: UserRole.VOLUNTEER }, { merge: true });
        return res.status(200).json({ message: 'User role updated to VOLUNTEER successfully', role: UserRole.VOLUNTEER });
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