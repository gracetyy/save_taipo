import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        role: string;
    };
}

import { auth, firestore } from '../services/firebase';

// This middleware verifies the Firebase Auth token and attaches user data to the request.
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        const { uid, email } = decodedToken;

        // Fetch user role from Firestore
        const userDoc = await firestore.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(403).json({ error: 'User not found in database' });
        }

        const user = userDoc.data();
        const role = user?.role || 'RESIDENT'; // Default to RESIDENT if no role is found

        req.user = { uid, email: email ?? '', role };
        return next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
