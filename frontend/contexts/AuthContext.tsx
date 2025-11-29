import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { UserProfile, UserRole, UserStatus } from '../types';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  debugLogin: (role?: UserRole, assignedStationId?: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (currentUser: FirebaseUser) => {
      try {
          const token = await currentUser.getIdToken();
          // Send token to backend to verify and get user profile
          const userProfile = await apiClient.post<UserProfile>('/auth/login', { token });
          setUser(userProfile);
        // If user has a preferred language, persist locally and notify rest of app
        try {
          if (typeof window !== 'undefined' && userProfile.prefersLanguage) {
            localStorage.setItem('language', userProfile.prefersLanguage);
            window.dispatchEvent(new CustomEvent('userPrefersLanguage', { detail: userProfile.prefersLanguage }));
          }
          if (typeof window !== 'undefined' && userProfile.welcomeShown) {
            localStorage.setItem('onboarding_welcome_shown_v1', 'true');
          }
        } catch (err) {
          // ignore
        }
          localStorage.setItem('resq_user_session_v2', JSON.stringify(userProfile));
      } catch (error) {
          console.error("Authentication Error:", error);
          setUser(null);
          localStorage.removeItem('resq_user_session_v2');
      }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchUserProfile(user);
        const preLoginRole = localStorage.getItem('preLoginRoleSelection_v1');
        if (preLoginRole === UserRole.VOLUNTEER) {
          try {
            await apiClient.post('/roles/self-claim-volunteer');
            await refreshUser();
            localStorage.removeItem('preLoginRoleSelection_v1');
          } catch (error) {
            console.error("Failed to self-claim volunteer role", error);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('resq_user_session_v2');
      }
      setIsLoading(false);
    });

      // listen for language change events from LanguageContext
      const onLangChange = async (ev: any) => {
        const lang = ev?.detail;
        if (!lang) return;
        // If user is logged in, update preference on backend
        if (auth.currentUser) {
          try {
            await apiClient.post('/users/self-update', { prefersLanguage: lang });
          } catch (err) {
            console.error('Failed to persist language preference', err);
          }
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('languageChanged', onLangChange);
      }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('languageChanged', onLangChange);
      }
    };
  }, []);

  const refreshUser = async () => {
      if (firebaseUser) {
          await fetchUserProfile(firebaseUser);
      }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Google Sign-In Error", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Sign Out Error", error);
    }
  };

  const debugLogin = (role: UserRole = UserRole.RESIDENT, stationId?: string) => {
    const mockUser: UserProfile = {
        id: 'debug_user_' + Math.floor(Math.random() * 1000),
        name: `Test ${role.charAt(0) + role.slice(1).toLowerCase()}`,
        email: `${role.toLowerCase()}@test.com`,
        role: role,
        status: UserStatus.ACTIVE,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        vehicleType: role === UserRole.DRIVER ? 'VAN' : undefined,
        managedStationIds: role === UserRole.STATION_MANAGER ? [stationId || 's01'] : [],
        prefersLanguage: 'en',
        notificationsEnabled: true,
    };
    setUser(mockUser);
    localStorage.setItem('resq_user_session_v2', JSON.stringify(mockUser));
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', mockUser.prefersLanguage || 'en');
        window.dispatchEvent(new CustomEvent('userPrefersLanguage', { detail: mockUser.prefersLanguage }));
      }
    } catch {}
};

if (import.meta.env.DEV) {
    (window as any).debugLogin = debugLogin;
}


  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, refreshUser, debugLogin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
