// Leaflet global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStation, verifyStation, getUserVote, isFavorite, toggleFavorite, deleteOffering, deleteNeed, addOfferingCategory, addOfferingItem, updateStationDetails } from '../services/dataService';
import { Station, UserRole, SupplyStatus, CrowdStatus, OFFERING_CATEGORIES } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, ArrowLeft, Heart, ThumbsUp, ThumbsDown, ShieldCheck, Clock, Users, Navigation, Share2, Plus, Edit2, CheckCircle, AlertTriangle, Phone, ExternalLink } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { CategorySelector } from '../components/CategorySelector';
import { EditStationModal } from '../components/EditStationModal';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const StationDetailView: React.FC<Props> = ({ userLocation }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
    const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [station, setStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      loadStation(id);
    }
  }, [id, user]);

  const loadStation = async (stationId: string) => {
    try {
      setIsLoading(true);
      const data = await getStation(stationId);
      setStation(data);
      
      if (user) {
        setIsFav(await isFavorite(stationId));
        setUserVote(await getUserVote(stationId, user.id));
      }

      if (userLocation && data) {
         // Simple distance calculation placeholder if service doesn't have it
         // const d = calculateDistance(userLocation.lat, userLocation.lng, data.lat, data.lng);
         // setDistance(d.toFixed(1));
         setDistance(null); // Placeholder
      }

    } catch (error) {
      console.error("Failed to load station", error);
      showToast("Failed to load station details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!station || !mapRef.current) return;
    if (typeof L === 'undefined') return;

    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([station.lat, station.lng], 16);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${
            station.status === SupplyStatus.AVAILABLE ? '#10B981' : 
            station.status === SupplyStatus.LOW_STOCK ? '#F59E0B' : 
            station.status === SupplyStatus.URGENT ? '#EF4444' :
            station.status === SupplyStatus.NO_DATA ? '#6B7280' :
            station.status === SupplyStatus.GOV_CONTROL ? '#3B82F6' :
            '#8B5CF6'
        }; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    L.marker([station.lat, station.lng], { icon }).addTo(map);
    
    mapInstanceRef.current = map;
  }, [station]);


    const handleVote = async (type: 'UP' | 'DOWN') => {
        if (!user) { showToast(t('auth.login_required'), 'error'); return; }
        if (!station) return;
    try {
        // Optimistic update
        const previousVote = userVote;
        setUserVote(type === previousVote ? null : type);
        
        // This logic is simplified; backend handles actual vote counting
        await verifyStation(station.id, true); // This might be misnamed in local service shim, check implementation
        showToast("Thanks for your feedback!", "success");
        loadStation(station.id); // Refresh data
    } catch (error) {
        showToast("Failed to submit vote", "error");
    }
  };

  const handleToggleFavorite = async () => {
      if (!user) { showToast(t('auth.login_required'), 'error'); return; }
      if (!station) return;
      try {
          const newStatus = await toggleFavorite(user.id, station.id);
          setIsFav(newStatus);
          showToast(newStatus ? "Saved to favorites" : "Removed from favorites", "success");
      } catch (error) {
          showToast("Failed to update favorites", "error");
      }
  };
  
  const handleEditComplete = () => {
      setShowEditModal(false);
      if (id) loadStation(id);
  }

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

    const getTypeLabel = (typeKey: any) => {
            try { return t(`type.${String(typeKey).toLowerCase()}` as any) || String(typeKey); } catch (e) { return String(typeKey); }
    }

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!station) return <div className="p-8 text-center text-gray-500">Station not found</div>;

  const isOwner = user && (station.ownerId === user.id || station.managers?.includes(user.email));
  const canEdit = user && (user.role === UserRole.ADMIN || isOwner);

    const manpowerItems = OFFERING_CATEGORIES['cat.manpower'] || [];
    const normalizeOfferings = (offerings: any[]) => {
        if (!offerings) return [] as any[];
        return offerings.map(o => typeof o === 'string' ? { item: o, status: SupplyStatus.AVAILABLE } : o);
    };
    const normalizedOfferings = normalizeOfferings(station.offerings as any[]);
    const filteredOfferings = user?.role === 'RESIDENT' ? normalizedOfferings?.filter(offering => !manpowerItems.includes(offering.item)) : normalizedOfferings;

  return (
    <div className="bg-white min-h-screen pb-20 relative">
      {/* Header Image / Map Placeholder */}
      <div className="h-64 bg-gray-100 relative">
         <div ref={mapRef} className="h-full w-full z-0" />
         <button 
            onClick={() => navigate(-1)} 
            className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
         >
             <ArrowLeft size={20} className="text-gray-700"/>
         </button>
         <div className="absolute top-4 right-4 z-10 flex space-x-2">
            {canEdit && (
                <button 
                    onClick={() => setShowEditModal(true)}
                    className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition text-primary"
                >
                    <Edit2 size={20}/>
                </button>
            )}
             <button 
                onClick={handleToggleFavorite}
                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
            >
                <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : "text-gray-700"}/>
            </button>
            <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition">
                <Share2 size={20} className="text-gray-700"/>
            </button>
         </div>
      </div>

      <div className="bg-white -mt-6 rounded-t-3xl relative z-10 px-6 py-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {/* Title & Status */}
          <div className="mb-6">
                  <div className="flex justify-between items-start">
                      <div className="flex items-start justify-between gap-2">
                          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex-1">{(language === 'en' && station.name_en && station.name_en.trim().length > 0) ? station.name_en : station.name}</h1>
                          <div className="flex flex-wrap gap-2 items-center">
                              <span className={`px-3 py-1 rounded-md text-xs font-semibold border bg-gray-50 text-gray-700`}>{getTypeLabel(station.type)}</span>
                              <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${station.status === SupplyStatus.AVAILABLE ? 'bg-green-100 text-green-800 border-green-200' : station.status === SupplyStatus.LOW_STOCK ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : station.status === SupplyStatus.URGENT ? 'bg-red-100 text-red-800 border-red-200' : station.status === SupplyStatus.NO_DATA ? 'bg-gray-100 text-gray-800 border-gray-200' : station.status === SupplyStatus.GOV_CONTROL ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200' }`}>{t(getStatusTranslationKey(station.status))}</span>
                              <span className="px-3 py-1 rounded-md text-xs font-semibold border bg-gray-50 text-gray-700">{t(`organizer.${station.organizer.toLowerCase()}` as any)}</span>
                          </div>
                      </div>
                  {station.verification?.isVerified && (
                      <ShieldCheck size={24} className="text-blue-500" />
                  )}
              </div>
              <p className="text-gray-500 text-sm mb-3 flex items-center">
                  <MapPin size={16} className="mr-1"/> {station.address}
                  {distance && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">{distance} km</span>}
              </p>
              
              <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
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
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${
                            station.crowdStatus === CrowdStatus.LOW ? 'bg-green-50 text-green-700 border-green-100' :
                            station.crowdStatus === CrowdStatus.MEDIUM ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-orange-50 text-orange-700 border-orange-100'
                       }`}>
                           <Users size={12} className="mr-1"/> {station.crowdStatus} CROWD
                       </span>
                  )}
              </div>
          </div>

          {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                              <div className="flex gap-2">
                                                <a 
                                                    href={station.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center bg-primary text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition"
                                aria-label={t('btn.directions')}
                              >
                                  <Navigation size={18} />
                              </a>
                                {station.contactNumber && station.contactNumber.trim() && (
                                        <a
                                                href={`tel:${station.contactNumber.replace(/\s+/g, '')}`}
                                                    className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50"
                                                    aria-label={t('btn.call')}
                                        >
                                                    <Phone size={18} />
                                        </a>
                                )}
                                {station.contactLink && station.contactLink.trim() && (
                                    <a
                                        href={station.contactLink}
                                            className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50"
                                            target="_blank"
                                            rel="noreferrer"
                                                    aria-label={t('btn.contact')}
                                                    title={t('btn.contact')}
                                    >
                                            <ExternalLink size={18} />
                                    </a>
                                )}
                            </div>
                            <div className="flex bg-gray-100 rounded-xl p-1">
                  <button 
                    onClick={() => handleVote('UP')}
                    className={`flex-1 flex items-center justify-center rounded-lg transition ${userVote === 'UP' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                  >
                      <ThumbsUp size={18} className="mr-1"/> {station.upvotes || 0}
                  </button>
                  <button 
                    onClick={() => handleVote('DOWN')}
                    className={`flex-1 flex items-center justify-center rounded-lg transition ${userVote === 'DOWN' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                  >
                      <ThumbsDown size={18} className="mr-1"/> {station.downvotes || 0}
                  </button>
              </div>
          </div>

          {/* Needs */}
          {station.needs && station.needs.length > 0 && (
              <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <AlertTriangle size={18} className="mr-2 text-red-500"/>
                      {t('station.needs_label')}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                      {station.needs.map((need, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                              <span className="font-medium text-gray-800">{need.item} - {t(getStatusTranslationKey(need.status))}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Offerings */}
          <div className="mb-8">
               <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <CheckCircle size={18} className="mr-2 text-green-500"/>
                  {t('station.offerings_label')}
               </h3>
               {filteredOfferings && filteredOfferings.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                       {filteredOfferings.map((offering, idx) => (
                           <span key={idx} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                               offering.status === SupplyStatus.AVAILABLE ? 'bg-green-50 text-green-800 border-green-100' :
                               offering.status === SupplyStatus.LOW_STOCK ? 'bg-yellow-50 text-yellow-800 border-yellow-100' :
                               'bg-gray-50 text-gray-800 border-gray-100'
                           }`}>
                               {offering.item} {offering.status === SupplyStatus.AVAILABLE ? '✅' : offering.status === SupplyStatus.LOW_STOCK ? '⚠️' : offering.status === SupplyStatus.URGENT ? '‼️' : ''} - {t(getStatusTranslationKey(offering.status))}
                           </span>
                       ))}
                   </div>
               ) : (
                   <p className="text-gray-400 text-sm italic">No specific offerings listed.</p>
               )}
          </div>
          
          {/* Remarks */}
          {station.remarks && user?.role !== 'RESIDENT' && (
              <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-3">Remarks</h3>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap">{station.remarks}</div>
              </div>
          )}
          
          <div className="text-xs text-gray-400 text-center border-t pt-4">
              <Clock size={12} className="inline mr-1"/>
              Last updated: {new Date(station.lastUpdated).toLocaleString()}
          </div>
      </div>
      
      {showEditModal && station && (
            <EditStationModal 
                station={station} 
                onClose={() => setShowEditModal(false)}
                onComplete={handleEditComplete}
            />
      )}
    </div>
  );
};
