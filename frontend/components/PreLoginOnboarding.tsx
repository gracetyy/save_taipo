import React, { useState } from 'react';
import { User, Heart } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../services/apiClient';

interface PreLoginOnboardingProps {
  onRoleSelected: (role: UserRole) => void;
  onComplete: (coords?: { lat: number; lng: number }) => void;
}

export const PreLoginOnboarding: React.FC<PreLoginOnboardingProps> = ({ onRoleSelected, onComplete }) => {
  const [step, setStep] = useState(() => {
    try {
      const seen = localStorage.getItem('onboarding_welcome_shown_v1');
      return seen ? 1 : 0;
    } catch (err) {
      return 0;
    }
  });
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { login, refreshUser, user, isLoading } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  // Start with the welcome page (language selection) as step 0 and proceed to role selection.
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-6 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome_title')}</h1>
              <p className="text-gray-600 mb-2">{t('welcome_subtitle')}</p>
            </div>
            <div className="flex justify-center items-center space-x-4">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-md ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>EN</button>
              <button onClick={() => setLanguage('zh')} className={`px-3 py-1 rounded-md ${language === 'zh' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>中文</button>
            </div>
            <button
              onClick={async () => {
                try { localStorage.setItem('onboarding_welcome_shown_v1', 'true'); } catch {}
                // If user is signed in, persist welcome shown to backend
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
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 text-center">{t('what_brings_you_here')}</h2>
            <div className="text-right">
              <button
                onClick={() => setStep(3)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('btn.skip')}
              </button>
            </div>
            <button
              onClick={() => { setSelectedRole(UserRole.RESIDENT); setStep(2); }}
              className="w-full p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 flex items-center space-x-3 transition-all"
            >
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">{t('i_need_help')}</div>
                <div className="text-sm text-gray-600">{t('find_supplies')}</div>
              </div>
            </button>
            <button
              onClick={() => { setSelectedRole(UserRole.VOLUNTEER); setStep(2); }}
              className="w-full p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 flex items-center space-x-3 transition-all"
            >
              <div className="bg-green-100 p-2 rounded-full">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">{t('i_want_to_volunteer')}</div>
                <div className="text-sm text-gray-600">{t('join_teams')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Removed the single-role 'start' page; role selection now directly goes to feature intro (step 2)
  if (step === 2 && selectedRole) {
    const title = selectedRole === UserRole.RESIDENT ? t('welcome_resident_title') : t('welcome_volunteer_title');
    let content: JSX.Element | null = null;
    if (selectedRole === UserRole.RESIDENT) {
      content = <div className="whitespace-pre-line text-gray-600">{t('resident_points')}</div>;
    } else if (selectedRole === UserRole.VOLUNTEER) {
      content = <div className="whitespace-pre-line text-gray-600">{t('volunteer_points')}</div>;
    }

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              {selectedRole === UserRole.RESIDENT && <User className="w-8 h-8 text-blue-600" />}
              {selectedRole === UserRole.VOLUNTEER && <Heart className="w-8 h-8 text-green-600" />}
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            </div>
            <div className="space-y-3 text-gray-600">{content}</div>
            <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-700">
              <div className="font-semibold mb-1">{t('onboarding.logged_in_features.title')}</div>
              <div>{t('onboarding.logged_in_features.desc')}</div>
            </div>
            <div className="space-y-2">
              <button
                disabled={submitting || isLoading}
                onClick={async () => {
                  try {
                    setSubmitting(true);
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
                    onRoleSelected(selectedRole);
                    setStep(3);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('btn.signin')}
              </button>
              <button
                className="w-full border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50"
                onClick={() => {
                  onRoleSelected(selectedRole);
                  setStep(3);
                }}
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
        </div>
      </div>
    );
  }
  if (step === 3) {
    // Show the location permission explanation and ask the user to allow location
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">{t('onboarding.location_title')}</h2>
              <p className="text-gray-600 mt-2">{t('onboarding.location_desc')}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // request geolocation then call onComplete with coords or fallback
                  const defaultComplete = () => onComplete();
                  if (navigator.geolocation) {
                    try {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => onComplete({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        (err) => {
                          console.warn('Location permission denied or failed', err);
                          defaultComplete();
                        }
                      );
                    } catch (err) {
                      console.warn('Location API error', err);
                      defaultComplete();
                    }
                  } else {
                    defaultComplete();
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('onboarding.location_allow')}
              </button>
              <button
                onClick={() => { onComplete(); }}
                className="w-full border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                {t('onboarding.location_maybe_later')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
