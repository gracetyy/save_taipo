import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { DeliveryTask, UserRole } from '../types';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
const getDb = () => admin.firestore();

// GET all tasks
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { status } = req.query;

    let query: admin.firestore.Query = db.collection('tasks');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const tasks: DeliveryTask[] = [];

    snapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() } as DeliveryTask);
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET single task by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection('tasks').doc(req.params.id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST create new task
router.post('/', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const taskData: Omit<DeliveryTask, 'id'> = {
      ...req.body,
      status: 'PENDING',
      createdAt: Date.now()
    };

    const docRef = await db.collection('tasks').add(taskData);

    res.status(201).json({ id: docRef.id, ...taskData });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT update a task
router.put('/:id', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const taskData: Partial<DeliveryTask> = req.body;
    const taskRef = db.collection('tasks').doc(req.params.id);

    await taskRef.update(taskData);

    res.json({ id: req.params.id, ...taskData });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// POST claim a task
router.post('/:id/claim', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER, UserRole.DRIVER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { driverId } = req.body;
    const taskRef = db.collection('tasks').doc(req.params.id);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(taskRef);

      if (!doc.exists) {
        throw new Error('Task not found');
      }

      const task = doc.data() as DeliveryTask;

      if (task.status !== 'PENDING') {
        throw new Error('Task is not available for claiming');
      }

      transaction.update(taskRef, {
        status: 'IN_PROGRESS',
        driverId
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error claiming task:', error);
    res.status(400).json({ error: error.message || 'Failed to claim task' });
  }
});

// POST complete a task
router.post('/:id/complete', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER, UserRole.DRIVER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const taskRef = db.collection('tasks').doc(req.params.id);

    await taskRef.update({
      status: 'COMPLETED',
      completedAt: Date.now()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// DELETE task
router.delete('/:id', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    await db.collection('tasks').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export { router as tasksRouter };
