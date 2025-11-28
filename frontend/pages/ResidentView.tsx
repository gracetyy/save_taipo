
import React from 'react';
import { StationExplorer } from '../components/StationExplorer';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const ResidentView: React.FC<Props> = ({ userLocation }) => {
    return (
        <div className="pb-24">
            <StationExplorer userLocation={userLocation} mode="RESIDENT" />
        </div>
    );
};
