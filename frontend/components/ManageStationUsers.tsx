import React, { useState } from 'react';
import { Station } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import { addStationMember, removeStationMember } from '../services/dataService';
import { X } from 'lucide-react';

interface Props {
  station: Station;
  onStationUpdated: (updatedStation: Station) => void;
}

const ManageStationUsers: React.FC<Props> = ({ station, onStationUpdated }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'VOLUNTEER'>('VOLUNTEER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isManager = station.managers?.includes(user?.email || '');
  const isAdmin = user?.role === 'ADMIN';

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Email is required.');
      return;
    }

    try {
      await addStationMember(station.id, email, role, user!.id, user!.role);
      setSuccess(`Successfully added ${email} as a ${role}.`);
      setEmail('');
      // Refresh station data
      const updatedStation = { ...station, [role === 'MANAGER' ? 'managers' : 'volunteers']: [...(station[role === 'MANAGER' ? 'managers' : 'volunteers'] || []), email] };
      onStationUpdated(updatedStation);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  };

  const handleRemoveUser = async (userEmail: string, userRole: 'MANAGER' | 'VOLUNTEER') => {
    setError(null);
    setSuccess(null);

    try {
      await removeStationMember(station.id, userEmail, role, user!.id, user!.role);
      setSuccess(`Successfully removed ${userEmail}.`);
      // Refresh station data
      const updatedStation = { ...station, [userRole === 'MANAGER' ? 'managers' : 'volunteers']: (station[userRole === 'MANAGER' ? 'managers' : 'volunteers'] || []).filter(e => e !== userEmail) };
      onStationUpdated(updatedStation);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  };
  
  if (!isAdmin && !isManager) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-gray-900 font-bold mb-3">Add User</h3>
        <form onSubmit={handleAddUser} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User's email"
            required
            className="flex-1 p-2 rounded bg-gray-50 text-gray-900 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as 'MANAGER' | 'VOLUNTEER')} className="p-2 rounded bg-gray-50 text-gray-900 text-sm border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
            <option value="VOLUNTEER">Volunteer</option>
            {isAdmin && <option value="MANAGER">Manager</option>}
          </select>
          <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-teal-700">Add</button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
      </div>

      <div>
        <h3 className="text-gray-900 font-bold mb-3">Managers</h3>
        <ul className="space-y-2">
          {station.managers?.map(managerEmail => (
            <li key={managerEmail} className="bg-gray-50 rounded p-2 flex items-center justify-between border border-gray-200">
              <span className="text-gray-900 text-sm font-medium">{managerEmail}</span>
              {isAdmin && (
                <button onClick={() => handleRemoveUser(managerEmail, 'MANAGER')} className="text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-gray-900 font-bold mb-3">Volunteers</h3>
        <ul className="space-y-2">
          {station.volunteers?.map(volunteerEmail => (
            <li key={volunteerEmail} className="bg-gray-50 rounded p-2 flex items-center justify-between border border-gray-200">
              <span className="text-gray-900 text-sm font-medium">{volunteerEmail}</span>
              <button onClick={() => handleRemoveUser(volunteerEmail, 'VOLUNTEER')} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ManageStationUsers;
