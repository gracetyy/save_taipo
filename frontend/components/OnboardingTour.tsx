import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';
import { apiClient } from '../services/apiClient';
import { ChevronRight, User, Heart, Truck, Users, LayoutDashboard } from 'lucide-react';

interface OnboardingTourProps {
    onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const { user, refreshUser } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0); // 0: Welcome, 1: Role Selection, 2: Role Info
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    useEffect(() => {
        if (!user) return;
        const storageKey = `onboarding_completed_${user.id}_v1`;
        const hasSeenTour = localStorage.getItem(storageKey);

        if (!hasSeenTour) {
            setIsVisible(true);
            // If user is already established (e.g. not GUEST or newly RESIDENT), skip role selection?
            // For now, let's offer role selection to everyone who hasn't seen the tour,
            // but default to their current role if it's specialized.
            if (user.role && user.role !== UserRole.RESIDENT && user.role !== UserRole.GUEST) {
                 setSelectedRole(user.role);
                 setStep(2); // Jump to role info
            }
        }
    }, [user]);

    const handleComplete = () => {
        if (user) {
            const storageKey = `onboarding_completed_${user.id}_v1`;
            localStorage.setItem(storageKey, 'true');
        }
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const updateRole = async (role: UserRole) => {
        try {
            await apiClient.post('/roles/self-update', { role });
            await refreshUser();
            setSelectedRole(role);
            setStep(2);
        } catch (error) {
            console.error("Failed to update role", error);
            // Even if it fails (e.g. offline), let's show the tour for that role
            setSelectedRole(role);
            setStep(2);
        }
    };

    if (!isVisible) return null;

    const renderRoleSelection = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">What brings you here?</h2>
            <div className="grid gap-4">
                <button
                    onClick={() => updateRole(UserRole.RESIDENT)}
                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 flex items-center space-x-3 transition-all"
                >
                    <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900">I need help</div>
                        <div className="text-sm text-gray-600">Find supplies, stations, and support nearby.</div>
                    </div>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">OR I WANT TO HELP</span>
                    </div>
                </div>

                <button
                    onClick={() => updateRole(UserRole.VOLUNTEER)}
                    className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 flex items-center space-x-3 transition-all"
                >
                    <div className="bg-green-100 p-2 rounded-full">
                        <Heart className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900">I want to Volunteer</div>
                        <div className="text-sm text-gray-600">Join teams, help at stations, and assist others.</div>
                    </div>
                </button>

                <button
                    onClick={() => updateRole(UserRole.DRIVER)}
                    className="p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-500 flex items-center space-x-3 transition-all"
                >
                    <div className="bg-orange-100 p-2 rounded-full">
                        <Truck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900">I am a Driver</div>
                        <div className="text-sm text-gray-600">Help transport supplies between stations.</div>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderRoleInfo = () => {
        let title = "";
        let content = null;

        switch (selectedRole) {
            case UserRole.RESIDENT:
                title = "Welcome Resident";
                content = (
                    <div className="space-y-3 text-gray-600">
                        <p>Here is how you can get started:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Check the map to find <strong>Stations</strong> near you.</li>
                            <li>Look for <strong>Available Supplies</strong> updated in real-time.</li>
                            <li>Need something specific? Use the search bar to filter by category.</li>
                        </ul>
                    </div>
                );
                break;
            case UserRole.VOLUNTEER:
                title = "Welcome Volunteer";
                content = (
                    <div className="space-y-3 text-gray-600">
                        <p>Thank you for your help! Here is what you can do:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Join a <strong>Station Team</strong> to coordinate efforts.</li>
                            <li>View and accept <strong>Tasks</strong> to help operations run smoothly.</li>
                            <li>Update station statuses to keep residents informed.</li>
                        </ul>
                    </div>
                );
                break;
            case UserRole.DRIVER:
                title = "Welcome Driver";
                content = (
                    <div className="space-y-3 text-gray-600">
                        <p>Your vehicle can make a huge difference:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Find <strong>Transport Tasks</strong> to move supplies.</li>
                            <li>Accept tasks that fit your vehicle type and route.</li>
                            <li>Mark tasks as completed to track your impact.</li>
                        </ul>
                    </div>
                );
                break;
            case UserRole.STATION_MANAGER:
                 title = "Welcome Station Manager";
                 content = (
                    <div className="space-y-3 text-gray-600">
                         <p>Manage your station effectively:</p>
                         <ul className="list-disc pl-5 space-y-2">
                            <li>Oversee <strong>inventory</strong> and supply requests.</li>
                            <li>Manage your <strong>team members</strong> and volunteers.</li>
                            <li>Coordinate with other stations and drivers.</li>
                         </ul>
                    </div>
                 );
                 break;
            case UserRole.ADMIN:
                title = "Welcome Admin";
                content = (
                    <div className="space-y-3 text-gray-600">
                        <p>System Overview:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Manage all <strong>users, stations, and tasks</strong>.</li>
                            <li>Review analytics and system health.</li>
                            <li>Handle high-level configurations and alerts.</li>
                        </ul>
                    </div>
                );
                break;
            default:
                content = <p>Welcome to the platform.</p>;
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                     {selectedRole === UserRole.RESIDENT && <User className="w-8 h-8 text-blue-600" />}
                     {selectedRole === UserRole.VOLUNTEER && <Heart className="w-8 h-8 text-green-600" />}
                     {selectedRole === UserRole.DRIVER && <Truck className="w-8 h-8 text-orange-600" />}
                     {selectedRole === UserRole.STATION_MANAGER && <Users className="w-8 h-8 text-purple-600" />}
                     {selectedRole === UserRole.ADMIN && <LayoutDashboard className="w-8 h-8 text-red-600" />}
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                </div>
                {content}
                <button
                    onClick={handleComplete}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                    <span>Get Started</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6">
                    {step === 0 && (
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-3xl">👋</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Tai Po Rescue</h1>
                                <p className="text-gray-600">
                                    We connect neighbors to help each other during emergencies.
                                    Let's get you set up.
                                </p>
                            </div>
                            <button
                                onClick={() => setStep(1)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 1 && renderRoleSelection()}

                    {step === 2 && renderRoleInfo()}
                </div>

                {step > 0 && step < 2 && (
                   <div className="bg-gray-50 px-6 py-3 flex justify-between items-center text-sm text-gray-500">
                       <button onClick={() => setStep(step - 1)} className="hover:text-gray-900">Back</button>
                       <span>Step {step + 1} of 3</span>
                   </div>
                )}
            </div>
        </div>
    );
};
