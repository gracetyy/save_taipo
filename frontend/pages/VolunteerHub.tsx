
import React, { useState, useEffect, useMemo, useRef } from 'react';
import useResponsiveMapHeight from '../hooks/useResponsiveMapHeight';
import { useNavigate } from 'react-router-dom';
import { Station, StationType, SupplyStatus } from '../../types';
import { getStations, calculateDistance } from '../services/dataService';
import { StationCard } from '../components/StationCard';
import { AddStationModal } from '../components/AddStationModal';
import { CategoryFilter } from '../components/CategoryFilter';
import { Search, AlertCircle, Plus, PackageOpen, RotateCcw, ArrowUpDown, Map as MapIcon, List, Crosshair } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

declare const L: any;

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const VolunteerHub: React.FC<Props> = ({ userLocation }) => {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<StationType | 'ALL'>('ALL');
  const [onlyUrgent, setOnlyUrgent] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<'STATUS' | 'DISTANCE'>('STATUS');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  const [itemFilterOpen, setItemFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const mapHeight = useResponsiveMapHeight({ headerRef });
  
  useEffect(() => {
    // Initial load and polling
    const updateData = async () => {
      !isLoading && setIsLoading(true);
      const data = await getStations();
      setStations(data);
      setIsLoading(false);
    };
    updateData();
    const interval = setInterval(updateData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Expose navigation function to global window object for Leaflet popups
  useEffect(() => {
    (window as any).stationNavigate = (id: string) => {
        navigate(`/station/${id}`);
    };

    return () => {
        delete (window as any).stationNavigate;
    };
  }, [navigate]);

  const handleAddClick = () => {
    if (!user) {
        showToast(t('vol.login_alert'), 'error', {
            label: t('btn.signin'),
            onClick: login
        });
        return;
    }
    setShowAddModal(true);
  }

  const handleReset = () => {
      setSearchQuery('');
      setOnlyUrgent(true);
      setActiveType('ALL');
      setSelectedItems([]);
      setSortBy('STATUS');
  };

  const getTypeLabel = (typeKey: string) => {
      const key = `type.${typeKey.toLowerCase()}`;
      return t(key);
  }

  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      if (activeType !== 'ALL' && s.type !== activeType) return false;

      if (onlyUrgent) {
          const hasNeeds = s.needs && s.needs.length > 0;
          const isLowStock = s.status === SupplyStatus.LOW_STOCK;
          if (!hasNeeds && !isLowStock) return false;
      }

      if (selectedItems.length > 0) {
          const hasNeed = s.needs.some(n => selectedItems.includes(n.item));
          if (!hasNeed) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q) ?? false;
        const matchesAddress = s.address?.toLowerCase().includes(q) ?? false;
        const matchesNeeds = s.needs?.some(n => n.item?.toLowerCase().includes(q)) ?? false;
        return matchesName || matchesAddress || matchesNeeds;
      }
      
      return true;
    }).sort((a, b) => {
        if (sortBy === 'DISTANCE' && userLocation) {
            const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
            const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
            return distA - distB;
        }

        if (a.status === SupplyStatus.LOW_STOCK && b.status !== SupplyStatus.LOW_STOCK) return -1;
        if (b.status === SupplyStatus.LOW_STOCK && a.status !== SupplyStatus.LOW_STOCK) return 1;
        return 0;
    });
  }, [stations, activeType, searchQuery, onlyUrgent, selectedItems, sortBy, userLocation]);

  // Leaflet Map Initialization and Update
  useEffect(() => {
    if (viewMode === 'MAP' && mapContainerRef.current) {
        if (mapInstanceRef.current && mapInstanceRef.current.getContainer() !== mapContainerRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        if (!mapInstanceRef.current) {
            const defaultCenter = userLocation ? [userLocation.lat, userLocation.lng] : [22.4423, 114.1655];
            const map = L.map(mapContainerRef.current, {
                zoomControl: false,
                tap: false
            }).setView(defaultCenter, 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            map.on('zoomend', () => {
                if (mapContainerRef.current) {
                    if (map.getZoom() >= 17) {
                        mapContainerRef.current.classList.add('show-labels');
                    } else {
                        mapContainerRef.current.classList.remove('show-labels');
                    }
                }
            });

            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        if (map.getZoom() >= 17 && mapContainerRef.current) {
            mapContainerRef.current.classList.add('show-labels');
        }

        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        if (userLocation) {
           const userHtml = `
              <div style="position: relative; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;">
                  <div style="position: absolute; width: 40px; height: 40px; background-color: rgba(66, 133, 244, 0.4); border-radius: 50%; animation: pulse 2s infinite;"></div>
                  <div style="position: relative; width: 16px; height: 16px; background-color: #4285F4; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
              </div>
           `;
           
           const userIcon = L.divIcon({
               className: 'custom-div-icon',
               html: userHtml,
               iconSize: [24, 24],
               iconAnchor: [12, 12]
           });
           const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
           userMarker.bindPopup(`<b>${t('res.my_location')} (You)</b>`);
           markersRef.current.push(userMarker);
        }

        filteredStations.forEach(s => {
            let color = '#9AA0A6';
            let statusText = t('status.unverified');
            
            if (s.status === SupplyStatus.AVAILABLE) { color = '#34A853'; statusText = t('status.available'); } 
            else if (s.status === SupplyStatus.LOW_STOCK) { color = '#FBBC04'; statusText = t('status.low_stock'); }
            else if (s.status === SupplyStatus.EMPTY_CLOSED) { color = '#EA4335'; statusText = t('status.closed'); }

            const marker = L.circleMarker([s.lat, s.lng], {
                radius: 8,
                fillColor: color,
                fillOpacity: 1,
                color: 'white',
                weight: 2,
                opacity: 1
            }).addTo(map);
            
            marker.bindTooltip(s.name, {
                permanent: true,
                direction: 'bottom',
                className: 'station-label-tooltip',
                offset: [0, 8]
            });

            const popupContent = `
              <div onclick="window.stationNavigate('${s.id}')" role="button" tabindex="0" style="cursor: pointer; text-decoration: none; color: inherit; display: block; font-family: sans-serif;">
                  <div style="background: ${color}; height: 4px; width: 100%; border-top-left-radius: 8px; border-top-right-radius: 8px;"></div>
                  <div style="padding: 12px;">
                      <div style="display:inline-block; font-size: 10px; font-weight: bold; color: ${color}; border: 1px solid ${color}; padding: 1px 6px; border-radius: 12px; margin-bottom: 6px;">${statusText}</div>
                      <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #202124;">${s.name}</h3>
                      <p style="margin: 0; font-size: 12px; color: #5F6368; line-height: 1.4;">${s.address}</p>
                      <div style="margin-top: 8px; font-size: 11px; color: #5F6368;">
                          <strong>${t('card.needs')}:</strong> ${s.needs.map(n => n.item).join(', ') || t('card.no_info')}
                      </div>
                      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee; text-align: center; color: #0F766E; font-weight: bold; font-size: 11px;">
                           ${t('res.view_details')} &rarr;
                      </div>
                  </div>
              </div>
            `;

            marker.bindPopup(popupContent, { minWidth: 200, maxWidth: 240 });
            markersRef.current.push(marker);
        });

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    }
  }, [viewMode, filteredStations, userLocation, t, navigate]);

  const handleCenterMap = () => {
      if (userLocation && mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 17);
      }
  };

  useEffect(() => {
      if (mapInstanceRef.current) {
          setTimeout(() => {
              mapInstanceRef.current.invalidateSize();
          }, 150);
      }
  }, [mapHeight]);

  return (
    <div className="pb-24">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .station-label-tooltip {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          border-radius: 6px !important;
          padding: 1px 6px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          font-size: 10px;
          font-weight: 600;
          color: #374151;
          margin-top: 6px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .station-label-tooltip::before {
            display: none !important;
            border: none !important;
        }
        .show-labels .station-label-tooltip {
          opacity: 1;
        }
      `}</style>
      
      <div ref={headerRef} className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-[1000] p-4 border-b border-gray-200 shadow-sm">
         <div className="flex justify-between items-center mb-3">
             <h2 className="text-lg font-bold text-gray-900">{t('vol.title')}</h2>
             <div className="flex space-x-2">
                <button 
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 bg-gray-100 rounded-full transition flex items-center"
                    title={t('btn.reset')}
                >
                    <RotateCcw size={14} className="mr-1.5" />
                    {t('btn.reset')}
                </button>
                <button 
                    onClick={handleAddClick} 
                    className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center hover:bg-black transition"
                >
                    <Plus size={14} className="mr-1"/> {t('vol.add_station')}
                </button>
             </div>
         </div>
         
         <div className="flex space-x-2 mb-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('vol.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />
            </div>
            <button 
              onClick={() => setViewMode(viewMode === 'LIST' ? 'MAP' : 'LIST')}
              className="bg-white p-2.5 rounded-full border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
            >
                {viewMode === 'LIST' ? <MapIcon size={20} /> : <List size={20} />}
            </button>
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 items-center">
             <button 
                onClick={() => setActiveType('ALL')} 
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition border ${activeType === 'ALL' ? 'bg-secondary text-white border-secondary shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}
             >
                 {t('type.all')}
             </button>
             {Object.values(StationType).map(t => (
                 <button 
                    key={t} 
                    onClick={() => setActiveType(t)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition border ${activeType === t ? 'bg-secondary text-white border-secondary shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}
                 >
                     {getTypeLabel(t)}
                 </button>
             ))}
         </div>
         
         <div className="flex justify-between items-center mt-2">
             <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
                <label className={`whitespace-nowrap flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer select-none ${onlyUrgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                    <input 
                        type="checkbox" 
                        checked={onlyUrgent} 
                        onChange={() => setOnlyUrgent(!onlyUrgent)}
                        className="mr-2 rounded text-red-500 focus:ring-red-500" 
                    />
                    <AlertCircle size={14} className="mr-1"/> {t('vol.urgent_only')}
                </label>

                <button 
                    onClick={() => setItemFilterOpen(true)}
                    className={`whitespace-nowrap text-xs font-bold flex items-center px-3 py-1.5 rounded-lg transition ${selectedItems.length > 0 ? 'bg-secondary text-white shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                 >
                     <PackageOpen size={14} className="mr-1.5"/> 
                     {selectedItems.length > 0 ? `${t('btn.filter_items')} (${selectedItems.length})` : t('btn.filter_items')}
                 </button>
                 
                 <button 
                    onClick={() => setSortBy(sortBy === 'STATUS' ? 'DISTANCE' : 'STATUS')}
                    className="whitespace-nowrap text-xs font-bold text-gray-600 flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    disabled={!userLocation}
                 >
                     <ArrowUpDown size={14} className="mr-1.5"/>
                     {sortBy === 'STATUS' ? t('sort.status') : t('sort.distance')}
                 </button>
             </div>
         </div>
      </div>

      <div className="px-4 mt-2">
        {viewMode === 'MAP' ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0" style={{ height: mapHeight ?? undefined }}>
                <div ref={mapContainerRef} className="w-full h-full bg-gray-100" style={{ height: '100%' }} />
                
                {userLocation && (
                    <button 
                        onClick={handleCenterMap}
                        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg z-[400] text-gray-600 hover:text-primary transition-transform active:scale-95"
                    >
                        <Crosshair size={24} />
                    </button>
                )}
                {filteredStations.length === 0 && (
                     <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-md z-[400] text-sm text-gray-500">
                         {t('res.no_stations_map')}
                     </div>
                )}
            </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 text-sm">
                    {t('vol.search_results')} ({filteredStations.length})
                </h3>
            </div>

            {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {selectedItems.map(item => (
                        <span key={item} className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-bold">
                            {t(item)}
                        </span>
                    ))}
                </div>
            )}
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                    <p className="mt-4 text-gray-400">{t('common.loading')}</p>
                </div>
            ) : filteredStations.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">{t('vol.no_results')}</p>
                    <div className="flex justify-center gap-2">
                        <button onClick={handleReset} className="text-secondary text-sm font-bold hover:underline">
                            {t('vol.reset_filters')}
                        </button>
                    </div>
                </div>
            ) : (
                filteredStations.map(s => (
                    <StationCard 
                        key={s.id} 
                        station={s} 
                        userLocation={userLocation} 
                        onUpdate={async () => setStations(await getStations())}
                        mode="VOLUNTEER"
                    />
                ))
            )}
          </>
        )}
      </div>

      {showAddModal && (
          <AddStationModal 
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onStationAdded={async () => setStations(await getStations())}
          />
      )}

      {itemFilterOpen && (
          <CategoryFilter 
            title={t('vol.mode_needs')}
            selectedItems={selectedItems}
            onChange={setSelectedItems}
            onClose={() => setItemFilterOpen(false)}
          />
      )}
    </div>
  );
};
