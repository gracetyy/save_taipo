import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResidentView } from './pages/ResidentView';
import { VolunteerHub } from './pages/VolunteerHub';
import { LogisticsView } from './pages/Driver/LogisticsView';
import { MeView } from './pages/MeView';
import { StationDetailView } from './pages/StationDetailView';
import { UsefulLinksView } from './pages/UsefulLinksView';
import { MyStationsView } from './pages/StationManager/MyStationsView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { UserRole } from './types';
import { OnboardingTour } from './components/OnboardingTour';
import { PreLoginOnboarding } from './components/PreLoginOnboarding';
import DriverRequests from './pages/Admin/DriverRequests';
import { UserManagement } from './pages/Admin/UserManagement';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

const AppContent = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showPreLoginOnboarding, setShowPreLoginOnboarding] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const hasCompletedPreLoginOnboarding = localStorage.getItem('preLoginOnboardingCompleted_v1');
    // Don't show onboarding to logged-in users (assume they have already completed it).
    // Also don't show while auth state is loading.
    if (!hasCompletedPreLoginOnboarding && !user && !isLoading) {
      setShowPreLoginOnboarding(true);
    }
  }, [user]);

  // If user logged in while pre-login onboarding is displayed, auto-close it
  useEffect(() => {
    if (user && showPreLoginOnboarding) {
      setShowPreLoginOnboarding(false);
    }
  }, [user, showPreLoginOnboarding]);

  const { setPreLoginRole } = useAuth();
  const handleRoleSelected = (role: UserRole) => {
    // Prefers only RESIDENT or VOLUNTEER for pre-login selection
    setPreLoginRole(role);
  };

  const handleOnboardingComplete = (coords?: {lat: number, lng: number}) => {
    localStorage.setItem('preLoginOnboardingCompleted_v1', 'true');
    if (coords) setLocation(coords);
    setShowPreLoginOnboarding(false);
  };

  if (showPreLoginOnboarding) {
    return <PreLoginOnboarding onRoleSelected={handleRoleSelected} onComplete={handleOnboardingComplete} />;
  }

  return (
    <HashRouter>
        <OnboardingTour onComplete={handleOnboardingComplete} />
        <Routes>
            <Route element={<MainLayout />}>
                {/* Public / Resident Routes */}
                <Route path="/" element={<ResidentView userLocation={location} />} />
                <Route path="/resident" element={<ResidentView userLocation={location} />} />
                <Route path="/links" element={<UsefulLinksView />} />
                <Route path="/me" element={<MeView userLocation={location} onSetLocation={setLocation} />} />
                <Route path="/station/:id" element={<StationDetailView userLocation={location} />} />

                {/* Volunteer Routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.VOLUNTEER, UserRole.STATION_MANAGER, UserRole.DRIVER, UserRole.ADMIN]} />}>
                    <Route path="/volunteer/hub" element={<VolunteerHub userLocation={location} />} />
                </Route>

                {/* Logistics / Driver Routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.DRIVER, UserRole.ADMIN]} />}>
                    <Route path="/driver/tasks" element={<LogisticsView userLocation={location} />} />
                </Route>

                {/* Station Manager Routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.STATION_MANAGER, UserRole.ADMIN]} />}>
                    <Route path="/manager/stations" element={<MyStationsView userLocation={location} />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path="/admin/driver-requests" element={<DriverRequests />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/dashboard" element={<Navigate to="/admin/driver-requests" replace />} />
                </Route>
                
                {/* Legacy Redirects */}
                <Route path="/volunteer" element={<Navigate to="/volunteer/hub" replace />} />
                <Route path="/logistics" element={<Navigate to="/driver/tasks" replace />} />
                <Route path="/my-stations" element={<Navigate to="/manager/stations" replace />} />
            </Route>
        </Routes>
    </HashRouter>
  );
};

export default function App() {
  return (
    <LanguageProvider>
        <AuthProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </AuthProvider>
    </LanguageProvider>
  );
}
