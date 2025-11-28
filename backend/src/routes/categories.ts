
import { Router } from 'express';
import { db } from '../index';
import { authMiddleware } from '../middleware/authMiddleware';
import { OFFERING_CATEGORIES } from '../types';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categoriesRef = db.collection('system_metadata').doc('categories');
        const doc = await categoriesRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            // Merge with default categories to ensure basic structure exists
            const mergedCategories = { ...OFFERING_CATEGORIES, ...data };
            return res.status(200).json(mergedCategories);
        } else {
            // Return default categories if no overrides in DB
            return res.status(200).json(OFFERING_CATEGORIES);
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: 'Error fetching categories', error });
    }
});

// Add a category
// TODO: Consider user role restrictions
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        
        const categoriesRef = db.collection('system_metadata').doc('categories');
        
        // Use merge to add new field without overwriting existing
        // Initialize empty array for new category
        await categoriesRef.set({
            [name]: []
        }, { merge: true });

        return res.status(201).json({ message: 'Category added successfully' });
    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(500).json({ message: 'Error adding category', error });
    }
});

export default router;