import React, { useState, useEffect, useRef } from 'react';
import { Station, SupplyStatus, NeedItem } from '../../types';
import { updateStation, addOfferingItem, addOfferingCategory } from '../services/dataService';
import { CategorySelector } from './CategorySelector';
import { useToast } from '../contexts/ToastContext';
import { X, Plus, Minus, ChevronDown, ChevronUp, Crosshair, Map, Loader2, ShieldCheck, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  station: Station;
  onClose: () => void;
  onStationUpdated: (updatedStation: Station) => void;
}

const EditStationDetails: React.FC<Props> = ({ station, onClose, onStationUpdated }) => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [editStatus, setEditStatus] = useState<SupplyStatus>(station.status);
  const [editNeeds, setEditNeeds] = useState<NeedItem[]>(station.needs ? [...station.needs] : []);
  const [editOfferings, setEditOfferings] = useState<string[]>(station.offerings ? [...station.offerings] : []);
  const [editName, setEditName] = useState(station.name);
  const [editAddress, setEditAddress] = useState(station.address);
  const [editLat, setEditLat] = useState<number>(station.lat);
  const [editLng, setEditLng] = useState<number>(station.lng);
  const [showNeedsSelector, setShowNeedsSelector] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Map initialization and cleanup
  useEffect(() => {
    if (!showMapPicker || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, { zoomControl: false, tap: false }).setView([editLat, editLng], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);
    const marker = L.marker([editLat, editLng], { draggable: true }).addTo(map);
    mapInstanceRef.current = map;
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setEditLat(pos.lat);
      setEditLng(pos.lng);
    });
    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng);
      setEditLat(e.latlng.lat);
      setEditLng(e.latlng.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMapPicker, editLat, editLng]);
  
  // Update marker when coordinates change
  useEffect(() => {
      if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([editLat, editLng]);
          mapInstanceRef.current.setView([editLat, editLng]);
      }
  }, [editLat, editLng]);

  const handleSave = async () => {
    const updated = { ...station, name: editName, address: editAddress, lat: editLat, lng: editLng, status: editStatus, needs: editNeeds, offerings: editOfferings };
    await updateStation(updated);
    onStationUpdated(updated);
    showToast('Station updated successfully', 'success');
    onClose();
  };

  const getStatusTranslationKey = (status: SupplyStatus) => {
    switch (status) {
      case SupplyStatus.AVAILABLE: return 'status.available';
      case SupplyStatus.LOW_STOCK: return 'status.low_stock';
      case SupplyStatus.EMPTY_CLOSED: return 'status.closed';
      default: return 'status.available';
    }
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
                  
                  // Reverse geocode using Nominatim (free OpenStreetMap service)
                  try {
                      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
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
          // Add new need with undefined quantity
          return [...prev, { item, quantity: undefined, unit: '' }];
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

  // Set need quantity directly from input
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

  // Update need unit
  const updateNeedUnit = (item: string, unit: string) => {
    setEditNeeds(prev => prev.map(n => {
        if (n.item === item) {
            return { ...n, unit: unit };
        }
        return n;
    }));
  };

  return (
    <div className="space-y-4">
       <h3 className="text-gray-900 font-bold mb-3 flex items-center">
           <ShieldCheck size={18} className="mr-2 text-primary"/> Edit Station
       </h3>
       <div className="space-y-4">
           <div>
               <label className="text-gray-500 text-xs font-bold uppercase">Station Name</label>
               <input className="w-full mt-1 p-2 rounded bg-gray-50 text-gray-900 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary" value={editName} onChange={e => setEditName(e.target.value)} />
           </div>
           <div>
               <label className="text-gray-500 text-xs font-bold uppercase">Address & Location</label>
               <input className="w-full mt-1 p-2 rounded bg-gray-50 text-gray-900 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
               
               {/* Location Controls */}
               <div className="flex gap-2 mt-2">
                   <button
                       type="button"
                       onClick={handleUseCurrentLocation}
                       disabled={isLocating}
                       className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                   >
                       {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                       Use Current Location
                   </button>
                   <button
                       type="button"
                       onClick={() => setShowMapPicker(!showMapPicker)}
                       className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold ${showMapPicker ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
                   >
                       <Map size={14} />
                       {showMapPicker ? 'Hide Map' : 'Pick on Map'}
                   </button>
               </div>
               
               {/* Map Picker */}
               {showMapPicker && (
                   <div className="mt-2 rounded overflow-hidden border border-gray-300">
                       <div ref={mapRef} className="w-full h-48" />
                       <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500">
                           <span className="text-gray-900 font-mono">{editLat.toFixed(6)}, {editLng.toFixed(6)}</span>
                           <span className="ml-2">• Drag marker or click to set location</span>
                       </div>
                   </div>
               )}
           </div>
           <div>
               <label className="text-gray-500 text-xs font-bold uppercase">Status</label>
               <div className="flex gap-2 mt-1">
                   {[SupplyStatus.AVAILABLE, SupplyStatus.LOW_STOCK, SupplyStatus.EMPTY_CLOSED].map(s => (
                       <button 
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded border ${editStatus === s ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                       >
                           {t(getStatusTranslationKey(s))}
                       </button>
                   ))}
               </div>
           </div>

           {/* Offerings Selector */}
           <div>
               <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Offerings (Available Items)</label>
               {editOfferings.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mb-3">
                       {editOfferings.map(item => (
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
                   selectedItems={editOfferings}
                   onToggleItem={toggleOffering}
                   itemClass="px-2 py-1 rounded text-xs font-medium transition border bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                   selectedItemClass="bg-green-600 text-white border-green-600"
                   allowAddItem={true}
                   allowAddCategory={true}
                   onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditOfferings(prev => [...prev, item]); }}
                   onAddCategory={(cat) => addOfferingCategory(cat)}
               />
           </div>

           {/* Needs Selector with Quantity */}
           <div>
               <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Needs (What You Need)</label>
               {editNeeds.length > 0 && (
                   <div className="space-y-2 mb-3">
                       {editNeeds.map(need => (
                           <div key={need.item} className="bg-gray-50 rounded p-2 flex items-center justify-between border border-gray-200">
                               <span className="text-gray-900 text-sm font-medium flex-1">{need.item}</span>
                               <div className="flex items-center gap-1">
                                   <button
                                       onClick={() => updateNeedQuantity(need.item, -1)}
                                       className="w-6 h-6 rounded bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
                                   >
                                       <Minus size={14} />
                                   </button>
                                   <input
                                       type="number"
                                       placeholder="Qty"
                                       value={need.quantity || ''}
                                       onChange={e => setNeedQuantity(need.item, e.target.value)}
                                       className="w-12 h-7 rounded bg-white text-gray-900 text-center text-sm border border-gray-300"
                                   />
                                   <button
                                       onClick={() => updateNeedQuantity(need.item, 1)}
                                       className="w-6 h-6 rounded bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300"
                                   >
                                       <Plus size={14} />
                                   </button>
                                   <input
                                       type="text"
                                       placeholder="Unit"
                                       value={need.unit || ''}
                                       onChange={e => updateNeedUnit(need.item, e.target.value)}
                                       className="w-16 h-7 rounded bg-white text-gray-900 text-center text-sm border border-gray-300"
                                   />
                                   <button
                                       onClick={() => toggleNeed(need.item)}
                                       className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center hover:bg-red-600 ml-1"
                                   >
                                       <Minus size={14} />
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
               <button
                   onClick={() => setShowNeedsSelector(!showNeedsSelector)}
                   className="w-full py-2 bg-gray-50 text-gray-700 rounded text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100 border border-gray-300"
               >
                   <Plus size={14} /> Add Needs
                   {showNeedsSelector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
               {showNeedsSelector && (
                   <div className="mt-2 bg-gray-50 rounded p-3 max-h-48 overflow-y-auto border border-gray-200">
                      <CategorySelector
                          selectedItems={editNeeds.map(n => n.item)}
                          onToggleItem={toggleNeed}
                          itemClass="px-2 py-1 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500"
                          selectedItemClass="bg-red-500 text-white"
                          itemsFilter={(item) => !editNeeds.find(n => n.item === item)}
                         allowAddItem={true}
                         allowAddCategory={true}
                         onAddItem={(_cat, item) => { addOfferingItem(_cat, item); setEditNeeds(prev => [...prev, { item, quantity: 1 }]); }}
                         onAddCategory={(cat) => addOfferingCategory(cat)}
                      />
                   </div>
               )}
           </div>

           <div className="flex gap-2 pt-2">
               <button onClick={handleSave} className="flex-1 bg-green-600 text-white font-bold py-2 rounded flex items-center justify-center hover:bg-green-700">
                   <Check size={16} className="mr-1"/> Save Changes
               </button>
               <button onClick={onClose} className="px-4 bg-gray-100 text-gray-700 font-bold py-2 rounded hover:bg-gray-200 border border-gray-300">
                   Cancel
               </button>
           </div>
       </div>
    </div>
  );
};

export default EditStationDetails;
