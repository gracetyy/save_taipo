// Leaflet global (loaded via CDN)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

import React, { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, MapPin, Edit3, Check, X, Loader2, Store, Clock, AlertTriangle, BadgeCheck } from 'lucide-react';
import { Station, UserRole, SupplyStatus, NeedItem } from '../../types';
import { getStations, updateStation, addOfferingItem, addOfferingCategory } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { CategorySelector } from '../../components/CategorySelector';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const MyStationsView: React.FC<Props> = ({ userLocation: _userLocation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [myStations, setMyStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [showNeedsSelector, setShowNeedsSelector] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  // Edit States
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState<number>(0);
  const [editLng, setEditLng] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<SupplyStatus>(SupplyStatus.AVAILABLE);
  const [editNeeds, setEditNeeds] = useState<NeedItem[]>([]);
  const [editOfferings, setEditOfferings] = useState<string[]>([]);
  
  useEffect(() => {
    loadMyStations();
  }, [user]);

  const loadMyStations = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    const allStations = await getStations();
    const owned = allStations.filter(s => 
      s.ownerId === user.id || 
      (user.role === UserRole.STATION_MANAGER && user.managedStationIds?.includes(s.id)) ||
      user.role === UserRole.ADMIN
    );
    setMyStations(owned);
    setIsLoading(false);
  };

  const startEditing = (station: Station) => {
    setEditingStation(station);
    setEditName(station.name);
    setEditAddress(station.address);
    setEditLat(station.lat);
    setEditLng(station.lng);
    setEditStatus(station.status);
    setEditNeeds(station.needs ? [...station.needs] : []);
    setEditOfferings(station.offerings ? [...station.offerings] : []);
    setShowMapPicker(false);
    setShowNeedsSelector(false);
    // Reset CategorySelector internal state (no need to clear parent state)
  };

  const cancelEditing = () => {
    setEditingStation(null);
    mapInstanceRef.current = null;
    markerRef.current = null;
  };

  const handleSave = async () => {
    if (!editingStation) return;

    const updated = {
      ...editingStation,
      name: editName,
      address: editAddress,
      lat: editLat,
      lng: editLng,
      status: editStatus,
      needs: editNeeds,
      offerings: editOfferings,
    };

    try {
      await updateStation(updated);
      showToast('Station updated successfully', 'success');
      setEditingStation(null);
      mapInstanceRef.current = null;
      markerRef.current = null;
      loadMyStations();
    } catch (error: any) {
      if (error.response?.status === 409) {
        showToast('Conflict: This station was updated by someone else. Please refresh and try again.', 'error');
      } else {
        showToast('Failed to update station.', 'error');
      }
    }
  };

  // Toggle offering selection
  const toggleOffering = (item: string) => {
    setEditOfferings(prev => 
      prev.includes(item) 
        ? prev.filter(o => o !== item)
        : [...prev, item]
    );
  };

  // Toggle need item
  const toggleNeed = (item: string) => {
    setEditNeeds(prev => {
      const existing = prev.find(n => n.item === item);
      if (existing) {
        return prev.filter(n => n.item !== item);
      }
      return [...prev, { item, quantity: undefined }];
    });
  };

  // Update need quantity
  const updateNeedQuantity = (item: string, delta: number) => {
    setEditNeeds(prev => prev.map(n => {
      if (n.item === item) {
        const currentQty = n.quantity || 0;
        let newQty: number | undefined = currentQty + delta;
        if (newQty <= 0) {
            newQty = undefined; // Set to undefined if 0 or less
        }
        return { ...n, quantity: newQty };
      }
      return n;
    }));
  };

  // Set need quantity directly
  const setNeedQuantity = (item: string, value: string) => {
    setEditNeeds(prev => prev.map(n => {
      if (n.item === item) {
        if (value === '') {
            return { ...n, quantity: undefined };
        }
        const numValue = parseInt(value);
        const newQty = !isNaN(numValue) && numValue > 0 ? numValue : undefined;
        return { ...n, quantity: newQty };
      }
      return n;
    }));
  };

  // Use current location
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setEditLat(lat);
          setEditLng(lng);
          
          // Update marker position if map exists
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], 16);
          }
          
          try {
            // Use Nominatim (OpenStreetMap) for reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-TW,en`
            );
            const data = await response.json();
            if (data.display_name) {
              setEditAddress(data.display_name);
            }
          } catch (err) {
            console.error('Geocoding error:', err);
          }
          
          setIsLocating(false);
          showToast('Location updated', 'success');
        },
        (err) => {
          setIsLocating(false);
          showToast('Unable to get location: ' + err.message, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      showToast('Geolocation is not supported', 'error');
    }
  };

  // Initialize Leaflet map picker
  useEffect(() => {
    if (!showMapPicker || !mapRef.current || mapInstanceRef.current) return;
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded yet');
      return;
    }
    
    const initialLat = editLat || 22.4468;
    const initialLng = editLng || 114.1686;
    
    const map = L.map(mapRef.current, { zoomControl: false, tap: false }).setView([initialLat, initialLng], 16);
    
    // Use CartoDB Voyager tiles to match the ResidentView theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    
    mapInstanceRef.current = map;
    markerRef.current = marker;
    
    // Handle marker drag
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      setEditLat(position.lat);
      setEditLng(position.lng);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=zh-TW,en`
        );
        const data = await response.json();
        if (data.display_name) {
          setEditAddress(data.display_name);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    });
    
    // Handle map click
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setEditLat(lat);
      setEditLng(lng);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-TW,en`
        );
        const data = await response.json();
        if (data.display_name) {
          setEditAddress(data.display_name);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    });
    
    // Force map to recalculate size after render
    setTimeout(() => map.invalidateSize(), 100);
    
    return () => {
      if (!showMapPicker) {
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker]);

  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([editLat, editLng]);
      mapInstanceRef.current.setView([editLat, editLng]);
    }
  }, [editLat, editLng]);

  const getStatusColor = (status: SupplyStatus) => {
    switch (status) {
      case SupplyStatus.AVAILABLE: return 'bg-green-100 text-green-800 border-green-200';
      case SupplyStatus.LOW_STOCK: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case SupplyStatus.EMPTY_CLOSED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100';
    }
  };

  const getStatusTranslationKey = (status: SupplyStatus) => {
    switch (status) {
      case SupplyStatus.AVAILABLE: return 'status.available';
      case SupplyStatus.LOW_STOCK: return 'status.low_stock';
      case SupplyStatus.EMPTY_CLOSED: return 'status.closed';
      default: return 'status.available';
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <Store size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('station.login_to_view')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  // Edit Screen (Light Mode)
  if (editingStation) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white z-[100] border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button onClick={cancelEditing} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-sm font-bold">{t('station.edit_station')}</h1>
            <button onClick={handleSave} className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-teal-700">
              {t('btn.save')}
            </button>
          </div>
        </div>

        {/* Edit Form - Light Mode */}
        <div className="p-4 space-y-4">
          {/* Station Name */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-gray-500 text-xs font-bold uppercase block mb-2">{t('station.name')}</label>
            <input 
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
            />
          </div>

          {/* Address & Location */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-gray-500 text-xs font-bold uppercase block mb-2">{t('station.address_location')}</label>
            <input 
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary mb-3" 
              value={editAddress} 
              onChange={e => setEditAddress(e.target.value)} 
            />
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
              >
                {isLocating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                {t('station.use_current_location')}
              </button>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border ${showMapPicker ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <MapPin size={14} />
                {showMapPicker ? t('station.hide_map') : t('station.pick_on_map')}
              </button>
            </div>
            
            {showMapPicker && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <div ref={mapRef} className="w-full h-48" />
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  <span className="text-gray-700 font-mono">{editLat.toFixed(6)}, {editLng.toFixed(6)}</span>
                  <span className="ml-2">{t('station.map_helper_text')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-gray-500 text-xs font-bold uppercase block mb-2">{t('station.status')}</label>
            <div className="flex gap-2">
              {[SupplyStatus.AVAILABLE, SupplyStatus.LOW_STOCK, SupplyStatus.EMPTY_CLOSED].map(s => (
                <button 
                  key={s}
                  onClick={() => setEditStatus(s)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition ${
                    editStatus === s 
                      ? s === SupplyStatus.AVAILABLE ? 'bg-green-500 text-white border-green-500'
                        : s === SupplyStatus.LOW_STOCK ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t(getStatusTranslationKey(s))}
                </button>
              ))}
            </div>
          </div>

          {/* Offerings */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-gray-500 text-xs font-bold uppercase block mb-2">
              <BadgeCheck size={14} className="inline mr-1 text-green-500" />
              {t('station.offerings_label')}
            </label>
            {editOfferings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {editOfferings.map(item => (
                  <span 
                    key={item}
                    onClick={() => toggleOffering(item)}
                    className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-green-600 flex items-center gap-1"
                  >
                    {item}
                    <X size={12} />
                  </span>
                ))}
              </div>
            )}
            <CategorySelector
              selectedItems={editOfferings}
              onToggleItem={toggleOffering}
              itemClass="px-2.5 py-1 rounded-full text-xs font-medium transition border bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600"
              selectedItemClass="bg-green-500 text-white border-green-500"
              allowAddItem={true}
              allowAddCategory={true}
              onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditOfferings(prev => [...prev, item]); }}
              onAddCategory={(cat) => addOfferingCategory(cat)}
            />
          </div>

          {/* Needs */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="text-gray-500 text-xs font-bold uppercase block mb-2">
              <AlertTriangle size={14} className="inline mr-1 text-red-500" />
              {t('station.needs_label')}
            </label>
            {editNeeds.length > 0 && (
              <div className="space-y-2 mb-3">
                {editNeeds.map(need => (
                  <div key={need.item} className="bg-red-50 rounded-lg p-3 flex items-center justify-between border border-red-100">
                    <span className="text-gray-800 text-sm font-medium flex-1">{need.item}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateNeedQuantity(need.item, -1)}
                        className="w-8 h-8 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:bg-gray-100 border border-gray-200"
                      >
                        <X size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={need.quantity || ''}
                        onChange={e => setNeedQuantity(need.item, e.target.value)}
                        className="w-14 h-8 rounded-lg bg-white text-gray-800 text-center text-sm border border-gray-200"
                      />
                      <button
                        onClick={() => updateNeedQuantity(need.item, 1)}
                        className="w-8 h-8 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:bg-gray-100 border border-gray-200"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => toggleNeed(need.item)}
                        className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowNeedsSelector(!showNeedsSelector)}
              className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 border border-gray-200"
            >
              <Plus size={14} /> {t('station.add_needs')}
              {showNeedsSelector ? <X size={14} /> : <Plus size={14} />}
            </button>
            {showNeedsSelector && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-200">
                <CategorySelector
                  selectedItems={editNeeds.map(n => n.item)}
                  onToggleItem={toggleNeed}
                  itemClass="px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  selectedItemClass="bg-red-500 text-white"
                  itemsFilter={(item) => !editNeeds.find(n => n.item === item)}
                  allowAddItem={true}
                  allowAddCategory={true}
                  onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditNeeds(prev => [...prev, { item, quantity: undefined }]); }}
                  onAddCategory={(cat) => addOfferingCategory(cat)}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleSave} 
              className="flex-1 bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center hover:bg-teal-700 shadow-lg"
            >
              <Check size={18} className="mr-2"/> {t('btn.save_changes')}
            </button>
            <button 
              onClick={cancelEditing} 
              className="px-6 bg-white text-gray-600 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
            >
              {t('btn.cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Station List
  return (
    <div className="pb-24">
      <div className="bg-white p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Store size={22} className="text-primary" />
          {t('me.my_stations')}
        </h2>
        <p className="text-gray-500 text-sm mt-1">{t('station.manage_desc')}</p>
      </div>

      {myStations.length > 0 ? (
        <div className="p-4 space-y-3">
          {myStations.map(station => (
            <div 
              key={station.id} 
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
              onClick={() => startEditing(station)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 flex-1 pr-2">{station.name}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(station.status)}`}>
                  {t(getStatusTranslationKey(station.status))}
                </span>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <MapPin size={14} className="mr-1.5 shrink-0" />
                <span className="truncate">{station.address}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-400">
                  <Clock size={12} className="mr-1" />
                  Updated {new Date(station.lastUpdated).toLocaleDateString()}
                </div>
                <button className="flex items-center gap-1 text-primary text-sm font-bold hover:underline">
                  <Edit3 size={14} />
                  {t('btn.edit')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Store size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">{t('station.no_owned_stations')}</p>
          <p className="text-gray-400 text-sm">{t('station.create_station_prompt')}</p>
        </div>
      )}
    </div>
  );
};
