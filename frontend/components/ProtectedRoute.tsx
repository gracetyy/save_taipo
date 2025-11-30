import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { hasRole } from '../utils/permissions';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
    redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, redirectPath = '/' }) => {
    const { user, isLoading, currentRole, isLoggedIn, effectiveRole } = useAuth();

    if (isLoading) {
        // You might want to render a loading spinner here
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    // If logged in, evaluate using user's real role from backend
    if (isLoggedIn && user) {
        const isAllowed = allowedRoles.some(role => hasRole(user.role, role));
        if (!isAllowed) return <Navigate to={redirectPath} replace />;
        return <Outlet />;
    }

    // Not logged in: only allow RESIDENT or VOLUNTEER via pre-login selection
    if (!isLoggedIn) {
        if (!effectiveRole) return <Navigate to={redirectPath} replace />;
        // Only RESIDENT or VOLUNTEER allowed when not authenticated
        if (effectiveRole !== UserRole.RESIDENT && effectiveRole !== UserRole.VOLUNTEER) {
            return <Navigate to={redirectPath} replace />;
        }
        const isAllowedByPreLogin = allowedRoles.includes(effectiveRole);
        if (!isAllowedByPreLogin) return <Navigate to={redirectPath} replace />;
        return <Outlet />;
    }

    return <Outlet />;
};
