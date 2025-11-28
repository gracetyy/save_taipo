import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface DriverRequest {
    userId: string;
    email: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    vehicleType: string;
    licensePlate: string;
    otherDetails?: string;
    createdAt: number;
}

const DriverRequests = () => {
    const [requests, setRequests] = useState<DriverRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await apiClient.get<DriverRequest[]>('/roles/driver-requests');
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch driver requests:', error);
            showToast('Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await apiClient.post(`/roles/approve-driver/${userId}`);
            showToast('Driver request approved', 'success');
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Failed to approve driver:', error);
            showToast('Failed to approve driver', 'error');
        }
    };

    const handleReject = async (userId: string) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await apiClient.post(`/roles/reject-driver/${userId}`, { reason });
            showToast('Driver request rejected', 'success');
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Failed to reject driver:', error);
            showToast('Failed to reject driver', 'error');
        }
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Driver Requests</h1>
            {requests.length === 0 ? (
                <p className="text-gray-500">No pending requests.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.userId} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{req.name}</h3>
                                    <p className="text-sm text-gray-600">{req.email}</p>
                                    <div className="mt-2 text-sm">
                                        <p><strong>Vehicle:</strong> {req.vehicleType}</p>
                                        <p><strong>License:</strong> {req.licensePlate}</p>
                                        {req.otherDetails && <p><strong>Details:</strong> {req.otherDetails}</p>}
                                        <p className="text-gray-400 text-xs mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <button 
                                        onClick={() => handleApprove(req.userId)}
                                        className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200 flex items-center"
                                        title="Approve"
                                    >
                                        <CheckCircle size={20} className="mr-1"/> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleReject(req.userId)}
                                        className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200 flex items-center"
                                        title="Reject"
                                    >
                                        <XCircle size={20} className="mr-1"/> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DriverRequests;
