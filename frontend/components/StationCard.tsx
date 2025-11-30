import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station, UserRole, SupplyStatus, CrowdStatus, OFFERING_CATEGORIES } from '../types';
import { toggleFavorite, isFavorite, voteStation } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Navigation, ThumbsUp, ThumbsDown, Edit2, Heart, Users, ShieldCheck, Share2, Phone } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { EditStationModal } from './EditStationModal';

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
    // Debug logs are not shown in production.
    if (import.meta.env.DEV) {
        console.debug('StationCard (dev):', station.id, 'offerings', station.offerings?.length);
    }

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

    const getStatusTranslationKey = (status: SupplyStatus) => {
        switch (status) {
            case SupplyStatus.AVAILABLE: return 'status.available';
            case SupplyStatus.LOW_STOCK: return 'status.low_stock';
            case SupplyStatus.URGENT: return 'status.urgent';
            case SupplyStatus.NO_DATA: return 'status.no_data';
            case SupplyStatus.GOV_CONTROL: return 'status.gov_control';
            case SupplyStatus.PAUSED: return 'status.paused';
            default: return 'status.available';
        }
    };

    const normalizeOfferings = (offerings: any[]) => {
        if (!offerings) return [] as any[];
        return offerings.map(o => typeof o === 'string' ? { item: o, status: SupplyStatus.AVAILABLE } : o);
    };

    const normalizedOfferings = normalizeOfferings(station.offerings || []);

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
                        </div>
                    {station.remarks && (
                        <div className="mt-1 text-gray-500 text-sm line-clamp-2">
                            {station.remarks}
                        </div>
                    )}
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
                        station.status === SupplyStatus.URGENT ? 'bg-red-100 text-red-800 border-red-200' :
                        station.status === SupplyStatus.NO_DATA ? 'bg-gray-100 text-gray-800 border-gray-200' :
                        station.status === SupplyStatus.GOV_CONTROL ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-purple-100 text-purple-800 border-purple-200'
                  }`}>
                      {t(getStatusTranslationKey(station.status))}
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
            
            {/* Offerings */}
            {normalizedOfferings && normalizedOfferings.length > 0 && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {normalizedOfferings.filter(o => o && o.item && o.status).map((offering, idx) => (
                            mode === 'RESIDENT' ? (
                                <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-800 border border-gray-100">
                                    {offering.item}
                                </span>
                            ) : (
                                <span key={idx} className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                    offering.status === SupplyStatus.AVAILABLE ? 'bg-green-50 text-green-800 border-green-100' : 
                                    offering.status === SupplyStatus.LOW_STOCK ? 'bg-yellow-50 text-yellow-800 border-yellow-100' : 
                                    offering.status === SupplyStatus.URGENT ? 'bg-red-50 text-red-800 border-red-100' :
                                    'bg-gray-50 text-gray-800 border-gray-100'
                                }`}>
                                    {offering.item} {offering.status === SupplyStatus.AVAILABLE ? '✅' : offering.status === SupplyStatus.LOW_STOCK ? '⚠️' : offering.status === SupplyStatus.URGENT ? '‼️' : ''}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            )}
            
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
                            {station.contactNumber && station.contactNumber.trim() && (
                                <a
                                    href={`tel:${station.contactNumber.replace(/\s+/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-green-500 transition"
                                    aria-label={t('btn.call')}
                                >
                                    <Phone size={16}/>
                                </a>
                            )}
                            <a
                                href={station.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
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
