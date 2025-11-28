import { Router } from 'express';
import { db } from '../index';
import { authMiddleware } from '../middleware/authMiddleware';
import * as admin from 'firebase-admin';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { UserRole } from '../types';

const router = Router();

// Get all categories
router.get('/', authMiddleware, async (req, res) => {
    try {
        const snapshot = await db.collection('offering_categories').get();
        const categories: Record<string, string[]> = {};
        snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
            categories[doc.id] = doc.data().items;
        });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
});

// Add a category
router.post('/', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req, res) => {
    try {
        const { categoryKey } = req.body;
        if (!categoryKey) {
            return res.status(400).json({ message: 'Category key is required' });
        }
        await db.collection('offering_categories').doc(categoryKey).set({ items: [] });
        return res.status(201).json({ message: 'Category added successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error adding category', error });
    }
});

export default router;