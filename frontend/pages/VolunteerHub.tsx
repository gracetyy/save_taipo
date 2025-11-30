import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole, Station } from '../types';
import { getStations } from '../services/dataService';
import { MapPin } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { StationExplorer } from '../components/StationExplorer';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const VolunteerHub: React.FC<Props> = ({ userLocation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
        const fetchData = async () => {
            try {
                const stationsData = await getStations();
                setStations(stationsData);
            } catch (error) {
                console.error(t('volunteer.data_load_error'), error);
                showToast(t('volunteer.data_load_error'), "error");
            } finally {
                setLoading(false);
            }
        };
    fetchData();
  }, []);

  const getStationName = (id: string) => stations.find(s => s.id === id)?.name || t('volunteer.unknown_station');


    // Tasks are not displayed in this view per updated UI requirements

  return (
    <div className="pb-24">
        {/* Header: only the Station view is shown for volunteers */}
        <div className="bg-white sticky top-0 z-[1000] border-b border-gray-100 flex shadow-sm">
            <div className="flex-1 py-3 text-sm font-bold flex items-center justify-center text-gray-500">
                <MapPin size={16} className="mr-2"/> {t('volunteer.stations')}
            </div>
        </div>

        <StationExplorer userLocation={userLocation} mode="VOLUNTEER" />
    </div>
  );
};
