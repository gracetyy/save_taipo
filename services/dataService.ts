

import { Station, DeliveryTask, UserRole, OFFERING_CATEGORIES } from '../types';
import apiClient from '../frontend/services/apiClient';

// --- Station Management ---
export const getStations = async (): Promise<Station[]> => {
  return apiClient.get<Station[]>('/stations');
};

export const addStation = async (newStation: Omit<Station, 'id'>) => {
  return apiClient.post<Station>('/stations', newStation);
};

export const updateStation = async (updatedStation: Station) => {
  return apiClient.put<Station>(`/stations/${updatedStation.id}`, updatedStation);
};

export const deleteStation = async (id: string) => {
  return apiClient.delete(`/stations/${id}`);
};

// --- Voting & Verification ---
export const voteOnStation = async (stationId: string, userId: string, voteType: 'UP' | 'DOWN', userRole: UserRole) => {
  return apiClient.post(`/stations/${stationId}/vote`, { userId, voteType, userRole });
};

export const getUserVote = async (stationId: string, userId: string): Promise<'UP' | 'DOWN' | undefined> => {
  try {
    const result = await apiClient.get<{ voteType: 'UP' | 'DOWN' | null }>(`/votes/${userId}/${stationId}`);
    return result.voteType ?? undefined;
  } catch (error) {
    console.error('Failed to fetch user vote', error);
    return undefined;
  }
};
// --- Favorites ---
export const getFavoriteIds = async (userId: string): Promise<string[]> => {
  return apiClient.get<string[]>(`/favorites/${userId}`);
};

export const toggleFavorite = async (userId: string, stationId: string) => {
  const isFav = await isFavorite(userId, stationId);
  if (isFav) {
    return apiClient.delete(`/favorites/${userId}/${stationId}`);
  } else {
    return apiClient.post(`/favorites/${userId}`, { stationId });
  }
};

export const isFavorite = async (userId: string, stationId: string): Promise<boolean> => {
  const favs = await getFavoriteIds(userId);
  return favs.includes(stationId);
};


// --- Delivery Tasks ---
export const getTasks = async (): Promise<DeliveryTask[]> => {
  return apiClient.get<DeliveryTask[]>('/tasks');
};

export const claimTask = async (taskId: string, driverId: string) => {
  return apiClient.post(`/tasks/${taskId}/claim`, { driverId });
};

export const completeTask = async (taskId: string) => {
  return apiClient.post(`/tasks/${taskId}/complete`);
};

// --- Global Alerts ---
export const getGlobalAlert = async (): Promise<string | null> => {
  // This could be fetched from a specific 'globals' or 'config' collection in Firestore.
  console.warn('getGlobalAlert is not implemented on the backend yet.');
  return null; // localStorage.getItem(ALERT_KEY);
};
export const setGlobalAlert = async (msg: string) => {
  // This would require a secure endpoint.
  console.warn('setGlobalAlert is not implemented on the backend yet.');
};


// --- Categories ---
export const getOfferingCategories = async (): Promise<Record<string, string[]>> => {
  try {
    const categories = await apiClient.get<Record<string, string[]>>('/categories');
    return categories;
  } catch (error) {
    console.error('Failed to fetch offering categories from backend, using default.', error);
    return OFFERING_CATEGORIES;
  }
};

export const addOfferingCategory = async (categoryKey: string) => {
  return apiClient.post('/categories', { categoryKey });
};

export const addOfferingItem = async (categoryKey: string, item: string) => {
  return apiClient.post(`/categories/${categoryKey}/items`, { item });
};


// --- Utility ---
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};
