import React, { useState } from 'react';
import { Truck, X, Loader2 } from 'lucide-react';
import { UserProfile, VehicleType } from '../../types';
import { apiClient } from '../services/apiClient';
import { useToast } from '../contexts/ToastContext';

interface DriverRequestModalProps {
  user: UserProfile;
  onClose: () => void;
  onComplete: () => void;
}

export const DriverRequestModal: React.FC<DriverRequestModalProps> = ({ user, onClose, onComplete }) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/driver-requests', { userId: user.id, vehicleType });
      showToast('Driver request submitted successfully!', 'success');
      onComplete();
      onClose();
    } catch (error) {
      showToast('Failed to submit driver request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold flex items-center"><Truck className="mr-2" />Request Driver Role</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600">
              To become a driver, please select your vehicle type. An administrator will review your request.
            </p>
            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
              <select
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="CAR">Car</option>
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
                <option value="MOTORCYCLE">Motorcycle</option>
              </select>
            </div>
          </div>
          <div className="p-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white px-4 py-2 rounded font-bold hover:bg-teal-700 disabled:bg-gray-400 flex items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
