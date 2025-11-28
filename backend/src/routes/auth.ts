import { Router } from 'express';
import { auth as adminAuth } from 'firebase-admin';
import { firestore } from '../services/firebase';
import { UserProfile, UserRole, UserStatus } from '../../types';

const router = Router();

router.post('/login', async (req, res) => {
    const { token } = req.body;

    try {
        const decodedToken = await adminAuth().verifyIdToken(token);
        const { uid, email, name } = decodedToken;

        const userRef = firestore.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userProfile = userDoc.data() as UserProfile;
            userProfile.lastLogin = Date.now();
            await userRef.set(userProfile, { merge: true });
            res.json(userProfile);
        } else {
            const newUser: UserProfile = {
                id: uid,
                name: name || 'New User',
                email: email || '',
                role: UserRole.RESIDENT,
                status: UserStatus.ACTIVE,
                createdAt: Date.now(),
                lastLogin: Date.now(),
                prefersLanguage: 'en',
                notificationsEnabled: true,
            };
            await userRef.set(newUser);
            res.json(newUser);
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(401).send('Unauthorized');
    }
});

export default router;
