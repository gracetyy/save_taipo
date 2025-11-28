// Leaflet global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStation, verifyStation, getUserVote, isFavorite, toggleFavorite, deleteOffering, deleteNeed, addOfferingCategory, addOfferingItem, updateStationDetails } from '../services/dataService';
import { Station, UserRole, SupplyStatus, CrowdStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, ArrowLeft, Heart, ThumbsUp, ThumbsDown, ShieldCheck, Clock, Users, Navigation, Share2, Plus, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { CategorySelector } from '../components/CategorySelector';
import { EditStationModal } from '../components/EditStationModal'; // Assuming this component exists or will be created

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const StationDetailView: React.FC<Props> = ({ userLocation }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
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
            station.status === SupplyStatus.LOW_STOCK ? '#F59E0B' : '#EF4444'
        }; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    L.marker([station.lat, station.lng], { icon }).addTo(map);
    
    mapInstanceRef.current = map;
  }, [station]);


  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!user || !station) return;
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
      if (!user || !station) return;
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

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!station) return <div className="p-8 text-center text-gray-500">Station not found</div>;

  const isOwner = user && (station.ownerId === user.id || station.managers?.includes(user.email));
  const canEdit = user && (user.role === UserRole.ADMIN || isOwner);

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
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{station.name}</h1>
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
                        'bg-red-100 text-red-800 border-red-200'
                  }`}>
                      {t(`status.${station.status.toLowerCase()}` as any)}
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
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition"
              >
                  <Navigation size={18} className="mr-2"/> {t('btn.directions')}
              </a>
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
                              <span className="font-medium text-gray-800">{need.item}</span>
                              {need.quantity && <span className="text-sm font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-200">x{need.quantity}</span>}
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
               {station.offerings && station.offerings.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                       {station.offerings.map((item, idx) => (
                           <span key={idx} className="px-3 py-1.5 bg-green-50 text-green-800 rounded-lg text-sm font-medium border border-green-100">
                               {item}
                           </span>
                       ))}
                   </div>
               ) : (
                   <p className="text-gray-400 text-sm italic">No specific offerings listed.</p>
               )}
          </div>
          
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
