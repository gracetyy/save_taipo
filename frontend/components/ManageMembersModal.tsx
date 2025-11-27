import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { Station, UserRole } from '../../types';
import { getStationMembers, addStationMember, removeStationMember } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ManageMembersModalProps {
  station: Station;
  onClose: () => void;
  onUpdate: () => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ station, onClose, onUpdate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [members, setMembers] = useState<{ ownerIds: string[], volunteerIds: string[] }>({ ownerIds: [], volunteerIds: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'owner' | 'volunteer'>('volunteer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOwner = user?.email ? members.ownerIds.includes(user.email) : false;

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const fetchedMembers = await getStationMembers(station.id);
      setMembers(fetchedMembers);
    } catch (error) {
      showToast('Failed to load members.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [station.id]);

  const handleAdd = async () => {
    if (!user) return;
    if (!newMemberEmail.trim()) {
      showToast('Please enter an email.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addStationMember(station.id, newMemberEmail, newMemberRole.toUpperCase() as 'MANAGER' | 'VOLUNTEER', user.id, user.role);
      showToast('Member added successfully.', 'success');
      setNewMemberEmail('');
      fetchMembers();
      onUpdate();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (email: string, role: 'owner' | 'volunteer') => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await removeStationMember(station.id, email, role.toUpperCase() as 'MANAGER' | 'VOLUNTEER', user.id, user.role);
      showToast('Member removed successfully.', 'success');
      fetchMembers();
      onUpdate();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManage = isAdmin || isOwner;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">{t('manage_members.title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
        </div>

        <div className="p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              {/* Owners List */}
              <div className="mb-6">
                <h3 className="font-bold mb-2">{t('manage_members.owners')} ({members.ownerIds.length})</h3>
                <ul className="space-y-2">
                  {members.ownerIds.map(email => (
                    <li key={email} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{email}</span>
                      {isAdmin && members.ownerIds.length > 1 && (
                        <button onClick={() => handleRemove(email, 'owner')} disabled={isSubmitting} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Volunteers List */}
              <div>
                <h3 className="font-bold mb-2">{t('manage_members.volunteers')} ({members.volunteerIds.length})</h3>
                <ul className="space-y-2">
                  {members.volunteerIds.map(email => (
                    <li key={email} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span>{email}</span>
                      {canManage && (
                        <button onClick={() => handleRemove(email, 'volunteer')} disabled={isSubmitting} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {canManage && (
          <div className="p-4 border-t mt-auto">
            <h3 className="font-bold mb-2">{t('manage_members.add_title')}</h3>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder={t('manage_members.email_placeholder')}
                className="flex-grow p-2 border rounded"
              />
              {isAdmin && (
                <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value as 'owner' | 'volunteer')} className="p-2 border rounded">
                  <option value="volunteer">{t('roles.volunteer')}</option>
                  <option value="owner">{t('roles.owner')}</option>
                </select>
              )}
              <button onClick={handleAdd} disabled={isSubmitting || !newMemberEmail} className="bg-primary text-white px-4 py-2 rounded font-bold hover:bg-teal-700 disabled:bg-gray-400">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
