
import React, { useState, useEffect, useMemo, useRef } from 'react';
import useResponsiveMapHeight from '../hooks/useResponsiveMapHeight';
import { useNavigate } from 'react-router-dom';
import { Station, StationType, SupplyStatus, UserRole } from '../types';
import { getStations, calculateDistance } from '../services/dataService';
import { StationCard } from '../components/StationCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { Filter, Map as MapIcon, List, Search, Crosshair, PackageOpen, RotateCcw, Car, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

// Declare Leaflet global type to avoid TypeScript errors
declare const L: any;

interface StationExplorerProps {
  userLocation: { lat: number; lng: number } | null;
  mode?: 'RESIDENT' | 'VOLUNTEER' | 'ADMIN';
}

export const StationExplorer: React.FC<StationExplorerProps> = ({ userLocation, mode = 'RESIDENT' }) => {
    const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [activeType, setActiveType] = useState<StationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
    const [itemFilterOpen, setItemFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<SupplyStatus[]>([]);
    const [selectedOrganizers, setSelectedOrganizers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'STATUS' | 'DISTANCE'>('STATUS');
  const [showTraffic, setShowTraffic] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const mapHeight = useResponsiveMapHeight({ headerRef });

  // Update default sort if user has location
  useEffect(() => {
    if (userLocation) {
        setSortBy('DISTANCE');
    }
  }, [userLocation]);

  // Auto-enable traffic for Drivers
  useEffect(() => {
    if (user?.role === UserRole.DRIVER) {
        setShowTraffic(true);
    }
  }, [user]);

  useEffect(() => {
    // Initial load
    refreshData();
    const interval = setInterval(refreshData, 30000); // Poll every 30s
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

  const refreshData = async () => {
    const data = await getStations();
    setStations(data);
    setIsLoading(false);
  };

  const handleReset = () => {
    setSearchQuery('');
    setActiveType('ALL');
    setSelectedItems([]);
    setSortBy(userLocation ? 'DISTANCE' : 'STATUS');
  };

  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      // Type Filter
      if (activeType !== 'ALL' && s.type !== activeType) return false;
      
      // Item Filter (Strict AND logic - station must have at least ONE of the selected items)
      if (selectedItems.length > 0) {
          const hasItem = selectedItems.some(item => s.offerings.some(o => o.item === item));
          if (!hasItem) return false;
      }

    // Search Filter
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesName = s.name.toLowerCase().includes(q);
          const matchesAddress = s.address.toLowerCase().includes(q);
          const matchesOfferings = s.offerings.some(o => o.item.toLowerCase().includes(q));
          // Residents are looking for supplies, so we check offerings
          return matchesName || matchesAddress || matchesOfferings;
      }
      
      // Status Filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(s.status)) return false;

      // Organizer Filter
      if (selectedOrganizers.length > 0 && !selectedOrganizers.includes(s.organizer)) return false;
      return true;
    }).sort((a, b) => {
        if (sortBy === 'DISTANCE' && userLocation) {
            const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
            const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
            return distA - distB;
        }
        
        // Sort by status availability (Green first)
        if (a.status === SupplyStatus.AVAILABLE && b.status !== SupplyStatus.AVAILABLE) return -1;
        if (b.status === SupplyStatus.AVAILABLE && a.status !== SupplyStatus.AVAILABLE) return 1;
        return 0;
    });
    }, [stations, activeType, searchQuery, selectedItems, sortBy, userLocation, selectedStatuses, selectedOrganizers]);

  // Leaflet Map Initialization and Update
  useEffect(() => {
      if (viewMode === 'MAP' && mapContainerRef.current) {
          // If the map instance exists but is attached to a different (stale) container, remove it
          if (mapInstanceRef.current && mapInstanceRef.current.getContainer() !== mapContainerRef.current) {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
          }

          if (!mapInstanceRef.current) {
              const defaultCenter = userLocation ? [userLocation.lat, userLocation.lng] : [22.4423, 114.1655]; // Tai Po default
              const map = L.map(mapContainerRef.current, {
                  zoomControl: false,
                  tap: false // fix for some mobile interactions
              }).setView(defaultCenter, 15);

              // Use CartoDB Voyager for a cleaner, Google Maps-like look
              L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                  subdomains: 'abcd',
                  maxZoom: 20
              }).addTo(map);

              // Add Zoom Listener for Labels
              map.on('zoomend', () => {
                  if (mapContainerRef.current) {
                      // Only show labels when highly zoomed in (>= 17) to prevent stacking
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

          // Initial Label Check
          if (map.getZoom() >= 17 && mapContainerRef.current) {
              mapContainerRef.current.classList.add('show-labels');
          }

          // Handle Traffic Layer
          if (showTraffic) {
              if (!trafficLayerRef.current) {
                  // Using Google Traffic overlay tiles (Hybrid)
                  // lyrs=h,traffic includes traffic lines AND road labels overlay
                  trafficLayerRef.current = L.tileLayer('https://mt0.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}', {
                      maxZoom: 20
                  });
              }
              trafficLayerRef.current.addTo(map);
          } else {
              if (trafficLayerRef.current) {
                  map.removeLayer(trafficLayerRef.current);
              }
          }

          // Clear existing markers
          markersRef.current.forEach(m => map.removeLayer(m));
          markersRef.current = [];

          // Add User Location Marker (Blue Dot with Pulse)
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

          // Add Station Markers (Dot style - CircleMarker)
          filteredStations.forEach(s => {
              let color = '#9AA0A6'; // Gray default
              let statusText = t('status.unverified');
              
              if (s.status === SupplyStatus.AVAILABLE) { color = '#34A853'; statusText = t('status.available'); } 
              else if (s.status === SupplyStatus.LOW_STOCK) { color = '#FBBC04'; statusText = t('status.low_stock'); }

              // Use CircleMarker to ensure a pure vector circle (dot) without pin shape
              const marker = L.circleMarker([s.lat, s.lng], {
                  radius: 8, // Fixed pixel radius (16px diameter)
                  fillColor: color,
                  fillOpacity: 1,
                  color: 'white',
                  weight: 2,
                  opacity: 1
              }).addTo(map);
              
              const displayName = (language === 'en' && s.name_en && s.name_en.trim().length > 0) ? s.name_en : s.name;
              // Bind Tooltip (Label) - only visible when zoomed in
              marker.bindTooltip(displayName, {
                  permanent: true,
                  direction: 'bottom',
                  className: 'station-label-tooltip',
                  offset: [0, 8]
              });

              // Enhanced popup content with JS Click Handler for Sandbox compatibility
              const popupContent = `
                <div onclick="window.stationNavigate('${s.id}')" role="button" tabindex="0" style="cursor: pointer; text-decoration: none; color: inherit; display: block; font-family: sans-serif;">
                    <div style="background: ${color}; height: 4px; width: 100%; border-top-left-radius: 8px; border-top-right-radius: 8px;"></div>
                        <div style="padding: 12px;">
                        <div style="display:inline-block; font-size: 10px; font-weight: bold; color: ${color}; border: 1px solid ${color}; padding: 1px 6px; border-radius: 12px; margin-bottom: 6px;">${statusText}</div>
                        <div style="margin-top:6px; display:inline-block; margin-right:6px; font-size: 11px; background:${getTypeColorHex(s.type).bg}; padding:6px 10px; border-radius:8px; border:1px solid ${getTypeColorHex(s.type).border}; color:${getTypeColorHex(s.type).text};">${getTypeLabel(s.type)}</div>
                        <div style="display:inline-block; font-size: 11px; background:${getOrganizerColorHex(s.organizer).bg}; padding:6px 10px; border-radius:8px; border:1px solid ${getOrganizerColorHex(s.organizer).border}; color:${getOrganizerColorHex(s.organizer).text};">${t(`organizer.${s.organizer.toLowerCase()}` as any)}</div>
                        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #202124;">${displayName}</h3>
                        <p style="margin: 0; font-size: 12px; color: #5F6368; line-height: 1.4;">${s.address}</p>
                        <div style="margin-top: 8px; font-size: 11px; color: #5F6368;">
                            <strong>${t('card.offerings')}:</strong> ${ (s.offerings && s.offerings.length) ? s.offerings.map(o => o.item).join(', ') : t('card.no_info') }
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
                            <a href="${s.mapLink || ('https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng)}" target="_blank" rel="noreferrer" onclick="event.stopPropagation();" style="display:inline-flex; padding:8px 10px; background:#0f766e; color:#fff; font-weight:bold; border-radius:8px; text-decoration:none;" title="${t('btn.directions')}" aria-label="${t('btn.directions')}">
                                <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                                    <title>${t('btn.directions')}</title>
                                    <path d="M12 2L2 12l4 1 1 4 9-10 1-1-5-3z" />
                                </svg>
                            </a>
                            ${s.contactLink ? `<a href="${s.contactLink}" target="_blank" rel="noreferrer" onclick="event.stopPropagation();" style="display:inline-flex; padding:8px 10px; background:#fff; color:#374151; font-weight:bold; border-radius:8px; text-decoration:none; border:1px solid #eee; margin-right:8px;" title="${t('btn.contact')}" aria-label="${t('btn.contact')}"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d=\"M10 2L14 6M6 10L10 14M10 14l4 4\"/></svg></a>` : ''}
                            <div style="text-align:center; color: #0F766E; font-weight: bold; font-size: 11px;">${t('res.view_details')} &rarr;</div>
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
  }, [viewMode, filteredStations, userLocation, t, showTraffic, navigate]);

  const handleCenterMap = () => {
      if (userLocation && mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 17);
      }
  };

  const getTypeLabel = (typeKey: string) => {
    const key = `type.${typeKey.toLowerCase()}`;
    return t(key as any);
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
    const getStatusColorClass = (status: SupplyStatus) => {
        switch (status) {
            case SupplyStatus.AVAILABLE: return 'bg-green-50 text-green-700 border-green-100';
            case SupplyStatus.LOW_STOCK: return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case SupplyStatus.URGENT: return 'bg-red-50 text-red-700 border-red-100';
            case SupplyStatus.NO_DATA: return 'bg-gray-50 text-gray-700 border-gray-100';
            case SupplyStatus.GOV_CONTROL: return 'bg-blue-50 text-blue-700 border-blue-100';
            case SupplyStatus.PAUSED: return 'bg-purple-50 text-purple-700 border-purple-100';
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
    // get hex colors for inline badges used in popups
    const getTypeColorHex = (typeKey: string) => {
        switch (typeKey) {
            case 'SUPPLY': return { bg: '#ecfdf5', text: '#065f46', border: '#bbf7d0' };
            case 'SHELTER': return { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' };
            case 'PET_SHELTER': return { bg: '#fff1f2', text: '#be123c', border: '#fecaca' };
            case 'FOOD_DISTRIBUTION': return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
            case 'MEDICAL': return { bg: '#fff1f2', text: '#b91c1c', border: '#fecaca' };
            case 'COLLECTION_POINT': return { bg: '#f5f3ff', text: '#6d28d9', border: '#ede9fe' };
            default: return { bg: '#f8fafc', text: '#374151', border: '#e5e7eb' };
        }
    }
    const getOrganizerColorHex = (org: string) => {
        switch (org) {
            case 'GOV': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
            case 'NGO': return { bg: '#faf5ff', text: '#6b21a8', border: '#f3e8ff' };
            case 'COMMUNITY': return { bg: '#f8fafc', text: '#374151', border: '#e5e7eb' };
            default: return { bg: '#f8fafc', text: '#374151', border: '#e5e7eb' };
        }
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

    // Ensure the map invalidates size when height changes
    useEffect(() => {
        if (mapInstanceRef.current) {
            setTimeout(() => {
                mapInstanceRef.current.invalidateSize();
            }, 150);
        }
    }, [mapHeight]);

    return (
        <div>
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
        /* HIDE TOOLTIP TRIANGLE POINTER */
        .station-label-tooltip::before {
            display: none !important;
            border: none !important;
        }
        .show-labels .station-label-tooltip {
          opacity: 1;
        }
      `}</style>

    {/* Sticky Filter Header */}
    <div ref={headerRef} className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-[1000] p-4 pb-2 border-b border-gray-100">
         <div className="flex space-x-2 mb-3">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('res.search_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                 />
             </div>
             <button 
                onClick={() => setViewMode(viewMode === 'LIST' ? 'MAP' : 'LIST')}
                className="bg-white p-2.5 rounded-full border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
             >
                 {viewMode === 'LIST' ? <MapIcon size={20} /> : <List size={20} />}
             </button>
         </div>

         {/* Chip Filters (Horizontal) */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 items-center">
             <button onClick={() => setActiveType('ALL')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition ${activeType === 'ALL' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border'}`}>
                 {t('type.all')}
             </button>
             {Object.values(StationType).map(t => (
                 <button 
                    key={t} 
                    onClick={() => setActiveType(t)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition ${activeType === t ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border'}`}>
                     {getTypeLabel(t)}
                 </button>
             ))}
         </div>
         
         {/* Secondary Filters Bar */}
         <div className="flex justify-between items-center mt-1">
             <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                 {/* Item/Offering Filter */}
                      <button 
                          onClick={() => setItemFilterOpen(true)}
                          className={`whitespace-nowrap text-xs font-bold flex items-center px-2 py-1 rounded-md transition ${selectedItems.length > 0 ? 'bg-secondary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                     <PackageOpen size={14} className="mr-1.5"/> 
                     {selectedItems.length > 0 ? `${t('btn.filter_items')} (${selectedItems.length})` : t('btn.filter_items')}
                 </button>

                 {/* Feature Toggle */}
                 <button onClick={() => setFilterOpen(!filterOpen)} className="whitespace-nowrap text-xs font-bold text-gray-600 flex items-center bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200">
                     <Filter size={12} className="mr-1"/> {t('res.more_filters')} {filterOpen ? '▲' : '▼'}
                 </button>

                 {/* Sorting */}
                      <button 
                          onClick={() => setSortBy(sortBy === 'STATUS' ? 'DISTANCE' : 'STATUS')}
                          className="whitespace-nowrap text-xs font-bold text-gray-600 flex items-center bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200"
                    disabled={!userLocation && sortBy === 'STATUS'}
                 >
                     <ArrowUpDown size={14} className="mr-1.5"/>
                     {sortBy === 'STATUS' ? t('sort.status') : t('sort.distance')}
                 </button>
             </div>
             
             {/* Reset Button */}
                 <button 
                     onClick={handleReset} 
                     className="ml-2 px-2 py-1 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 bg-gray-100 rounded-md transition flex items-center whitespace-nowrap" 
                title={t('btn.reset')}
             >
                 <RotateCcw size={14} className="mr-1.5" />
                 {t('btn.reset')}
             </button>
         </div>

         {filterOpen && (
             <div className="mt-2 bg-white p-2 rounded-lg border shadow-sm flex gap-2 flex-wrap animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-2 mr-4">
                     <div className="text-xs font-medium mr-2">{t('sort.status')}</div>
                     {Object.values(SupplyStatus).map((s) => (
                         <button
                            key={s}
                            onClick={() => setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                            className={`px-2 py-0.5 text-xs rounded border ${selectedStatuses.includes(s) ? getStatusColorClass(s as SupplyStatus) : 'bg-gray-100 text-gray-700'}`}
                         >{t(getStatusTranslationKey(s as SupplyStatus))}</button>
                     ))}
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="text-xs font-medium mr-2">{t('filter.organizer')}</div>
                     {['GOV', 'NGO', 'COMMUNITY'].map(org => (
                         <button
                             key={org}
                             onClick={() => setSelectedOrganizers(prev => prev.includes(org) ? prev.filter(x => x !== org) : [...prev, org])}
                            className={`px-2 py-0.5 text-xs rounded border ${selectedOrganizers.includes(org) ? getOrganizerColorClass(org) : 'bg-gray-100 text-gray-700'}`}
                         >{t(`organizer.${org.toLowerCase()}` as any)}</button>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {/* Main Content */}
      <div className="px-4 mt-2">
        {viewMode === 'MAP' ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0" style={{ height: mapHeight ?? undefined }}>
                <div ref={mapContainerRef} className="w-full h-full bg-gray-100" style={{ height: '100%' }} />
                
                {/* Traffic Toggle Button */}
                <button 
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={`absolute bottom-20 right-4 p-3 rounded-full shadow-lg z-[400] transition-colors active:scale-95 ${showTraffic ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                    title={t('btn.traffic')}
                >
                    <Car size={24} />
                </button>

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
            <div>
                {/* Active Filter Tags */}
                {selectedItems.length > 0 && (
                     <div className="flex flex-wrap gap-1 mb-3">
                         {selectedItems.map(item => (
                             <span key={item} className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-bold">
                                 {t(item as any)}
                             </span>
                         ))}
                     </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-gray-400">{t('common.loading')}</p>
                    </div>
                ) : (
                    <>
                        {filteredStations.map(s => (
                            <StationCard 
                                key={s.id} 
                                station={s} 
                                userLocation={userLocation} 
                                onUpdate={refreshData}
                                mode={mode === 'VOLUNTEER' ? 'MANAGER' : mode as 'RESIDENT' | 'MANAGER' | 'ADMIN'}
                            />
                        ))}
                        {filteredStations.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>{t('res.no_stations_list')}</p>
                                {selectedItems.length > 0 && (
                                    <button onClick={handleReset} className="text-primary text-sm font-bold mt-2 hover:underline">
                                        {t('btn.clear')}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        )}
      </div>

      {itemFilterOpen && (
          <CategoryFilter 
            title={t('res.filter_title')}
            selectedItems={selectedItems}
            onChange={setSelectedItems}
            onClose={() => setItemFilterOpen(false)}
          />
      )}
    </div>
  );
};
