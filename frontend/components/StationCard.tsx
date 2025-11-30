import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station, UserRole, SupplyStatus, CrowdStatus, OFFERING_CATEGORIES } from '../types';
import { toggleFavorite, isFavorite, voteStation } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Navigation, ThumbsUp, ThumbsDown, Edit2, Heart, Users, ShieldCheck, Share2, Phone, ExternalLink, CheckCircle, AlertTriangle, Zap, HelpCircle, Pause } from 'lucide-react';
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
    const { user, effectiveRole } = useAuth();
    const { t, language } = useLanguage();
    const getTypeLabel = (typeKey: any) => {
        try {
            const key = `type.${String(typeKey).toLowerCase()}`;
            return t(key as any);
        } catch (err) { return String(typeKey); }
    }
    const getTypeColorClass = (typeKey: string) => {
        switch (typeKey) {
            case 'SUPPLY': return 'bg-teal-50 text-teal-700 border-teal-100';
            case 'SHELTER': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'PET_SHELTER': return 'bg-pink-50 text-pink-700 border-pink-100';
            case 'FOOD_DISTRIBUTION': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'MEDICAL': return 'bg-red-50 text-red-700 border-red-100';
            case 'COLLECTION_POINT': return 'bg-violet-50 text-violet-700 border-violet-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    }
    const getOrganizerColorClass = (org: string) => {
        switch (org) {
            case 'GOV': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'NGO': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'COMMUNITY': return 'bg-gray-50 text-gray-700 border-gray-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    }
    const { showToast } = useToast();
    
    const [isFav, setIsFav] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [distance, setDistance] = useState<string | null>(null);
    // Removed debug prints in prod/dev per request

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
    const normalizedNeeds = (station.needs || []) as any[];
    const showOfferings = effectiveRole === UserRole.RESIDENT;
    const showNeeds = !showOfferings; // converse

    const mapEffectiveStatusForRole = (status: SupplyStatus) => {
        if (effectiveRole === UserRole.RESIDENT && (status === SupplyStatus.GOV_CONTROL || status === SupplyStatus.PAUSED)) return SupplyStatus.NO_DATA;
        return status;
    }

    const isStationNoData = effectiveRole === UserRole.RESIDENT && mapEffectiveStatusForRole(station.status) === SupplyStatus.NO_DATA;

    const getItemStatusIcon = (status: SupplyStatus) => {
        const s = mapEffectiveStatusForRole(status);
        switch (s) {
            case SupplyStatus.AVAILABLE: return <CheckCircle size={12} className="text-green-600" />;
            case SupplyStatus.LOW_STOCK: return <AlertTriangle size={12} className="text-yellow-600" />;
            case SupplyStatus.URGENT: return <Zap size={12} className="text-red-600" />;
            case SupplyStatus.NO_DATA: return <HelpCircle size={12} className="text-gray-500" />;
            case SupplyStatus.GOV_CONTROL: return <ShieldCheck size={12} className="text-blue-600" />;
            case SupplyStatus.PAUSED: return <Pause size={12} className="text-purple-600" />;
            default: return <HelpCircle size={12} className="text-gray-500" />;
        }
    }

    const getItemStatusColorClass = (status: SupplyStatus) => {
        const s = mapEffectiveStatusForRole(status);
        switch (s) {
            case SupplyStatus.AVAILABLE: return 'bg-green-50 text-green-800 border-green-100';
            case SupplyStatus.LOW_STOCK: return 'bg-yellow-50 text-yellow-800 border-yellow-100';
            case SupplyStatus.URGENT: return 'bg-red-50 text-red-800 border-red-100';
            case SupplyStatus.NO_DATA: return 'bg-gray-50 text-gray-800 border-gray-100';
            case SupplyStatus.GOV_CONTROL: return 'bg-blue-50 text-blue-800 border-blue-100';
            case SupplyStatus.PAUSED: return 'bg-purple-50 text-purple-800 border-purple-100';
            default: return 'bg-gray-50 text-gray-800 border-gray-100';
        }
    }

    return (
        <>
        <div 
            onClick={() => navigate(`/station/${station.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 hover:shadow-md transition cursor-pointer relative"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex-1">{(language === 'en' && station.name_en && station.name_en.trim().length > 0) ? station.name_en : station.name}</h3>
                        <div className="flex gap-2 items-center flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getTypeColorClass(station.type)}`}>{getTypeLabel(station.type)}</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getOrganizerColorClass(station.organizer)}`}>{t(`organizer.${station.organizer.toLowerCase()}` as any)}</span>
                            {/* Move status badge into header row so it aligns with type and organizer */}
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap flex items-center ${getItemStatusColorClass(station.status)}`}>
                                <span className="inline-block mr-1 align-middle">{getItemStatusIcon(station.status)}</span>
                                <span className="align-middle">{t(getStatusTranslationKey(mapEffectiveStatusForRole(station.status)))}</span>
                            </span>
                        </div>
                    </div>
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

              <div className="flex flex-wrap gap-2 mb-3 items-center">
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
            
            {/* Offerings/Needs chips - show offerings for residents, needs for others */}
            {isStationNoData ? (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getItemStatusColorClass(SupplyStatus.NO_DATA)}`}>
                            <span className="inline-block mr-1 align-middle">{getItemStatusIcon(SupplyStatus.NO_DATA)}</span>
                            <span className="align-middle">{t('status.no_data')}</span>
                        </span>
                    </div>
                </div>
            ) : showOfferings && normalizedOfferings && normalizedOfferings.length > 0 && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {normalizedOfferings.filter(o => o && o.item && o.status).map((offering, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded text-xs font-medium border ${getItemStatusColorClass(offering.status)}`}>
                                <span className="inline-block mr-1 align-middle">{getItemStatusIcon(offering.status)}</span>
                                <span className="align-middle">{t(offering.item as any) || offering.item}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {showNeeds && !isStationNoData && normalizedNeeds && normalizedNeeds.length > 0 && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {normalizedNeeds.filter(o => o && o.item && o.status).map((need, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded text-xs font-medium border ${getItemStatusColorClass(need.status as SupplyStatus)}`}>
                                <span className="inline-block mr-1 align-middle">{getItemStatusIcon(need.status as SupplyStatus)}</span>
                                <span className="align-middle">{t(need.item as any) || need.item}</span>
                            </span>
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
                        className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition ${isFav ? 'text-red-500' : 'text-gray-400'}`}
                        aria-label={t('btn.favorite' as any)}
                     >
                         <Heart size={16} className={isFav ? "fill-current" : ""}/>
                     </button>
                            {station.contactNumber && station.contactNumber.trim() && (
                                <a
                                    href={`tel:${station.contactNumber.replace(/\s+/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-green-500 transition"
                                    aria-label={t('btn.call')}
                                >
                                    <Phone size={16}/>
                                </a>
                            )}
                            {station.contactLink && station.contactLink.trim() && (
                                <a
                                    href={station.contactLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
                                    aria-label={t('btn.contact')}
                                    title={t('btn.contact')}
                                >
                                    <ExternalLink size={16} />
                                </a>
                            )}
                            <a
                                href={station.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 h-10 flex items-center justify-center rounded-md bg-primary text-white hover:bg-teal-700 transition shadow-md"
                                aria-label={t('btn.directions')}
                                title={t('btn.directions')}
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
