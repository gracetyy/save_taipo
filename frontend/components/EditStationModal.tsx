import React, { useState } from 'react';
import { Station } from '../../types';
import { X } from 'lucide-react';
import EditStationDetails from './EditStationDetails';
import ManageStationUsers from './ManageStationUsers';

interface Props {
  isOpen: boolean;
  station: Station;
  onClose: () => void;
  onStationUpdated: (updatedStation: Station) => void;
}

const EditStationModal: React.FC<Props> = ({ isOpen, station, onClose, onStationUpdated }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'users'>('details');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Manage Station</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="border-b">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Edit Details
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manage Users
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          {activeTab === 'details' && (
<EditStationDetails 
              station={station} 
              onClose={onClose} 
              onStationUpdated={onStationUpdated} 
            />
          )}
          {activeTab === 'users' && (
            <ManageStationUsers 
              station={station} 
              onStationUpdated={onStationUpdated} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditStationModal;
