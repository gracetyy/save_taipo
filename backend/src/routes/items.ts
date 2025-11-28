
import { Router } from 'express';
import { db } from '../index';
import { authMiddleware } from '../middleware/authMiddleware';
import * as admin from 'firebase-admin';

const router = Router();

// Add an item to a category
// TODO: Consider allowing UserRole.STATION_MANAGER or verified volunteers to add items
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { category, item } = req.body;
        // Map old request body format if necessary, frontend sends 'category' and 'item'
        const categoryKey = category;

        if (!categoryKey || !item) {
            return res.status(400).json({ message: 'Category key and item are required' });
        }
        
        // Check if category exists or just add to the list
        // Since we are using a dynamic structure in DB now, we might want to store items in a specific collection
        // or update a master list document.
        // For simplicity, let's assume we have a 'system_metadata' collection with a 'categories' document.
        
        const categoriesRef = db.collection('system_metadata').doc('categories');
        const doc = await categoriesRef.get();
        
        if (!doc.exists) {
            // Initialize if not exists
            await categoriesRef.set({
                [categoryKey]: [item]
            }, { merge: true });
        } else {
            await categoriesRef.update({
                [categoryKey]: admin.firestore.FieldValue.arrayUnion(item)
            });
        }
        
        return res.status(201).json({ message: 'Item added successfully' });
    } catch (error) {
        console.error("Error adding item:", error);
        return res.status(500).json({ message: 'Error adding item', error });
    }
});

export default router;