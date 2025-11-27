import { useState, useEffect } from 'react';
import { DeliveryTask, Station } from '../../types';
import { updateTask } from '../services/dataService';
import { useToast } from '../contexts/ToastContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    task: DeliveryTask;
    stations: Station[];
    onTaskUpdated: () => void;
}

export const EditTaskModal: React.FC<Props> = ({ isOpen, onClose, task, stations, onTaskUpdated }) => {
    const { showToast } = useToast();
    const [fromStationId, setFromStationId] = useState(task.fromStationId);
    const [toStationId, setToStationId] = useState(task.toStationId);
    const [items, setItems] = useState(task.items.join(', '));
    const [status, setStatus] = useState(task.status);

    useEffect(() => {
        setFromStationId(task.fromStationId);
        setToStationId(task.toStationId);
        setItems(task.items.join(', '));
        setStatus(task.status);
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateTask(task.id, {
                fromStationId,
                toStationId,
                items: items.split(',').map(item => item.trim()),
                status,
            });
            showToast('Task updated successfully', 'success');
            onTaskUpdated();
            onClose();
        } catch (error) {
            showToast('Failed to update task', 'error');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Edit Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">From Station</label>
                        <select
                            value={fromStationId}
                            onChange={(e) => setFromStationId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {stations.map(station => (
                                <option key={station.id} value={station.id}>{station.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">To Station</label>
                        <select
                            value={toStationId}
                            onChange={(e) => setToStationId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {stations.map(station => (
                                <option key={station.id} value={station.id}>{station.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Items (comma-separated)</label>
                        <input
                            type="text"
                            value={items}
                            onChange={(e) => setItems(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
