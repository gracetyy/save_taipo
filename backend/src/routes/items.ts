
import { Router } from 'express';
import { db } from '../index';
import { authMiddleware } from '../middleware/authMiddleware';
import * as admin from 'firebase-admin';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { UserRole } from '../../../types';

const router = Router();

// Add an item to a category
router.post('/', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req, res) => {
    try {
        const { categoryKey, item } = req.body;
        if (!categoryKey || !item) {
            return res.status(400).json({ message: 'Category key and item are required' });
        }
        const docRef = db.collection('offering_categories').doc(categoryKey);
        await docRef.update({
            items: admin.firestore.FieldValue.arrayUnion(item)
        });
        return res.status(201).json({ message: 'Item added successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error adding item', error });
    }
});

export default router;
