// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

import React, { useState, useEffect, useRef } from 'react';
import { Station, StationType, SupplyStatus, CrowdStatus, NeedItem } from '../types';
import { addStation, addOfferingItem, addOfferingCategory } from '../services/dataService';
import { X, MapPin, Crosshair, Loader2, Plus, Minus, ChevronDown, ChevronUp, Map, Check } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// NOTE: items are grouped by OFFERING_CATEGORIES; no flat ALL_ITEMS required

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStationAdded: () => void;
}

const TYPE_KEYS: Record<string, string> = {
    'SUPPLY': 'type.supply',
    'REST': 'type.rest',
    'PET_SHELTER': 'type.pet_shelter',
    'FOOD_DISTRIBUTION': 'type.food_distribution',
    'MEDICAL': 'type.medical',
    'COLLECTION_POINT': 'type.collection_point'
};

const CROWD_KEYS: Record<string, string> = {
    'LOW': 'crowd.low',
    'MEDIUM': 'crowd.medium',
    'HIGH': 'crowd.high',
    'FULL': 'crowd.full'
};

export const AddStationModal: React.FC<Props> = ({ isOpen, onClose, onStationAdded }) => {
  if (!isOpen) return null;
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isLocating, setIsLocating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  // Offerings/Needs expansion now handled by CategorySelector
  const [showNeedsSelector, setShowNeedsSelector] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(22.4468);
  const [lng, setLng] = useState<number>(114.1686);
  const [type, setType] = useState<StationType>('SUPPLY' as StationType);
  const [status, setStatus] = useState<SupplyStatus>(SupplyStatus.AVAILABLE);
  const [crowdStatus, setCrowdStatus] = useState<CrowdStatus>('LOW' as CrowdStatus);
  const [contact, setContact] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [offerings, setOfferings] = useState<string[]>([]);
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!showMapPicker || !mapRef.current || mapInstanceRef.current) return;
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded yet');
      return;
    }
    
    const map = L.map(mapRef.current, { zoomControl: false, tap: false }).setView([lat, lng], 16);
    
    // Use CartoDB Voyager tiles to match the ResidentView theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    
    mapInstanceRef.current = map;
    markerRef.current = marker;
    
    // Handle marker drag
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      setLat(position.lat);
      setLng(position.lng);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=zh-TW,en`
        );
        const data = await response.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    });
    
    // Handle map click
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', async (e: any) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      setLat(clickLat);
      setLng(clickLng);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}&accept-language=zh-TW,en`
        );
        const data = await response.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    });
    
    setTimeout(() => map.invalidateSize(), 100);
    
    return () => {
      if (!showMapPicker) {
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker]);

  // Update marker when coordinates change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng]);
    }
  }, [lat, lng]);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            mapInstanceRef.current.setView([newLat, newLng], 16);
          }
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=zh-TW,en`
            );
            const data = await response.json();
            if (data.display_name) {
              setAddress(data.display_name);
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

  // Toggle offering selection
  const toggleOffering = (item: string) => {
    setOfferings(prev => 
      prev.includes(item) 
        ? prev.filter(o => o !== item)
        : [...prev, item]
    );
  };

  // Toggle need item
  const toggleNeed = (item: string) => {
    setNeeds(prev => {
      const existing = prev.find(n => n.item === item);
      if (existing) {
        return prev.filter(n => n.item !== item);
      }
      return [...prev, { item, quantity: undefined }];
    });
  };

  // Update need quantity
  const updateNeedQuantity = (item: string, delta: number) => {
    setNeeds(prev => prev.map(n => {
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
    setNeeds(prev => prev.map(n => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showToast('Please enter a station name', 'error');
      return;
    }
    
    if (!address.trim()) {
      showToast('Please enter an address or use location picker', 'error');
      return;
    }

    const newStation: Station = {
      id: 'new_' + Date.now(),
      name: name.trim(),
      address: address.trim(),
      lat,
      lng,
      type,
      organizer: 'COMMUNITY',
      status,
      crowdStatus,
      needs,
      offerings,
      features: { hasPets: false, isWheelchairAccessible: false, hasBabyCare: false, hasCharging: false },
      lastUpdated: Date.now(),
      upvotes: 0,
      downvotes: 0,
      contactNumber: contact,
      contactLink,
      verification: sourceUrl ? {
        isVerified: false,
        verifiedBy: 'COMMUNITY',
        sourceUrl,
        verifiedAt: Date.now()
      } : undefined,
      ownerId: user?.id
    };

    addStation(newStation);
    onStationAdded();
    onClose();
  };

  const getStatusTranslationKey = (s: SupplyStatus): string => {
    switch (s) {
      case SupplyStatus.AVAILABLE: return 'status.available';
      case SupplyStatus.LOW_STOCK: return 'status.low_stock';
      case SupplyStatus.EMPTY_CLOSED: return 'status.closed';
      default: return 'status.available';
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h3 className="text-lg font-bold">{t('add.title')}</h3>
          <button onClick={onClose}><X size={24} className="text-gray-500"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Station Name */}
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase">{t('add.name')}</label>
            <input 
              required 
              className="w-full mt-1 p-2.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary" 
              placeholder={t('add.placeholder_name')} 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          {/* Address & Location */}
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase">{t('add.address')}</label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16}/>
              <input 
                required 
                className="w-full p-2.5 pl-9 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary" 
                placeholder={t('add.placeholder_address')} 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
              />
            </div>
            
            {/* Location Controls */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                Use Current Location
              </button>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold ${showMapPicker ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
              >
                <Map size={14} />
                {showMapPicker ? 'Hide Map' : 'Pick on Map'}
              </button>
            </div>
            
            {/* Map Picker */}
            {showMapPicker && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-300">
                <div ref={mapRef} className="w-full h-48" />
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  <span className="text-gray-900 font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                  <span className="ml-2">• Drag marker or click to set location</span>
                </div>
              </div>
            )}
          </div>

          {/* Type & Crowd Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-bold uppercase">{t('add.type')}</label>
              <select 
                className="w-full mt-1 p-2.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300" 
                value={type} 
                onChange={e => setType(e.target.value as StationType)}
              >
                {Object.entries(TYPE_KEYS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-bold uppercase">Crowd</label>
              <select 
                className="w-full mt-1 p-2.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300" 
                value={crowdStatus} 
                onChange={e => setCrowdStatus(e.target.value as CrowdStatus)}
              >
                {Object.entries(CROWD_KEYS).map(([k, v]) => (
                  <option key={k} value={k}>{t(v)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase">Status</label>
            <div className="flex gap-2 mt-1">
              {[SupplyStatus.AVAILABLE, SupplyStatus.LOW_STOCK, SupplyStatus.EMPTY_CLOSED].map(s => (
                <button 
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${status === s ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                >
                  {t(getStatusTranslationKey(s))}
                </button>
              ))}
            </div>
          </div>

          {/* Offerings Selector */}
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Offerings (Available Items)</label>
            {offerings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {offerings.map(item => (
                  <span 
                    key={item}
                    onClick={() => toggleOffering(item)}
                    className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-green-700 flex items-center gap-1"
                  >
                    {item}
                    <X size={12} />
                  </span>
                ))}
              </div>
            )}
            <CategorySelector
              selectedItems={offerings}
              onToggleItem={toggleOffering}
              itemClass="px-2 py-1 rounded text-xs font-medium transition border bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              selectedItemClass="bg-green-600 text-white border-green-600"
              allowAddItem={true}
              allowAddCategory={true}
              onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setOfferings(prev => [...prev, item]); }}
              onAddCategory={(cat) => { addOfferingCategory(cat); }}
            />
          </div>

          {/* Needs Selector with Quantity */}
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Needs (What You Need)</label>
            {needs.length > 0 && (
              <div className="space-y-2 mb-3">
                {needs.map(need => (
                  <div key={need.item} className="bg-gray-50 rounded-lg p-2 flex items-center justify-between border border-gray-200">
                    <span className="text-gray-900 text-sm font-medium flex-1">{need.item}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateNeedQuantity(need.item, -1)}
                        className="w-7 h-7 rounded bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={need.quantity || ''}
                        onChange={e => setNeedQuantity(need.item, e.target.value)}
                        className="w-14 h-7 rounded bg-white text-gray-900 text-center text-sm border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => updateNeedQuantity(need.item, 1)}
                        className="w-7 h-7 rounded bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleNeed(need.item)}
                        className="w-7 h-7 rounded bg-red-500 text-white flex items-center justify-center hover:bg-red-600 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowNeedsSelector(!showNeedsSelector)}
              className="w-full py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 border border-gray-300"
            >
              <Plus size={14} /> Add Needs
              {showNeedsSelector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showNeedsSelector && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-200">
                <CategorySelector
                  selectedItems={needs.map(n => n.item)}
                  onToggleItem={toggleNeed}
                  itemClass="px-2 py-1 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500"
                  selectedItemClass="bg-red-500 text-white"
                  itemsFilter={(item) => !needs.find(n => n.item === item)}
                  allowAddItem={true}
                  allowAddCategory={true}
                  onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setNeeds(prev => [...prev, { item, quantity: undefined }]); }}
                  onAddCategory={(cat) => addOfferingCategory(cat)}
                />
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-bold uppercase">{t('add.contact')}</label>
              <input 
                className="w-full mt-1 p-2.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300" 
                placeholder={t('add.placeholder_contact')} 
                value={contact} 
                onChange={e => setContact(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-bold uppercase">{t('add.contact_link')}</label>
              <input 
                className="w-full mt-1 p-2.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300" 
                placeholder={t('add.placeholder_contact_link')} 
                value={contactLink} 
                onChange={e => setContactLink(e.target.value)} 
              />
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="text-gray-500 text-xs font-bold uppercase">{t('add.source_url')}</label>
            <input 
              className="w-full mt-1 p-2.5 rounded-lg bg-gray-50 text-gray-900 text-sm border border-gray-300" 
              placeholder={t('add.placeholder_source')} 
              value={sourceUrl} 
              onChange={e => setSourceUrl(e.target.value)} 
            />
          </div>
          
          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-md hover:bg-teal-800 transition flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {t('btn.submit')}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 border border-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
