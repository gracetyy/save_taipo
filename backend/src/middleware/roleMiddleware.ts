import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { UserRole } from '../../types';

export const roleMiddleware = (allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !user.role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!allowedRoles.includes(user.role as UserRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        return next();
    };
};
