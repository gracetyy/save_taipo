import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { Check, X, Loader2 } from 'lucide-react';

interface DriverRequest {
  userId: string;
  name: string;
  email: string;
  vehicleType: string;
  licensePlate: string;
  otherDetails: string;
  createdAt: number;
}

const DriverRequests = () => {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<DriverRequest[]>('/roles/driver-requests');
      setRequests(response);
    } catch (error) {
      showToast('Failed to fetch driver requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await apiClient.post(`/roles/approve-driver/${userId}`);
      showToast('Driver request approved', 'success');
      fetchRequests();
    } catch (error) {
      showToast('Failed to approve request', 'error');
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Enter a reason for rejection (optional):');
    try {
      await apiClient.post(`/roles/reject-driver/${userId}`, { reason });
      showToast('Driver request rejected', 'success');
      fetchRequests();
    } catch (error) {
      showToast('Failed to reject request', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pending Driver Requests</h1>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.userId} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.name} ({req.email})</p>
                  <p className="text-sm text-gray-600">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.userId)} className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600">
                    <Check size={16} />
                  </button>
                  <button onClick={() => handleReject(req.userId)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p><strong>Vehicle:</strong> {req.vehicleType}</p>
                <p><strong>License Plate:</strong> {req.licensePlate}</p>
                {req.otherDetails && <p><strong>Details:</strong> {req.otherDetails}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverRequests;
