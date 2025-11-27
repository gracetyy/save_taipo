import { Router, Response } from 'express';
import * as admin from 'firebase-admin';
import { TransportTask, UserRole } from '../../../types';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
const db = admin.firestore();

// Create a new transport task
router.post('/', authMiddleware, roleMiddleware([UserRole.STATION_MANAGER, UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        const {
            urgency,
            pickup,
            dropoff,
            items,
            vehicleRequirement,
        } = req.body;

        const newTask: Omit<TransportTask, 'taskId' | 'status' | 'createdBy' | 'createdAt'> = {
            urgency,
            pickup,
            dropoff,
            items,
            vehicleRequirement,
        };

        const docRef = await db.collection('transportTasks').add({
            ...newTask,
            status: 'PENDING',
            createdBy: user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ id: docRef.id });

    } catch (error) {
        console.error('Error creating transport task:', error);
        res.status(500).send('Internal Server Error');
    }
    return;
});

// Get all transport tasks
router.get('/', authMiddleware, async (req, res) => {
    try {
        const snapshot = await db.collection('transportTasks').get();
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(tasks);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred');
        }
    }
    return;
});

// Get a specific transport task
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const doc = await db.collection('transportTasks').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).send('Task not found');
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred');
        }
    }
    return;
});


// Update a transport task
router.put('/:id', authMiddleware, roleMiddleware([UserRole.STATION_MANAGER, UserRole.ADMIN, UserRole.DRIVER]), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        const taskId = req.params.id;
        const taskRef = db.collection('transportTasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).send('Task not found');
        }

        const task = taskDoc.data() as TransportTask;

        if (user.role === UserRole.DRIVER) {
            // Drivers can only claim tasks
            if (req.body.status === 'CLAIMED' && task.status === 'PENDING') {
                await taskRef.update({ status: 'CLAIMED', assignedDriverId: user.uid });
                return res.status(200).json({ id: taskId });
            } else {
                return res.status(403).send('Forbidden');
            }
        }

        await taskRef.update(req.body);

        res.status(200).json({ id: taskId });

    } catch (error) {
        console.error('Error updating transport task:', error);
        res.status(500).send('Internal Server Error');
    }
    return;
});

// Delete a transport task
router.delete('/:id', authMiddleware, roleMiddleware([UserRole.STATION_MANAGER, UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const taskId = req.params.id;
        const taskRef = db.collection('transportTasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).send('Task not found');
        }

        await taskRef.delete();

        res.status(204).send();

    } catch (error) {
        console.error('Error deleting transport task:', error);
        res.status(500).send('Internal Server Error');
    }
    return;
});

export { router as transportRouter };