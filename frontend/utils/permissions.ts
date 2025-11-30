import { UserRole } from '../types';

export const RoleHierarchy: Record<UserRole, number> = {
    [UserRole.GUEST]: 0,
    [UserRole.RESIDENT]: 1,
    [UserRole.VOLUNTEER]: 2,
    [UserRole.DRIVER]: 3, // specialized volunteer
    [UserRole.STATION_MANAGER]: 4,
    [UserRole.ADMIN]: 100
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
    return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
};

export const canViewMap = (role: UserRole) => true; // Everyone
export const canVolunteer = (role: UserRole) => RoleHierarchy[role] >= RoleHierarchy[UserRole.VOLUNTEER];
export const canDrive = (role: UserRole) => role === UserRole.DRIVER || role === UserRole.ADMIN; // Drivers and Admins? Or just Drivers?
// Note: In current app, Driver is a specific role. Station Manager might not have a car.
// But Admin usually can do everything for testing/management.

export const canManageStations = (role: UserRole) => RoleHierarchy[role] >= RoleHierarchy[UserRole.STATION_MANAGER];
export const canManageSystem = (role: UserRole) => role === UserRole.ADMIN;

// Roles that require authentication to be valid (cannot be set anonymously)
export const roleRequiresLogin = (role: UserRole) => {
    return !(role === UserRole.RESIDENT || role === UserRole.VOLUNTEER || role === UserRole.GUEST);
}
