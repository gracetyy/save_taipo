import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole, Station } from '../types';
import { getStations } from '../services/dataService';
import { MapPin } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { StationExplorer } from '../components/StationExplorer';
import ErrorBoundary from '../components/ErrorBoundary';

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
        <ErrorBoundary>
          <StationExplorer userLocation={userLocation} mode="VOLUNTEER" />
        </ErrorBoundary>
    </div>
  );
};
