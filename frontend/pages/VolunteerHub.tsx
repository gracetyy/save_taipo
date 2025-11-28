import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole, Station, DeliveryTask } from '../types';
import { getStations, getDeliveryTasks, claimTask, completeTask } from '../services/dataService';
import { MapPin, Box, ArrowRight, CheckCircle, Clock, AlertTriangle, UserPlus, HandHeart, List, Map as MapIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { StationExplorer } from '../components/StationExplorer';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const VolunteerHub: React.FC<Props> = ({ userLocation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TASKS' | 'STATIONS'>('TASKS');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [tasksData, stationsData] = await Promise.all([
                getDeliveryTasks(),
                getStations()
            ]);
            setTasks(tasksData);
            setStations(stationsData);
        } catch (error) {
            console.error("Failed to load volunteer data", error);
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const getStationName = (id: string) => stations.find(s => s.id === id)?.name || 'Unknown Station';

  const handleClaim = async (taskId: string) => {
      try {
          await claimTask(taskId);
          showToast("Task claimed!", "success");
          // Refresh tasks
          const updatedTasks = await getDeliveryTasks();
          setTasks(updatedTasks);
      } catch (error) {
          showToast("Failed to claim task", "error");
      }
  };

  const handleComplete = async (taskId: string) => {
      if (!window.confirm("Confirm delivery completion?")) return;
      try {
          await completeTask(taskId);
          showToast("Task completed!", "success");
          // Refresh tasks
          const updatedTasks = await getDeliveryTasks();
          setTasks(updatedTasks);
      } catch (error) {
          showToast("Failed to complete task", "error");
      }
  };

  const availableTasks = tasks.filter(t => t.status === 'PENDING');
  const myTasks = tasks.filter(t => t.driverId === user?.id && t.status === 'IN_PROGRESS');

  return (
    <div className="pb-24">
        {/* Tab Switcher */}
        <div className="bg-white sticky top-0 z-[1000] border-b border-gray-100 flex shadow-sm">
            <button 
                onClick={() => setActiveTab('TASKS')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center ${activeTab === 'TASKS' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            >
                <Box size={16} className="mr-2"/> Tasks
                {(availableTasks.length + myTasks.length) > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                        {availableTasks.length + myTasks.length}
                    </span>
                )}
            </button>
            <button 
                onClick={() => setActiveTab('STATIONS')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center ${activeTab === 'STATIONS' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            >
                <MapPin size={16} className="mr-2"/> Stations
            </button>
        </div>

        {activeTab === 'STATIONS' ? (
            <StationExplorer userLocation={userLocation} mode="VOLUNTEER" />
        ) : (
            <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('nav.volunteer')}</h1>
                        <p className="text-gray-500 text-sm">Help your community</p>
                    </div>
                    <div className="bg-orange-100 p-2 rounded-full">
                        <HandHeart size={24} className="text-orange-600" />
                    </div>
                </div>

                {/* Stats / Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-orange-500">{availableTasks.length}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold mt-1">Open Tasks</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-blue-500">{myTasks.length}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold mt-1">My Tasks</span>
                    </div>
                </div>

                {/* My Active Tasks */}
                {myTasks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="font-bold text-lg mb-3 flex items-center">
                            <CheckCircle size={20} className="mr-2 text-blue-600"/> 
                            Your Active Tasks
                        </h2>
                        <div className="space-y-3">
                            {myTasks.map(task => (
                                <div key={task.id} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-xs font-bold text-blue-600 mb-1">IN PROGRESS</div>
                                            <h3 className="font-bold text-gray-800">{task.items.join(', ')}</h3>
                                        </div>
                                        <button 
                                            onClick={() => handleComplete(task.id)}
                                            className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-200"
                                        >
                                            Complete
                                        </button>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 mt-2">
                                        <span className="truncate max-w-[40%]">{getStationName(task.fromStationId)}</span>
                                        <ArrowRight size={14} className="mx-2 text-gray-400"/>
                                        <span className="truncate max-w-[40%]">{getStationName(task.toStationId)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Tasks */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-lg flex items-center">
                            <Box size={20} className="mr-2 text-orange-600"/> 
                            Available Tasks
                        </h2>
                    </div>
                    
                    {availableTasks.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No tasks currently available.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availableTasks.map(task => (
                                <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-800">{task.items.join(', ')}</h3>
                                                <p className="text-xs text-gray-400 mt-1">Posted {new Date(task.createdAt).toLocaleDateString()}</p>
                                            </div>
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-600 my-3 bg-gray-50 p-2 rounded-lg">
                                        <div className="flex-1 truncate text-center">
                                            <div className="text-xs text-gray-400 uppercase">From</div>
                                            <div className="font-medium truncate">{getStationName(task.fromStationId)}</div>
                                        </div>
                                        <ArrowRight size={16} className="mx-2 text-gray-300"/>
                                        <div className="flex-1 truncate text-center">
                                            <div className="text-xs text-gray-400 uppercase">To</div>
                                            <div className="font-medium truncate">{getStationName(task.toStationId)}</div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleClaim(task.id)}
                                        className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg hover:bg-orange-600 transition shadow-sm"
                                    >
                                        Volunteer for this Task
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
