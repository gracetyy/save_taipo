import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { apiClient } from '../services/apiClient';
import { ChevronRight, User, Heart, Truck, Users, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingTourProps {
    onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const { user, refreshUser } = useAuth();
    const { t, setLanguage, language } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    useEffect(() => {
        if (!user) return;
        const storageKey = `onboarding_completed_${user.id}_v2`;
        const hasSeenTour = localStorage.getItem(storageKey);

        if (!hasSeenTour) {
            setIsVisible(true);
            if (user.role && user.role !== UserRole.RESIDENT && user.role !== UserRole.GUEST) {
                setSelectedRole(user.role);
                setStep(2);
            }
        }
    }, [user]);

    const handleComplete = () => {
        if (user) {
            const storageKey = `onboarding_completed_${user.id}_v2`;
            localStorage.setItem(storageKey, 'true');
        }
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const updateRole = async (role: UserRole) => {
        try {
            await apiClient.post('/roles/self-update', { role });
            await refreshUser();
        } catch (error) {
            console.error("Failed to update role", error);
        } finally {
            setSelectedRole(role);
            setStep(2);
        }
    };

    if (!isVisible) return null;

    const renderWelcomeStep = () => (
        <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">👋</span>
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome_title')}</h1>
                <p className="text-gray-600">{t('welcome_subtitle')}</p>
            </div>
            <div className="flex justify-center items-center space-x-4">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-md ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>EN</button>
                <button onClick={() => setLanguage('zh')} className={`px-3 py-1 rounded-md ${language === 'zh' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>中文</button>
            </div>
            <button
                onClick={() => setStep(1)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                {t('get_started')}
            </button>
        </div>
    );

    const renderRoleSelection = () => (
        <div className="space-y-4">
             <h2 className="text-xl font-bold text-gray-800">{t('what_brings_you_here')}</h2>
            <div className="grid gap-4">
                <button
                    onClick={() => updateRole(UserRole.RESIDENT)}
                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 flex items-center space-x-3 transition-all"
                >
                    <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900">{t('i_need_help')}</div>
                        <div className="text-sm text-gray-600">{t('find_supplies')}</div>
                    </div>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">{t('or_i_want_to_help')}</span>
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
                        <div className="font-semibold text-gray-900">{t('i_want_to_volunteer')}</div>
                        <div className="text-sm text-gray-600">{t('join_teams')}</div>
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
                        <div className="font-semibold text-gray-900">{t('i_am_a_driver')}</div>
                        <div className="text-sm text-gray-600">{t('help_transport')}</div>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderRoleInfo = () => {
        let title = "";
        let content;

        switch (selectedRole) {
            case UserRole.RESIDENT:
                title = t('welcome_resident_title');
                content = (
                    <>
                        <p>{t('welcome_resident_subtitle')}</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>{t('resident_point_1')}</li>
                            <li>{t('resident_point_2')}</li>
                            <li>{t('resident_point_3')}</li>
                        </ul>
                    </>
                );
                break;
             case UserRole.VOLUNTEER:
                title = t('welcome_volunteer_title');
                content = (
                    <>
                        <p>{t('welcome_volunteer_subtitle')}</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>{t('volunteer_point_1')}</li>
                            <li>{t('volunteer_point_2')}</li>
                            <li>{t('volunteer_point_3')}</li>
                        </ul>
                    </>
                );
                break;
            case UserRole.DRIVER:
                title = t('welcome_driver_title');
                content = (
                    <>
                        <p>{t('welcome_driver_subtitle')}</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>{t('driver_point_1')}</li>
                            <li>{t('driver_point_2')}</li>
                        </ul>
                    </>
                );
                break;
             case UserRole.STATION_MANAGER:
                 title = t('welcome_station_manager_title');
                 content = (
                    <>
                        <p>{t('welcome_station_manager_subtitle')}</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>{t('station_manager_point_1')}</li>
                            <li>{t('station_manager_point_2')}</li>
                            <li>{t('station_manager_point_3')}</li>
                        </ul>
                    </>
                 );
                 break;
            case UserRole.ADMIN:
                title = t('welcome_admin_title');
                 content = (
                    <>
                        <p>{t('welcome_admin_subtitle')}</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>{t('admin_point_1')}</li>
                            <li>{t('admin_point_2')}</li>
                            <li>{t('admin_point_3')}</li>
                        </ul>
                    </>
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
                 <div className="space-y-3 text-gray-600">{content}</div>
                <button
                    onClick={handleComplete}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                    <span>{t('get_started')}</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
                 <button
                    onClick={() => setStep(1)}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-900 mt-2"
                >
                    {t('back_to_role_selection')}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 md:p-8">
                    {step === 0 && renderWelcomeStep()}
                    {step === 1 && renderRoleSelection()}
                    {step === 2 && renderRoleInfo()}
                </div>
            </div>
        </div>
    );
};
