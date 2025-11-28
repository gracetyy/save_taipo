// Leaflet global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Box, ArrowRight, CheckCircle, Navigation, Map as MapIcon, Calendar, Clock, Phone, AlertTriangle } from 'lucide-react';
import { TransportTask, UserRole } from '../../types';
import { getTransportTasks, claimTransportTask, completeTransportTask } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const LogisticsView: React.FC<Props> = ({ userLocation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<TransportTask[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'MY_TASKS'>('ALL');
  const [selectedTask, setSelectedTask] = useState<TransportTask | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const data = await getTransportTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to load transport tasks:", error);
    }
  };

  const handleClaim = async (task: TransportTask) => {
    if (!user) return;
    try {
      await claimTransportTask(task.taskId);
      showToast('Task claimed successfully!', 'success');
      loadTasks();
      setSelectedTask(null);
    } catch (error) {
      showToast('Failed to claim task', 'error');
    }
  };

  const handleComplete = async (task: TransportTask) => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you have completed this delivery?');
    if (!confirmed) return;
    
    try {
      await completeTransportTask(task.taskId);
      showToast('Task marked as completed!', 'success');
      loadTasks();
      setSelectedTask(null);
    } catch (error) {
      showToast('Failed to complete task', 'error');
    }
  };

  // Map Initialization for Task Details
  useEffect(() => {
    if (!selectedTask || !mapRef.current) return;
    if (typeof L === 'undefined') return;

    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([selectedTask.pickup.lat, selectedTask.pickup.lng], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // Pickup Marker
    const pickupIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3B82F6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    L.marker([selectedTask.pickup.lat, selectedTask.pickup.lng], { icon: pickupIcon }).addTo(map)
     .bindPopup(`<b>Pickup:</b> ${selectedTask.pickup.locationName}`);

    // Dropoff Marker
    const dropoffIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    L.marker([selectedTask.dropoff.lat, selectedTask.dropoff.lng], { icon: dropoffIcon }).addTo(map)
     .bindPopup(`<b>Dropoff:</b> ${selectedTask.dropoff.locationName}`);

    // Route Line (Straight line for now)
    const latlngs = [
        [selectedTask.pickup.lat, selectedTask.pickup.lng],
        [selectedTask.dropoff.lat, selectedTask.dropoff.lng]
    ];
    L.polyline(latlngs, { color: 'blue', weight: 3, opacity: 0.6, dashArray: '5, 10' }).addTo(map);
    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });

    mapInstanceRef.current = map;
  }, [selectedTask]);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'AVAILABLE') return task.status === 'PENDING';
    if (filter === 'MY_TASKS') return task.assignedDriverId === user?.id && (task.status === 'CLAIMED' || task.status === 'IN_TRANSIT');
    return true;
  });

  if (!user || (user.role !== UserRole.DRIVER && user.role !== UserRole.ADMIN)) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <Truck size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Restricted Access</h2>
            <p className="text-gray-500">Only verified drivers can access the logistics hub.</p>
        </div>
    );
  }

  // Task Detail View
  if (selectedTask) {
    return (
        <div className="bg-white min-h-screen pb-20">
            <div className="sticky top-0 bg-white z-[100] border-b shadow-sm">
                <div className="flex items-center p-4">
                    <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-gray-100 rounded-full mr-2">
                        <ArrowRight size={20} className="transform rotate-180 text-gray-600" />
                    </button>
                    <h1 className="font-bold text-lg">Task Details</h1>
                </div>
            </div>

            <div className="h-48 w-full bg-gray-100 relative z-0">
                <div ref={mapRef} className="h-full w-full" />
            </div>

            <div className="p-5 space-y-6">
                {/* Status Banner */}
                <div className={`p-3 rounded-lg flex items-center justify-between ${
                    selectedTask.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800' :
                    selectedTask.status === 'COMPLETED' ? 'bg-green-50 text-green-800' :
                    'bg-blue-50 text-blue-800'
                }`}>
                    <span className="font-bold text-sm">Status: {selectedTask.status}</span>
                    {selectedTask.urgency === 'HIGH' && (
                        <span className="flex items-center text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                            <AlertTriangle size={12} className="mr-1"/> URGENT
                        </span>
                    )}
                </div>

                {/* Locations */}
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center pt-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                            <div className="w-0.5 h-full bg-gray-200 my-1" />
                            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pickup</p>
                                <h3 className="font-bold text-gray-900">{selectedTask.pickup.locationName}</h3>
                                <p className="text-sm text-gray-600 mt-1">{selectedTask.pickup.address}</p>
                                <div className="mt-2 flex items-center text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                    <Phone size={14} className="mr-2"/>
                                    {selectedTask.pickup.contactName}: {selectedTask.pickup.contactPhone}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Dropoff</p>
                                <h3 className="font-bold text-gray-900">{selectedTask.dropoff.locationName}</h3>
                                <p className="text-sm text-gray-600 mt-1">{selectedTask.dropoff.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center">
                        <Box size={16} className="mr-2"/> Cargo Manifest
                    </h4>
                    <ul className="space-y-2">
                        {selectedTask.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                <span className="text-gray-800">{item.item}</span>
                                <span className="font-medium text-gray-600">{item.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="pt-4">
                    {selectedTask.status === 'PENDING' && (
                        <button 
                            onClick={() => handleClaim(selectedTask)}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center"
                        >
                            <Truck size={18} className="mr-2"/> Accept Task
                        </button>
                    )}
                    {selectedTask.assignedDriverId === user.id && selectedTask.status !== 'COMPLETED' && (
                        <div className="space-y-3">
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${selectedTask.pickup.lat},${selectedTask.pickup.lng}&travelmode=driving`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center"
                            >
                                <Navigation size={18} className="mr-2"/> Navigate to Pickup
                            </a>
                            <button 
                                onClick={() => handleComplete(selectedTask)}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-lg flex items-center justify-center"
                            >
                                <CheckCircle size={18} className="mr-2"/> Mark Delivered
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  // Dashboard View
  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Logistics Hub</h1>
            <p className="text-gray-500 text-sm">Manage transport & deliveries</p>
        </div>
        <div className="bg-blue-100 p-2 rounded-full">
            <Truck size={24} className="text-blue-600" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
            All Tasks
        </button>
        <button 
            onClick={() => setFilter('AVAILABLE')}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filter === 'AVAILABLE' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
            Available
        </button>
        <button 
            onClick={() => setFilter('MY_TASKS')}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filter === 'MY_TASKS' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
            My Tasks
        </button>
      </div>

      {/* Stats */}
      {filter === 'MY_TASKS' && (
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase">Active</p>
                <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.assignedDriverId === user.id && t.status !== 'COMPLETED').length}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase">Completed</p>
                <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.assignedDriverId === user.id && t.status === 'COMPLETED').length}</p>
            </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
            <div className="text-center py-10">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Box size={24} className="text-gray-400"/>
                </div>
                <p className="text-gray-500 font-medium">No tasks found.</p>
                <p className="text-gray-400 text-sm mt-1">Check back later for new requests.</p>
            </div>
        ) : (
            filteredTasks.map(task => (
                <div 
                    key={task.taskId}
                    onClick={() => setSelectedTask(task)}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition duration-150 cursor-pointer relative overflow-hidden"
                >
                    {task.urgency === 'HIGH' && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                            URGENT
                        </div>
                    )}
                    
                    <div className="flex items-start mb-3">
                        <div className={`p-2 rounded-lg mr-3 ${task.vehicleRequirement === 'VAN' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Truck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 line-clamp-1">{task.items.map(i => i.item).join(', ')}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                                <Clock size={12} className="mr-1"/> Posted {new Date(task.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2 mb-3">
                        <div className="flex items-center text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 shrink-0"/>
                            <span className="text-gray-600 truncate">{task.pickup.locationName}</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <div className="w-2 h-2 rounded-full bg-red-400 mr-2 shrink-0"/>
                            <span className="text-gray-600 truncate">{task.dropoff.locationName}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                            task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {task.status}
                        </span>
                        <div className="flex items-center text-xs font-bold text-gray-400">
                            Details <ArrowRight size={14} className="ml-1"/>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
