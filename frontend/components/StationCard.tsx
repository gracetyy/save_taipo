import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station, UserRole, SupplyStatus, CrowdStatus } from '../types';
import { toggleFavorite, isFavorite, voteStation } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Navigation, ThumbsUp, ThumbsDown, Edit2, Heart, Users, ShieldCheck, Share2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { EditStationModal } from './EditStationModal'; // Fixed import

interface StationCardProps {
    station: Station;
    userLocation: { lat: number; lng: number } | null;
    onUpdate?: () => void;
    mode?: 'RESIDENT' | 'MANAGER' | 'ADMIN';
}

export const StationCard: React.FC<StationCardProps> = ({ station, userLocation, onUpdate, mode = 'RESIDENT' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    
    const [isFav, setIsFav] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [distance, setDistance] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            checkFavorite();
        }
        if (userLocation) {
            // Placeholder distance calc
            setDistance(null); 
        }
    }, [user, station.id, userLocation]);

    const checkFavorite = async () => {
        if (user) {
             // Awaiting promise properly
             const fav = await isFavorite(station.id);
             setIsFav(fav);
        }
    }

    const handleVote = async (e: React.MouseEvent, type: 'UP' | 'DOWN') => {
        e.stopPropagation();
        if (!user) {
             showToast(t('auth.login_required'), "error");
             return;
        }
        try {
            await voteStation(station.id, user.id, type, user.role);
            showToast(t('vote.success'), "success");
            if (onUpdate) onUpdate();
        } catch (error) {
            showToast(t('vote.error'), "error");
        }
    };

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            showToast(t('auth.login_required'), "error");
            return;
        }
        try {
            const newStatus = await toggleFavorite(user.id, station.id);
            setIsFav(newStatus);
            showToast(newStatus ? t('favorite.added') : t('favorite.removed'), "success");
            if (onUpdate) onUpdate();
        } catch (error) {
             showToast(t('favorite.update_failed'), "error");
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowEditModal(true);
    };

    const canEdit = user && (user.role === UserRole.ADMIN || station.ownerId === user.id || station.managers?.includes(user.email));

    return (
        <>
        <div 
            onClick={() => navigate(`/station/${station.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition cursor-pointer relative"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{station.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-0.5">
                        <MapPin size={14} className="mr-1 shrink-0"/>
                        <span className="truncate">{station.address}</span>
                        {distance && <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{distance} km</span>}
                    {station.remarks && (
                        <div className="mt-1 text-gray-500 text-sm line-clamp-2">
                            {station.remarks}
                        </div>
                    )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                     {station.verification?.isVerified && (
                        <ShieldCheck size={16} className="text-blue-500" />
                     )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        station.status === SupplyStatus.AVAILABLE ? 'bg-green-100 text-green-800 border-green-200' : 
                        station.status === SupplyStatus.LOW_STOCK ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                        'bg-red-100 text-red-800 border-red-200'
                  }`}>
                      {t(`status.${station.status.toLowerCase()}` as any)}
                  </span>
                  {station.crowdStatus && (
                       <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center ${
                            station.crowdStatus === CrowdStatus.LOW ? 'bg-green-50 text-green-700 border-green-100' :
                            station.crowdStatus === CrowdStatus.MEDIUM ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-orange-50 text-orange-700 border-orange-100'
                       }`}>
                           <Users size={10} className="mr-1"/> {station.crowdStatus}
                       </span>
                  )}
            </div>
            
            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                 <div className="flex gap-3">
                     <button 
                        onClick={(e) => handleVote(e, 'UP')}
                        className="flex items-center text-gray-500 hover:text-green-600 text-xs font-bold transition"
                     >
                         <ThumbsUp size={14} className="mr-1"/> {station.upvotes}
                     </button>
                     <button 
                         onClick={(e) => handleVote(e, 'DOWN')}
                         className="flex items-center text-gray-500 hover:text-red-600 text-xs font-bold transition"
                     >
                         <ThumbsDown size={14} className="mr-1"/> {station.downvotes}
                     </button>
                 </div>

                 <div className="flex gap-2">
                     <button 
                        onClick={handleFavorite}
                        className={`p-1.5 rounded-full hover:bg-gray-100 transition ${isFav ? 'text-red-500' : 'text-gray-400'}`}
                     >
                         <Heart size={16} className={isFav ? "fill-current" : ""}/>
                     </button>
                     <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition"
                     >
                         <Navigation size={16}/>
                     </a>
                     {canEdit && (
                         <button 
                            onClick={handleEdit}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary transition"
                         >
                             <Edit2 size={16}/>
                         </button>
                     )}
                 </div>
            </div>
        </div>
        
        {showEditModal && (
            <EditStationModal 
                station={station} 
                onClose={() => setShowEditModal(false)}
                onComplete={() => {
                    setShowEditModal(false);
                    if (onUpdate) onUpdate();
                }}
            />
        )}
        </>
    );
};
