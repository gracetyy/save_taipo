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
    const { user, isLoading } = useAuth();

    if (isLoading) {
        // You might want to render a loading spinner here
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to={redirectPath} replace />;
    }

    const isAllowed = allowedRoles.some(role => hasRole(user.role, role));

    if (!isAllowed) {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};
