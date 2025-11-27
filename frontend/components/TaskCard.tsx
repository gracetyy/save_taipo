
import { DeliveryTask, Station, UserRole } from '../../types';
import { ArrowRight, Box, Clock, Truck, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { claimTask, completeTask, deleteTask } from '../services/dataService';
import { useToast } from '../contexts/ToastContext';
import { useState } from 'react';
import { EditTaskModal } from './EditTaskModal';

interface Props {
  task: DeliveryTask;
  fromStation?: Station;
  toStation?: Station;
  stations: Station[];
  onUpdate: () => void;
}

export const TaskCard: React.FC<Props> = ({ task, fromStation, toStation, stations, onUpdate }) => {
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canManage = user && (
    user.role === UserRole.ADMIN ||
    (user.role === UserRole.STATION_MANAGER && (user.managedStationIds?.includes(task.fromStationId) || user.managedStationIds?.includes(task.toStationId)))
  );

  const handleClaim = () => {
      if (!user) {
          showToast(t('log.login_alert'), 'error', {
              label: t('btn.signin'),
              onClick: login
          });
          return;
      }
      claimTask(task.id, user.id);
      onUpdate();
  };

  const handleComplete = () => {
      completeTask(task.id);
      onUpdate();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
        try {
            await deleteTask(task.id);
            showToast('Task deleted successfully', 'success');
            onUpdate();
        } catch (error) {
            showToast('Failed to delete task', 'error');
        }
    }
  };

  const handleUpdate = () => {
    setIsEditModalOpen(false);
    onUpdate();
  };

  const timeAgo = Math.floor((Date.now() - task.createdAt) / (1000 * 60)); // minutes

  return (
    <>
        <div className={`bg-white rounded-xl border p-4 shadow-sm mb-4 relative overflow-hidden ${task.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.8]' : ''}`}>
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.status === 'COMPLETED' ? 'bg-green-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            
            <div className="pl-3">
                {/* Header: Status & Time */}
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {task.status === 'PENDING' && t('task.status_pending')}
                        {task.status === 'IN_PROGRESS' && t('task.status_in_progress')}
                        {task.status === 'COMPLETED' && t('task.status_completed')}
                    </span>
                    <div className="flex items-center space-x-2">
                        {canManage && (
                            <>
                                <button onClick={() => setIsEditModalOpen(true)} className="p-1.5 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100">
                                    <Edit size={16} />
                                </button>
                                <button onClick={handleDelete} className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                        <span className="text-xs text-gray-400 flex items-center">
                            <Clock size={10} className="mr-1"/> {timeAgo} min ago
                        </span>
                    </div>
                </div>

                {/* Route */}
                <div className="flex items-center space-x-2 mb-4">
                    <div className="flex-1">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">{t('task.from')}</div>
                        <div className="font-bold text-gray-800 text-sm leading-tight">{fromStation?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 truncate">{fromStation?.address}</div>
                    </div>
                    <div className="text-gray-300">
                        <ArrowRight size={20}/>
                    </div>
                    <div className="flex-1 text-right">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">{t('task.to')}</div>
                        <div className="font-bold text-gray-800 text-sm leading-tight">{toStation?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 truncate">{toStation?.address}</div>
                    </div>
                </div>

                {/* Cargo */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center">
                        <Box size={10} className="mr-1"/> {t('task.items')}
                    </div>
                    <ul className="text-xs font-medium text-gray-700 space-y-1">
                        {task.items && task.items.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                {task.status !== 'COMPLETED' && (
                    <div className="flex justify-end">
                        {task.status === 'PENDING' ? (
                             <button 
                                onClick={handleClaim}
                                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-gray-800 transition shadow-md"
                             >
                                 <Truck size={16} className="mr-2"/> {t('btn.claim')}
                             </button>
                        ) : (
                            task.driverId === user?.id ? (
                                <button 
                                    onClick={handleComplete}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-green-700 transition shadow-md"
                                >
                                    <CheckCircle size={16} className="mr-2"/> {t('btn.complete')}
                                </button>
                            ) : (
                                <div className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-full flex items-center">
                                    <Truck size={12} className="mr-1"/> {t('task.status_in_progress')}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
        <EditTaskModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            task={task}
            stations={stations}
            onTaskUpdated={handleUpdate}
        />
    </>
  );
};

