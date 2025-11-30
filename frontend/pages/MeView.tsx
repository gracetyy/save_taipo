import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station, UserRole } from '../types';
import { getStations, getFavoriteIds, getGlobalAlert, setGlobalAlert } from '../services/dataService';
import { StationCard } from '../components/StationCard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../services/apiClient';
import { User, LogOut, ShieldCheck, Truck, Users, UserCircle, Bell, Save, Home, ChevronRight, MapPin } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

import { DriverRequestModal } from '../components/DriverRequestModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface Props {
  userLocation: { lat: number; lng: number } | null;
  onSetLocation?: (coords: { lat: number; lng: number }) => void;
}

export const MeView: React.FC<Props> = ({ userLocation, onSetLocation }) => {
  const navigate = useNavigate();
  const { user, logout, login, refreshUser, setPreLoginRole, currentRole, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [savedStations, setSavedStations] = useState<Station[]>([]);
  const [ownedStationsCount, setOwnedStationsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriverRequestModalOpen, setIsDriverRequestModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{title?: string; message: string; onConfirm: () => void; destructive?: boolean} | null>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  
  // Admin Global Alert State
  const [alertText, setAlertText] = useState('');

  const refreshFavorites = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    };
    !isLoading && setIsLoading(true);
    const allStations = await getStations();
    const favIds = await getFavoriteIds(user.id);
    const filtered = allStations.filter(s => favIds.includes(s.id));
    setSavedStations(filtered);
    
    // Count owned stations
    if (user) {
      const owned = allStations.filter(s => 
        s.ownerId === user.id || 
        (user.role === UserRole.STATION_MANAGER && user.managedStationIds?.includes(s.id)) ||
        user.role === UserRole.ADMIN
      );
      setOwnedStationsCount(owned.length);
    }
    setIsLoading(false);
  };

  const handleEnableLocation = () => {
    const defaultComplete = () => {
      showToast('Unable to retrieve location; you may need to allow permissions in your browser settings.', 'error');
    };
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            try { localStorage.setItem('user_location', JSON.stringify(coords)); } catch {}
            if (onSetLocation) onSetLocation(coords);
            showToast('Location updated', 'success');
          },
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
  };

  useEffect(() => {
    refreshFavorites();
    const loadAlert = async () => {
      if (user?.role === UserRole.ADMIN) {
        const alert = await getGlobalAlert();
        setAlertText(alert || '');
      }
    };
    loadAlert();
  }, [user]);

  const handleSaveAlert = async () => {
      if (user) {
        await setGlobalAlert(alertText, user.id);
        showToast('Global alert updated', 'success');
      }
  }

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN:
              return <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><ShieldCheck size={10} className="mr-1"/>ADMIN</span>;
          case UserRole.STATION_MANAGER:
              return <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><Users size={10} className="mr-1"/>LEAD</span>;
          case UserRole.DRIVER:
              return <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><Truck size={10} className="mr-1"/>DRIVER</span>;
          case UserRole.VOLUNTEER:
              return <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center">VOLUNTEER</span>;
          default:
              return <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><UserCircle size={10} className="mr-1"/>RESIDENT</span>;
      }
  }

  return (
    <div className="pb-24">
      {isDriverRequestModalOpen && user && (
        <DriverRequestModal
          user={user}
          onClose={() => setIsDriverRequestModalOpen(false)}
          onComplete={() => {
            // You might want to refresh user data here to show "pending" status
            refreshUser();
          }}
        />
      )}
      {confirmConfig && (
        <ConfirmModal
          open={isConfirmOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          destructive={confirmConfig.destructive}
          onConfirm={() => {
            try {
              if (confirmConfig?.onConfirm) confirmConfig.onConfirm();
            } catch (e) {
              console.error('Confirm action failed', e);
            } finally {
              setIsConfirmOpen(false);
              setConfirmConfig(null);
            }
          }}
          onCancel={() => { setIsConfirmOpen(false); setConfirmConfig(null); }}
        />
      )}
      {/* Profile Section */}
      <div className="bg-white p-6 mb-2 border-b">
        <h2 className="text-2xl font-bold mb-4">{t('me.title')}</h2>
                {user ? (
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                {user.name.charAt(0)}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {user.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 mb-2">
                    {getRoleBadge(user.role)}
                    <div className="mt-2 flex gap-2">
                          <button
                            onClick={handleEnableLocation}
                            className="text-sm text-blue-600 font-bold flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition w-fit"
                          >
                            <MapPin size={14} className="mr-1.5"/> {t('onboarding.location_allow')}
                            </button>
                        </div>

                        {/* Role buttons moved below the profile for layout clarity */}
                </div>
                <p className="text-gray-500 text-sm mb-2">{user.email}</p>
                {user.role !== UserRole.DRIVER && user.role !== UserRole.ADMIN && (
                  <button
                    onClick={() => setIsDriverRequestModalOpen(true)}
                    className="text-sm text-blue-600 font-bold flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition w-fit"
                  >
                    <Truck size={14} className="mr-1.5"/> Request to be a Driver
                  </button>
                )}
                {user.role === UserRole.STATION_MANAGER && user.managedStationIds && (
                     <p className="text-xs text-purple-600 font-medium mb-2">{t('station.managed_station_id')} {user.managedStationIds.join(', ')}</p>
                )}
                <button
                    onClick={logout}
                    className="text-sm text-red-600 font-bold flex items-center hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition w-fit"
                >
                    <LogOut size={14} className="mr-1.5"/> {t('btn.signout')}
                </button>
            </div>
          </div>
        ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <User size={24} />
                </div>
                <p className="text-gray-500 mb-3 text-sm">{t('me.login_desc')}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={login}
                    className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition"
                  >
                    {t('btn.signin')}
                  </button>
                  <button
                    onClick={handleEnableLocation}
                    className="text-sm text-blue-600 px-4 py-2 font-bold rounded-full border border-blue-100 hover:bg-blue-50 transition"
                  >
                    {t('onboarding.location_allow')}
                  </button>
                </div>
            </div>
        )}
      </div>

      {/* Role Switch Card - below profile */}
      <div className="p-4 bg-white border-b mb-2">
        <h3 className="font-bold text-gray-800 text-lg mb-3">{t('me.switch_role')}</h3>
        {/* Guest pre-login role selection */}
        {!isLoggedIn && (
          <div className="flex gap-2">
            <button
              onClick={() => { setConfirmConfig({ title: t('me.switch_guest_resident'), message: t('confirm.guest_switch_resident'), onConfirm: () => { setPreLoginRole(UserRole.RESIDENT); showToast('Now viewing as Resident (guest)', 'info'); setIsConfirmOpen(false); } }); setIsConfirmOpen(true); }}
              className={`px-4 py-2 rounded-full text-sm ${currentRole === UserRole.RESIDENT ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {t('nav.resident')}
            </button>
            <button
              onClick={() => { setConfirmConfig({ title: t('me.switch_guest_volunteer'), message: t('confirm.guest_switch_volunteer'), onConfirm: () => { setPreLoginRole(UserRole.VOLUNTEER); showToast('Now viewing as Volunteer (guest)', 'info'); setIsConfirmOpen(false); } }); setIsConfirmOpen(true); }}
              className={`px-4 py-2 rounded-full text-sm ${currentRole === UserRole.VOLUNTEER ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {t('nav.volunteer')}
            </button>
          </div>
        )}

        {/* Role switcher for authenticated users (RESIDENT / VOLUNTEER) */}
        {isLoggedIn && user && (user.role === UserRole.RESIDENT || user.role === UserRole.VOLUNTEER) && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const otherRole = user.role === UserRole.RESIDENT ? UserRole.VOLUNTEER : UserRole.RESIDENT;
                  setConfirmConfig({
                  title: `Switch role to ${otherRole}`,
                  message: `Switching to ${otherRole} will update your account role and may change accessible features. Continue?`,
                  destructive: false,
                  onConfirm: async () => {
                                  setIsSwitchingRole(true);
                                  try {
                                    await apiClient.post('/roles/self-update', { role: otherRole });
                                    // clear any pre-login role selection stored in localStorage (avoid confusion)
                                    try { localStorage.removeItem('preLoginRoleSelection_v1'); } catch (e) {}
                                    await refreshUser();
                                    showToast('Role updated', 'success');
                                  } catch (err) {
                                    console.error('Failed to change role', err);
                                    showToast('Failed to update role', 'error');
                                  } finally {
                                    setIsConfirmOpen(false);
                                    setIsSwitchingRole(false);
                                  }
                  }
                });
                setIsConfirmOpen(true);
              }}
                            className="px-4 py-2 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
                            disabled={isSwitchingRole}
            >
              {user.role === UserRole.RESIDENT ? `Switch to ${t('nav.volunteer')}` : `Switch to ${t('nav.resident')}`}
            </button>
          </div>
        )}
      </div>

      {/* Admin Panel */}
      {user?.role === UserRole.ADMIN && (
        <div className="p-4 bg-white border-b mb-2">
          <h3 className="font-bold text-gray-800 text-lg mb-3">Admin Panel</h3>
          <button
            onClick={() => navigate('/admin/driver-requests')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600">
                <Truck size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Driver Requests</h3>
                <p className="text-sm text-gray-500">Review pending requests</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Admin Global Broadcast */}
      {user?.role === UserRole.ADMIN && (
          <div className="p-4 bg-red-50 border-b border-red-100 mb-2">
              <h3 className="font-bold text-red-800 text-sm flex items-center mb-2">
                  <Bell size={16} className="mr-2"/> {t('admin.global_alert_broadcast')}
              </h3>
              <textarea
                  className="w-full p-2 text-sm border border-red-200 rounded-lg mb-2 focus:ring-red-500 focus:border-red-500"
                  rows={2}
                  placeholder={t('admin.alert_placeholder')}
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
              />
              <button onClick={handleSaveAlert} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center hover:bg-red-700">
                  <Save size={14} className="mr-1"/> {t('admin.publish_alert')}
              </button>
          </div>
      )}

      {/* My Stations - Station Owner Section */}
      {user && ownedStationsCount > 0 && (
          <div className="p-4 bg-white border-b mb-2">
              <button
                  onClick={() => navigate('/manager/stations')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 hover:shadow-md transition"
              >
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                          <Home size={24} />
                      </div>
                      <div className="text-left">
                          <h3 className="font-bold text-gray-900">{t('me.my_stations')}</h3>
                          <p className="text-sm text-gray-500">Manage {ownedStationsCount} station{ownedStationsCount > 1 ? 's' : ''}</p>
                      </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
              </button>
          </div>
      )}

      {/* Saved List - only show for logged-in users */}
      {user && (
      <div className="p-4">
          <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center">
             {t('me.saved_stations')}
             <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{savedStations.length}</span>
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-gray-400">{t('common.loading')}</p>
            </div>
          ) : savedStations.length > 0 ? (
              savedStations.map(s => (
                  <StationCard
                      key={s.id}
                      station={s}
                      userLocation={userLocation}
                      onUpdate={refreshFavorites}
                      mode="RESIDENT"
                  />
              ))
          ) : (
              <div className="text-center py-12 text-gray-400">
                  <p>{t('me.no_saved')}</p>
              </div>
          )}
      </div>
      )}
    </div>
  );
};
