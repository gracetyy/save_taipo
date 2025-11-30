
import React from 'react';
import { StationExplorer } from '../components/StationExplorer';
import ErrorBoundary from '../components/ErrorBoundary';

interface Props {
  userLocation: { lat: number; lng: number } | null;
}

export const ResidentView: React.FC<Props> = ({ userLocation }) => {
    return (
        <div className="pb-24">
            <ErrorBoundary>
                <StationExplorer userLocation={userLocation} mode="RESIDENT" />
            </ErrorBoundary>
        </div>
    );
};
