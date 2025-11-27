import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Station, SupplyStatus, UserRole } from '../../types';
import { getStations, calculateDistance, verifyStation, getUserVote, toggleFavorite, isFavorite, deleteStation, deleteOffering, deleteNeed, getFavoriteIds } from '../services/dataService';
import { ArrowLeft, MapPin, Clock, Phone, MessageCircle, Navigation, Share2, ThumbsUp, ThumbsDown, Heart, AlertTriangle, BadgeCheck, Edit3, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EditStationModal from '../components/EditStationModal';

interface Props {
    userLocation: { lat: number; lng: number } | null;
}

export const StationDetailView: React.FC<Props> = ({ userLocation }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  
  const [station, setStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const distance = useMemo(() => {
    if (!userLocation || !station) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lng);
  }, [userLocation, station]);

  useEffect(() => {
    const loadStation = async () => {
      const allStations = await getStations();
      const found = allStations.find(s => s.id === id);
      if (found) {
        setStation(found);
        if (user) {
          const favs = await getFavoriteIds(user.id);
          setIsFav(favs.includes(found.id));
          const vote = await getUserVote(user.id, found.id);
          setUserVote(vote || undefined);
        } else {
          setIsFav(isFavorite(found.id));
        }
      }
      setIsLoading(false);
    };
    loadStation();
  }, [id, user]);

  const canManage = useMemo(() => {
    if (!user || !station) return false;
    return (
      user.role === UserRole.ADMIN ||
      (station.managers && user.email && station.managers.includes(user.email))
    );
  }, [user, station]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-400">{t('common.loading')}</p>
        </div>
    );
  }

  if (!station) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <AlertTriangle size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700">{t('station.not_found')}</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">
                {t('btn.back')}
            </button>
        </div>
    );
  }

  const handleStationUpdate = (updatedStation: Station) => {
    setStation(updatedStation);
  };

  const handleDeleteStation = async () => {
    if (!station) return;
    if (window.confirm(t('station.delete_confirm'))) {
      try {
        await deleteStation(station.id);
        showToast(t('station.delete_success'), 'success');
        navigate('/');
      } catch (error) {
        showToast(t('station.delete_error'), 'error');
      }
    }
  };

  const handleDeleteNeed = async (needToDelete: string) => {
    if (!station) return;
    if (window.confirm(`${t('station.delete_need_confirm')} ${needToDelete}?`)) {
      try {
        await deleteNeed(station.id, needToDelete);
        setStation({ ...station, needs: station.needs.filter(n => n.item !== needToDelete) });
        showToast(t('station.delete_need_success'), 'success');
      } catch (error) {
        showToast(t('station.delete_need_error'), 'error');
      }
    }
  };

  const handleDeleteOffering = async (offeringToDelete: string) => {
    if (!station) return;
    if (window.confirm(`${t('station.delete_offering_confirm')} ${offeringToDelete}?`)) {
      try {
        await deleteOffering(station.id, offeringToDelete);
        setStation({ ...station, offerings: station.offerings.filter(o => o !== offeringToDelete) });
        showToast(t('station.delete_offering_success'), 'success');
      } catch (error) {
        showToast(t('station.delete_offering_error'), 'error');
      }
    }
  };

  const handleVerify = async (positive: boolean) => {
    if (!station) return;
    if (!user) {
        showToast(t('auth.login_vote_alert'), 'error', {
            label: t('btn.signin'),
            onClick: login
        });
        return;
    }
    await verifyStation(station.id, positive, user.id, user.role);
    const allStations = await getStations();
    const updated = allStations.find(s => s.id === id);
    if (updated) setStation(updated);
    const vote = await getUserVote(user.id, station.id);
    setUserVote(vote || undefined); 
  };

  const handleToggleFav = async () => {
    if (!station) return;
    if (!user) {
      showToast(t('auth.login_fav_alert'), 'error', {
        label: t('btn.signin'),
        onClick: login,
      });
      return;
    }
    await toggleFavorite(user.id, station.id);
    setIsFav(!isFav);
  };

  const handleShare = async () => {
      if (!station) return;
      const url = window.location.href;
      if (navigator.share) {
          try {
              await navigator.share({ title: station.name, text: `${station.name} - ${station.address}`, url: url });
              return;
          } catch (err) {}
      }
      try {
          await navigator.clipboard.writeText(url);
          showToast(t('share.success'), 'success');
      } catch (err) {
          window.prompt(t('btn.share') + ":", url);
      }
  };

  const handleNavigate = () => {
      if (!station) return;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`;
      window.open(url, '_blank');
  };

  const totalVotes = (station.upvotes || 0) + (station.downvotes || 0);
  const trustPercent = totalVotes > 0 ? Math.round((station.upvotes / totalVotes) * 100) : 0;
  
  let trustColor = 'text-gray-500';
  if (totalVotes > 0) {
      if (trustPercent >= 70) trustColor = 'text-green-600';
      else if (trustPercent >= 40) trustColor = 'text-yellow-600';
      else trustColor = 'text-red-600';
  }

  const getStatusColor = (status: SupplyStatus) => {
    switch (status) {
      case SupplyStatus.AVAILABLE: return 'bg-green-100 text-green-800 border-green-200';
      case SupplyStatus.LOW_STOCK: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case SupplyStatus.EMPTY_CLOSED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white min-h-screen pb-24">
       {/* Sticky Header */}
       <div className="sticky top-0 bg-white z-[100] border-b shadow-sm">
           <div className="flex items-center justify-between p-4">
               <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                   <ArrowLeft size={20} className="text-gray-700" />
               </button>
               <h1 className="text-sm font-bold truncate max-w-[200px]">{station.name}</h1>
               <div className="flex gap-2">
                   {canManage && (
                       <>
                           <button onClick={() => setIsEditModalOpen(true)} className={`p-2 rounded-full transition hover:bg-gray-100 text-gray-600`}>
                               <Edit3 size={20} />
                           </button>
                           <button onClick={handleDeleteStation} className={`p-2 rounded-full transition hover:bg-red-100 text-red-600`}>
                               <Trash2 size={20} />
                           </button>
                       </>
                   )}
                   <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                       <Share2 size={20} />
                   </button>
                   <button onClick={handleToggleFav} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                       <Heart size={20} fill={isFav ? "#EF4444" : "none"} className={isFav ? "text-red-500" : ""} />
                   </button>
               </div>
           </div>
       </div>

       {isEditModalOpen && station && (
        <EditStationModal 
          isOpen={isEditModalOpen}
          station={station}
          onClose={() => setIsEditModalOpen(false)}
          onStationUpdated={handleStationUpdate}
        />
       )}

       {/* Hero Info */}
       <div className="p-5">
           <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(station.status)}`}>
                  {t(`status.${station.status.toLowerCase()}`)}
              </span>
           </div>

           <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{station.name}</h1>
           
           <div className="flex items-start text-gray-600 mb-4 text-sm">
               <MapPin size={16} className="mt-1 mr-2 shrink-0" />
               <div>
                   <p className="leading-relaxed">{station.address}</p>
                   {distance && <p className="text-primary font-bold mt-0.5">({distance} km away)</p>}
               </div>
           </div>

           {/* Needs Section */}
           {station.needs && station.needs.length > 0 && (
           <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-4">
               <h3 className="font-bold text-red-800 flex items-center mb-3">
                   <AlertTriangle size={18} className="mr-2" />
                   {t('card.needs')}
               </h3>
               {station.needs && station.needs.length > 0 ? (
                   <ul className="space-y-2">
                       {station.needs.map((n, idx) => (
                           <li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-red-100 shadow-sm text-sm">
                               <span className="font-medium text-gray-800">{n.item}</span>
                               <div className="flex items-center">
                                   {n.quantity && (
                                       <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full mr-2">
                                           {n.quantity} {n.unit}
                                       </span>
                                   )}
                                   {canManage && (
                                       <button onClick={() => handleDeleteNeed(n.item)} className="p-1 hover:bg-red-100 rounded-full text-red-500 transition">
                                           <Trash2 size={16} />
                                       </button>
                                   )}
                               </div>
                           </li>
                       ))}
                   </ul>
               ) : (
                   <p className="text-sm text-gray-500 italic">{t('card.no_needs')}</p>
               )}
           </div>
           )}

           {/* Offerings Section */}
           <div className="bg-green-50 rounded-xl p-4 border border-green-100 mb-6">
               <h3 className="font-bold text-green-800 flex items-center mb-3">
                   <BadgeCheck size={18} className="mr-2" />
                   {t('card.offerings')}
               </h3>
               {station.offerings && station.offerings.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                       {station.offerings.map((off, idx) => (
                           <span key={idx} className="bg-white text-green-800 px-3 py-1.5 rounded-lg border border-green-200 text-sm font-medium shadow-sm flex items-center">
                               {off}
                               {canManage && (
                                   <button onClick={() => handleDeleteOffering(off)} className="ml-2 p-1 hover:bg-red-100 rounded-full text-red-500 transition">
                                       <Trash2 size={14} />
                                   </button>
                               )}
                           </span>
                       ))}
                   </div>
               ) : (
                   <p className="text-sm text-gray-500 italic">{t('card.no_info')}</p>
               )}
           </div>

           {/* User Management */}
           {/* {station && <ManageStationUsers station={station} />} */}

           {/* Contact & Verification Info */}
           <div className="space-y-4">
               {station.contactLink && (
                   <a href={station.contactLink} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition">
                       <MessageCircle size={20} className="mr-3" />
                       <div className="flex-1">
                           <div className="font-bold text-sm">Official Channel / Group</div>
                           <div className="text-xs opacity-75 truncate">{station.contactLink}</div>
                       </div>
                   </a>
               )}

               <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('verify.source')}</span>
                        <div className="flex items-center text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            Updated {new Date(station.lastUpdated).toLocaleDateString()} {new Date(station.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>

                    {/* Voting */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleVerify(true)} 
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${userVote === 'UP' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-gray-200 hover:bg-green-50'}`}
                            >
                                <ThumbsUp size={18} />
                                <span className="font-bold">{station.upvotes}</span>
                            </button>
                            <button 
                                onClick={() => handleVerify(false)} 
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${userVote === 'DOWN' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-200 hover:bg-red-50'}`}
                            >
                                <ThumbsDown size={18} />
                                <span className="font-bold">{station.downvotes}</span>
                            </button>
                        </div>
                        <div className="text-right">
                             <div className={`text-2xl font-black ${trustColor}`}>{trustPercent}%</div>
                             <div className="text-[10px] text-gray-400 uppercase font-bold">Trust Score</div>
                        </div>
                    </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={handleNavigate} className="flex flex-col items-center justify-center p-3 bg-primary text-white rounded-xl shadow-md hover:bg-teal-800 transition">
                        <Navigation size={24} className="mb-1" />
                        <span className="text-xs font-bold">{t('btn.navigate')}</span>
                    </button>
                    {station.contactNumber ? (
                        <a href={`tel:${station.contactNumber}`} className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 text-gray-800 rounded-xl shadow-sm hover:bg-gray-50 transition">
                            <Phone size={24} className="mb-1" />
                            <span className="text-xs font-bold">{t('btn.message')}</span>
                        </a>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl">
                            <Phone size={24} className="mb-1" />
                            <span className="text-xs font-bold">No Phone</span>
                        </div>
                    )}
                </div>
           </div>
       </div>
    </div>
  );
};
