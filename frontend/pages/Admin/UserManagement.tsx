import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../services/apiClient';
import { UserRole } from '../../types';
import { Users, Search, Filter, Shield, Truck, Home, HandHeart, User, Check, X } from 'lucide-react';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phoneNumber?: string;
    photoUrl?: string;
}

export const UserManagement = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [editingUser, setEditingUser] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(user => 
                user.name?.toLowerCase().includes(term) || 
                user.email?.toLowerCase().includes(term) ||
                user.phoneNumber?.includes(term)
            );
        }

        if (roleFilter !== 'ALL') {
            result = result.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(result);
    }, [users, searchTerm, roleFilter]);

    const fetchUsers = async () => {
        try {
            const response = await api.get<UserData[]>('/roles');
            setUsers(response || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
        try {
            await api.put(`/roles/${userId}`, { role: newRole });
            
            // Update local state
            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role');
        }
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return <Shield className="text-red-600" size={16} />;
            case UserRole.STATION_MANAGER: return <Home className="text-purple-600" size={16} />;
            case UserRole.DRIVER: return <Truck className="text-blue-600" size={16} />;
            case UserRole.VOLUNTEER: return <HandHeart className="text-orange-600" size={16} />;
            default: return <User className="text-gray-600" size={16} />;
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'bg-red-100 text-red-800';
            case UserRole.STATION_MANAGER: return 'bg-purple-100 text-purple-800';
            case UserRole.DRIVER: return 'bg-blue-100 text-blue-800';
            case UserRole.VOLUNTEER: return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Users size={24} className="text-primary" />
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <select
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                            <option value={UserRole.STATION_MANAGER}>Station Manager</option>
                            <option value={UserRole.DRIVER}>Driver</option>
                            <option value={UserRole.VOLUNTEER}>Volunteer</option>
                            <option value={UserRole.RESIDENT}>Resident</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                                {user.photoUrl ? (
                                                    <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    user.name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <select
                                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                value={user.role}
                                                onChange={(e) => handleRoleUpdate(user.id, e.target.value as UserRole)}
                                                onBlur={() => setEditingUser(null)}
                                                autoFocus
                                            >
                                                {Object.values(UserRole).map((role) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span 
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${getRoleBadgeColor(user.role)} cursor-pointer hover:opacity-80`}
                                                onClick={() => setEditingUser(user.id)}
                                            >
                                                {getRoleIcon(user.role)}
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.phoneNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            className="text-primary hover:text-primary-dark"
                                            onClick={() => setEditingUser(user.id)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No users found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};
