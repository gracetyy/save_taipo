import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { apiClient } from '../services/apiClient';
import { ChevronRight, User, Heart, Truck, Users, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingTourProps {
    onComplete?: (coords?: { lat: number; lng: number }) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const { user, refreshUser, login } = useAuth();
    const { t, setLanguage, language } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(() => {
        try {
            // logged-in users who already finished the tour shouldn't see welcome
            if (user) {
                const completed = localStorage.getItem(`onboarding_completed_${user.id}_v2`);
                if (completed) return 1;
            }
            const seen = localStorage.getItem('onboarding_welcome_shown_v1');
            return seen ? 1 : 0;
        } catch (err) {
            return 0;
        }
    });
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

    const handleComplete = (coords?: { lat: number; lng: number }) => {
        if (user) {
            const storageKey = `onboarding_completed_${user.id}_v2`;
            localStorage.setItem(storageKey, 'true');
        }
        setIsVisible(false);
        if (onComplete) onComplete(coords);
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

    // Welcome step removed — onboarding starts at role selection (step 1). Kept for reference if needed.

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
                onClick={async () => {
                    try { localStorage.setItem('onboarding_welcome_shown_v1', 'true'); } catch {}
                    try {
                        if (user) {
                            await apiClient.post('/users/self-update', { welcomeShown: true });
                        }
                    } catch (err) {
                        console.error('Failed to persist welcomeShown on backend', err);
                    }
                    setStep(1);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                {t('get_started')}
            </button>
        </div>
    );

    const renderRoleSelection = () => (
        <div className="space-y-4">
             <h2 className="text-xl font-bold text-gray-800">{t('what_brings_you_here')}</h2>
            <div className="text-right">
                <button
                    onClick={() => setStep(3)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    {t('btn.skip')}
                </button>
            </div>
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
                        <div className="whitespace-pre-line text-gray-600">{t('resident_points')}</div>
                    </>
                );
                break;
            case UserRole.VOLUNTEER:
                title = t('welcome_volunteer_title');
                content = (
                    <>
                        <div className="whitespace-pre-line text-gray-600">{t('volunteer_points')}</div>
                    </>
                );
                break;
            case UserRole.DRIVER:
                title = t('welcome_driver_title');
                content = (
                    <>
                        <div className="whitespace-pre-line text-gray-600">{t('driver_points')}</div>
                    </>
                );
                break;
             case UserRole.STATION_MANAGER:
                 title = t('welcome_station_manager_title');
                 content = (
                    <>
                        <div className="whitespace-pre-line text-gray-600">{t('station_manager_points')}</div>
                    </>
                 );
                 break;
            case UserRole.ADMIN:
                title = t('welcome_admin_title');
                 content = (
                    <>
                        <div className="whitespace-pre-line text-gray-600">{t('admin_points')}</div>
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
                <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-700">
                    <div className="font-semibold mb-1">{t('onboarding.logged_in_features.title')}</div>
                    <div>{t('onboarding.logged_in_features.desc')}</div>
                </div>
                <div className="space-y-2">
                    <button
                        onClick={async () => {
                            try {
                                await login();
                                await refreshUser();
                                if (selectedRole) {
                                    try {
                                        await apiClient.post('/roles/self-update', { role: selectedRole });
                                        await refreshUser();
                                    } catch (err) {
                                        console.error('Failed to set role after login', err);
                                    }
                                }
                            } catch (err) {
                                console.error('Login failed', err);
                            } finally {
                                setStep(3);
                            }
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <span>{t('get_started')}</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        disabled={false}
                        onClick={() => setStep(3)}
                        className="w-full border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50"
                    >
                        {t('btn.continue_without_login')}
                    </button>
                </div>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 md:p-8">
                                                {/* welcome page is step 0 */}
                                                {step === 0 && renderWelcomeStep()}
                                                {step === 1 && renderRoleSelection()}
                                {step === 2 && renderRoleInfo()}
                                {step === 3 && (
                                        <div className="text-center space-y-6">
                                                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-3xl">📍</span>
                                                </div>
                                                <div>
                                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.location_title')}</h1>
                                                        <p className="text-gray-600">{t('onboarding.location_desc')}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <button
                                                        onClick={() => {
                                                            const defaultComplete = () => handleComplete();
                                                            if (navigator.geolocation) {
                                                                try {
                                                                    navigator.geolocation.getCurrentPosition(
                                                                        (pos) => handleComplete({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                                                                        (err) => { console.warn('Location permission denied or failed', err); defaultComplete(); }
                                                                    );
                                                                } catch (err) {
                                                                    console.warn('Location API error', err); defaultComplete();
                                                                }
                                                            } else { defaultComplete(); }
                                                        }}
                                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        {t('onboarding.location_allow')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleComplete()}
                                                        className="w-full border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50"
                                                    >
                                                        {t('onboarding.location_maybe_later')}
                                                    </button>
                                                </div>
                                        </div>
                                )}
                </div>
            </div>
        </div>
    );
};
