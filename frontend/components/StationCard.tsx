import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station, SupplyStatus, CrowdStatus, UserRole } from '../../types';
import { Clock, MapPin, Phone, ThumbsUp, ThumbsDown, Navigation, Dog, Baby, BatteryCharging, Accessibility, Heart, MessageCircle, Users, BadgeCheck, Edit, Trash2 } from 'lucide-react';
import { verifyStation, toggleFavorite, isFavorite, getUserVote, getFavoriteIds, deleteStation } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import EditStationModal from './EditStationModal';

interface Props {
  station: Station;
  userLocation: { lat: number; lng: number } | null;
  onUpdate: () => void;
  mode: 'RESIDENT' | 'VOLUNTEER';
}

export const StationCard: React.FC<Props> = ({ station, userLocation, onUpdate, mode }) => {
  const navigate = useNavigate();
  const { user, firebaseUser, login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isFav, setIsFav] = useState(() => isFavorite(station.id));
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | undefined>(undefined);
  const [hasFetched, setHasFetched] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canManage = user && (
    user.role === UserRole.ADMIN || 
    (user.role === UserRole.STATION_MANAGER && user.managedStationIds?.includes(station.id))
  );

  useEffect(() => {
    // Reset fetch status when user changes
    setHasFetched(false);
  }, [user?.id]);

  useEffect(() => {
    // Only fetch once per user/station combo
    if (hasFetched) return;
    
    const checkStatus = async () => {
      // Only fetch from API if user is logged in with a real Firebase account
      if (user && firebaseUser) {
        setHasFetched(true);
        try {
          const favs = await getFavoriteIds(user.id);
          setIsFav(favs.includes(station.id));
          const vote = await getUserVote(user.id, station.id);
          setUserVote(vote ?? undefined);
        } catch (error) {
          // Silently fail and use cached data
          console.debug('Failed to fetch user data, using cache');
          setIsFav(isFavorite(station.id));
        }
      } else {
        // Not logged in - use local cache only
        setIsFav(isFavorite(station.id));
        setUserVote(undefined);
      }
    };
    checkStatus();
  }, [station.id, user, firebaseUser, hasFetched]);

  const distance = useMemo(() => {
    if (!userLocation) return null;
    const R = 6371; // km
    const dLat = (station.lat - userLocation.lat) * Math.PI / 180;
    const dLon = (station.lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(station.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  }, [userLocation, station]);

  const lastActivity = Math.max(station.lastUpdated, station.lastVerified || 0);
  const timeSinceActivity = (Date.now() - lastActivity) / (1000 * 60);
  const isOutdated = timeSinceActivity > 240; // 4 hours

  const timeSinceContentUpdate = (Date.now() - station.lastUpdated) / (1000 * 60);

  const handleCardClick = () => {
    navigate(`/station/${station.id}`);
  };

  const handleVerify = async (e: React.MouseEvent, positive: boolean) => {
    e.stopPropagation();
    if (!user) {
        showToast(t('auth.login_vote_alert'), 'error', {
            label: t('btn.signin'),
            onClick: login
        });
        return;
    }
    // Pass user.role to apply weight
    await verifyStation(station.id, positive, user.id, user.role);
    const vote = await getUserVote(user.id, station.id);
    setUserVote(vote ?? undefined);
    onUpdate();
  };

  const handleToggleFav = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        showToast(t('auth.login_fav_alert'), 'error', {
            label: t('btn.signin'),
            onClick: login
        });
        return;
    }
      await toggleFavorite(user.id, station.id);
      setIsFav(!isFav);
  }

  const handleNavigate = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`;
      window.open(url, '_blank');
  };

  const handleContact = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (station.contactLink) {
          window.open(station.contactLink, '_blank');
      }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('station.confirm_delete'))) {
        try {
            await deleteStation(station.id);
            showToast(t('station.delete_success'), 'success');
            onUpdate();
        } catch (error) {
            showToast(t('station.delete_fail'), 'error');
        }
    }
  };
 
  const handleUpdate = () => {
    setIsEditModalOpen(false);
    onUpdate();
  };

  const getStatusColor = (status: SupplyStatus) => {
    if (isOutdated) return 'bg-gray-200 text-gray-500 border-gray-300';
    switch (status) {
      case SupplyStatus.AVAILABLE: return 'bg-green-100 text-green-800 border-green-200';
      case SupplyStatus.LOW_STOCK: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case SupplyStatus.EMPTY_CLOSED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100';
    }
  };

  const getCrowdColor = (status?: CrowdStatus) => {
      switch(status) {
          case CrowdStatus.LOW: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
          case CrowdStatus.MEDIUM: return 'bg-amber-50 text-amber-700 border-amber-100';
          case CrowdStatus.HIGH: return 'bg-orange-50 text-orange-700 border-orange-100';
          case CrowdStatus.FULL: return 'bg-red-50 text-red-700 border-red-100 font-bold';
          default: return 'hidden';
      }
  }

  const getStatusText = (status: SupplyStatus) => {
    if (isOutdated) return t('status.unverified');
    switch (status) {
      case SupplyStatus.AVAILABLE: return t('status.available');
      case SupplyStatus.LOW_STOCK: return t('status.low_stock');
      case SupplyStatus.EMPTY_CLOSED: return t('status.closed');
    }
  };

  const getCrowdText = (status?: CrowdStatus) => {
      switch(status) {
          case CrowdStatus.LOW: return t('crowd.low');
          case CrowdStatus.MEDIUM: return t('crowd.medium');
          case CrowdStatus.HIGH: return t('crowd.high');
          case CrowdStatus.FULL: return t('crowd.full');
          default: return '';
      }
  }

  const getOrgText = (org: string) => {
      switch(org) {
          case 'OFFICIAL': return t('org.official');
          case 'NGO': return t('org.ngo');
          case 'COMMUNITY': return t('org.community');
          default: return org;
      }
  }

  const getVerificationLabel = () => {
      if (!station.verification?.isVerified) return null;
      switch(station.verification.verifiedBy) {
          case 'OFFICIAL': return t('verify.by_official');
          case 'ADMIN': return t('verify.by_admin');
          case 'COMMUNITY': return t('verify.by_community');
          default: return t('verify.verified');
      }
  }

  const totalVotes = (station.upvotes || 0) + (station.downvotes || 0);
  const trustPercent = totalVotes > 0 ? Math.round((station.upvotes / totalVotes) * 100) : 0;
  
  let trustColor = 'text-gray-500';
  if (totalVotes > 0) {
      if (trustPercent >= 70) trustColor = 'text-green-600';
      else if (trustPercent >= 40) trustColor = 'text-yellow-600';
      else trustColor = 'text-red-600';
  }

  const formatTimeUpdate = () => {
      if (timeSinceContentUpdate < 60) {
          return `${Math.floor(timeSinceContentUpdate)} ${t('card.updated_mins')}`;
      } else {
          return `${Math.floor(timeSinceContentUpdate / 60)} ${t('card.updated_hours')}`;
      }
  };

  return (
    <div 
        onClick={handleCardClick}
        className={`bg-white rounded-xl shadow-sm border p-4 mb-4 transition-all relative cursor-pointer hover:shadow-md active:bg-gray-50 ${isOutdated ? 'opacity-75 grayscale-[0.5]' : ''}`}
    >
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-8">
          <div className="flex flex-wrap gap-2 mb-2">
              <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${getStatusColor(station.status)}`}>
                {getStatusText(station.status)}
              </div>
              {station.crowdStatus && (
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs tracking-wide border ${getCrowdColor(station.crowdStatus)}`}>
                      <Users size={10} className="mr-1"/>
                      {getCrowdText(station.crowdStatus)}
                  </div>
              )}
          </div>
          <div className="flex items-center gap-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{station.name}</h3>
              {station.verification?.isVerified && (
                  <span title={getVerificationLabel() || ''} className="flex items-center">
                    <BadgeCheck size={18} className="text-blue-500 shrink-0" fill="currentColor" color="white" />
                  </span>
              )}
          </div>
          {station.verification?.isVerified && (
              <div className="text-[10px] font-medium text-blue-600 mb-1">{getVerificationLabel()}</div>
          )}
          <div className="flex items-center text-sm text-gray-500 mt-1">
             <MapPin size={14} className="mr-1 shrink-0" />
             <span className="truncate max-w-[200px]">{station.address}</span>
             {distance && <span className="ml-2 font-medium text-primary">({distance} km)</span>}
          </div>
        </div>
        <div className="absolute top-4 right-4 flex items-center space-x-2">
            {canManage && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }} className="p-1.5 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100">
                        <Edit size={16} />
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50">
                        <Trash2 size={16} />
                    </button>
                </>
            )}
            <button onClick={handleToggleFav} className="text-gray-400 hover:text-red-500 transition">
                <Heart size={20} fill={isFav ? "#EF4444" : "none"} className={isFav ? "text-red-500" : ""} />
            </button>
        </div>
      </div>

      {/* Features Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {station.organizer === 'OFFICIAL' && <span className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded">{getOrgText('OFFICIAL')}</span>}
        {station.organizer === 'NGO' && <span className="text-[10px] px-2 py-1 bg-purple-600 text-white rounded">{getOrgText('NGO')}</span>}
        {station.organizer === 'COMMUNITY' && <span className="text-[10px] px-2 py-1 bg-orange-500 text-white rounded">{getOrgText('COMMUNITY')}</span>}
        
        {station.features?.hasPets && <span className="bg-blue-50 text-blue-700 p-1 rounded"><Dog size={16}/></span>}
        {station.features?.hasBabyCare && <span className="bg-pink-50 text-pink-700 p-1 rounded"><Baby size={16}/></span>}
        {station.features?.isWheelchairAccessible && <span className="bg-indigo-50 text-indigo-700 p-1 rounded"><Accessibility size={16}/></span>}
        {station.features?.hasCharging && <span className="bg-yellow-50 text-yellow-700 p-1 rounded"><BatteryCharging size={16}/></span>}
      </div>

      {/* Mode Specific Info */}
      <div className="bg-slate-50 rounded-lg p-3 mb-3 text-sm">
        {mode === 'VOLUNTEER' ? (
             <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-700">{t('card.needs')}:</span>
                </div>
                {station.needs && station.needs.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {station.needs.map((n, idx) => (
                             <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full border border-red-200 flex items-center">
                                {n.item}
                                {n.quantity !== undefined && (
                                    <span className="ml-1 text-[10px] bg-white/50 px-1.5 rounded text-red-800 font-bold">
                                        {n.quantity}{n.unit ? n.unit : ''}
                                    </span>
                                )}
                             </span>
                        ))}
                    </div>
                ) : <span className="text-gray-400 italic">{t('card.no_needs')}</span>}
             </div>
        ) : (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-700">{t('card.offerings')}:</span>
                </div>
                {station.offerings && station.offerings.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {station.offerings.map(n => <span key={n} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">{n}</span>)}
                    </div>
                ) : <span className="text-gray-400 italic">{t('card.no_info')}</span>}
             </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between border-t pt-3 mt-1 gap-y-2">
        
        {/* Left: Vote + Time */}
        <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                <button 
                    onClick={(e) => handleVerify(e, true)} 
                    className={`p-1.5 rounded transition ${userVote === 'UP' ? 'bg-green-100 text-green-700' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}
                >
                    <ThumbsUp size={14} fill={userVote === 'UP' ? "currentColor" : "none"} />
                </button>
                
                <span className={`text-[10px] font-bold w-6 text-center ${trustColor}`}>
                    {totalVotes > 0 ? `${trustPercent}%` : '--'}
                </span>

                <button 
                    onClick={(e) => handleVerify(e, false)} 
                    className={`p-1.5 rounded transition ${userVote === 'DOWN' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                >
                    <ThumbsDown size={14} fill={userVote === 'DOWN' ? "currentColor" : "none"} />
                </button>
            </div>
            
            <span className="text-[10px] text-gray-400 flex items-center">
                <Clock size={10} className="mr-0.5" />
                {formatTimeUpdate()}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
            {station.contactLink && (
                 <button 
                    onClick={handleContact}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                    title={t('btn.message')}
                 >
                     <MessageCircle size={18} />
                 </button>
            )}
            <a 
                href={`tel:${station.contactNumber}`} 
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
                <Phone size={18} />
            </a>
            <button 
                onClick={handleNavigate}
                className="flex items-center px-2.5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-teal-800 transition shadow-sm"
            >
                <Navigation size={14} className="mr-1.5" />
                {t('btn.navigate')}
            </button>
        </div>
      </div>
      <EditStationModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            station={station}
            onStationUpdated={handleUpdate}
        />
    </div>
  );
};
