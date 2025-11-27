
import React, { useState, useEffect } from 'react';
import { Station, StationType, DeliveryTask, UserRole } from '../../types';
import { getStations, getTasks } from '../services/dataService';
import { StationCard } from '../components/StationCard';
import { TaskCard } from '../components/TaskCard';
import { Package, Truck, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { AddStationModal } from '../components/AddStationModal';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const LogisticsView: React.FC<Props> = ({ userLocation }) => {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'HUBS' | 'TASKS'>('HUBS');
  const [stations, setStations] = useState<Station[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);

  const refreshData = async () => {
      !isLoading && setIsLoading(true);
      const [stationsData, tasksData] = await Promise.all([getStations(), getTasks()]);
      setStations(stationsData);
      setTasks(tasksData);
      setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthLoading) {
        refreshData();
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }
  }, [isAuthLoading]);

  const canManage = user && [UserRole.ADMIN, UserRole.STATION_MANAGER].includes(user.role);

  const collectionPoints = stations.filter(s => s.type === StationType.COLLECTION_POINT);

  if (isLoading || isAuthLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-400">{t('common.loading')}</p>
        </div>
    );
  }

  return (
    <div className="pb-24">
       {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-[1000] p-4 border-b border-gray-200">
         <h2 className="text-lg font-bold text-gray-900 mb-3">{t('log.title')}</h2>
         
         <div className="flex p-1 bg-gray-200 rounded-lg">
             <button 
                onClick={() => setActiveTab('HUBS')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center transition ${activeTab === 'HUBS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 <Package size={14} className="mr-1.5"/> {t('log.tab_hubs')}
             </button>
             <button 
                onClick={() => setActiveTab('TASKS')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center transition ${activeTab === 'TASKS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 <Truck size={14} className="mr-1.5"/> {t('log.tab_tasks')} ({tasks.filter(t => t.status !== 'COMPLETED').length})
             </button>
         </div>
      </div>

      <div className="p-4">
          {activeTab === 'HUBS' ? (
              <div>
                  {collectionPoints.length > 0 ? (
                      collectionPoints.map(s => (
                          <StationCard 
                              key={s.id} 
                              station={s} 
                              userLocation={userLocation} 
                              onUpdate={refreshData}
                              mode="VOLUNTEER"
                          />
                      ))
                  ) : (
                      <div className="text-center py-10 text-gray-400">
                          <p>{t('log.no_hubs')}</p>
                      </div>
                  )}
              </div>
          ) : (
              <div>
                  {tasks.length > 0 ? (
                      tasks
                        .filter(task => task.items && task.items.length > 0)
                        .sort((a,b) => b.createdAt - a.createdAt)
                        .map(task => {
                          const fromStation = stations.find(s => s.id === task.fromStationId);
                          const toStation = stations.find(s => s.id === task.toStationId);
                          return (
                            <TaskCard 
                                key={task.id}
                                task={task}
                                fromStation={fromStation}
                                toStation={toStation}
                                stations={stations}
                                onUpdate={refreshData}
                            />
                          );
                      })
                  ) : (
                      <div className="text-center py-10 text-gray-400">
                          <p>{t('log.no_tasks')}</p>
                      </div>
                  )}
              </div>
          )}
      </div>

      {canManage && (
        <button
          onClick={() => setIsAddStationModalOpen(true)}
          className="fixed bottom-24 right-4 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-dark transition"
          aria-label="Add Item"
        >
          <Plus size={24} />
        </button>
      )}

        <AddStationModal 
            isOpen={isAddStationModalOpen}
            onClose={() => setIsAddStationModalOpen(false)}
            onStationAdded={refreshData}
        />

    </div>
  );
};

