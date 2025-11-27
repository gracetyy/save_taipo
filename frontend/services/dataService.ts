import { apiClient } from './apiClient';
import { Station, DeliveryTask, UserRole, OFFERING_CATEGORIES } from '../../types';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);
// Local storage keys for offline/fallback data
const STATIONS_CACHE_KEY = 'resq_stations_cache';
const USER_VOTES_CACHE_KEY = 'resq_user_votes_cache';


// ==================== STATIONS ====================

export const getStations = async (): Promise<Station[]> => {
  try {
    const stations = await apiClient.get<Station[]>('/stations');
    // Cache for offline use
    localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify(stations));
    return stations;
  } catch (error) {
    console.error('Error fetching stations from API:', error);
    // Fallback to cached data
    const cached = localStorage.getItem(STATIONS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return [];
  }
};

export const getStation = async (id: string): Promise<Station | null> => {
  try {
    return await apiClient.get<Station>(`/stations/${id}`);
  } catch (error) {
    console.error('Error fetching station:', error);
    // Fallback to cached data
    const cached = localStorage.getItem(STATIONS_CACHE_KEY);
    if (cached) {
      const stations: Station[] = JSON.parse(cached);
      return stations.find(s => s.id === id) || null;
    }
    return null;
  }
};

export const addStation = async (station: Omit<Station, 'id'>): Promise<Station> => {
  return await apiClient.post<Station>('/stations', station);
};

export const updateStation = async (station: Station): Promise<Station> => {
  return await apiClient.put<Station>(`/stations/${station.id}`, station);
};

export const deleteStation = async (id: string): Promise<void> => {
  await apiClient.delete(`/stations/${id}`);
};

export const deleteOffering = async (stationId: string, offering: string): Promise<void> => {
  await apiClient.delete(`/stations/${stationId}/offerings/${offering}`);
};

export const deleteNeed = async (stationId: string, need: string): Promise<void> => {
  await apiClient.delete(`/stations/${stationId}/needs/${need}`);
};

// ==================== STATION MEMBERS ====================

export const getStationMembers = async (stationId: string): Promise<{ ownerIds: string[], volunteerIds: string[] }> => {
  return await apiClient.get<{ ownerIds: string[], volunteerIds: string[] }>(`/stations/${stationId}/users`);
};

export const addStationMember = async (
  stationId: string,
  email: string,
  role: 'MANAGER' | 'VOLUNTEER',
  _userId: string, // No longer needed for API call, but kept for compatibility with component call
  _userRole?: UserRole, // No longer needed for API call
): Promise<void> => {
  const roleToSend = role === 'MANAGER' ? 'owner' : 'volunteer';
  await apiClient.post(`/stations/${stationId}/users`, { email, role: roleToSend });
};

export const removeStationMember = async (
  stationId: string,
  email: string,
  role: 'MANAGER' | 'VOLUNTEER',
  _userId: string, // No longer needed for API call
  _userRole?: UserRole // No longer needed for API call
): Promise<void> => {
  const roleToSend = role === 'MANAGER' ? 'owner' : 'volunteer';
  // Axios delete body is in the `data` property of the config object
  await apiClient.delete(`/stations/${stationId}/users`, { data: { email, role: roleToSend } });
};

// ==================== VOTING =.==================

export const verifyStation = async (
  stationId: string,
  positive: boolean,
  userId: string,
  userRole?: UserRole
): Promise<void> => {
  await apiClient.post(`/stations/${stationId}/vote`, {
    userId,
    voteType: positive ? 'UP' : 'DOWN',
    userRole,
  });
};

export const getUserVote = async (
  userId: string,
  stationId: string
): Promise<'UP' | 'DOWN' | null | undefined> => {
  try {
    const result = await apiClient.get<{ voteType: 'UP' | 'DOWN' | null | undefined }>(
      `/votes/${userId}/${stationId}`
    );
    return result.voteType;
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return null;
  }
};

export const getUserVotes = async (
  userId: string
): Promise<Record<string, 'UP' | 'DOWN'>> => {
  try {
    const votes = await apiClient.get<Record<string, 'UP' | 'DOWN'>>(
      `/votes/user/${userId}`
    );
    // Cache for offline use
    localStorage.setItem(USER_VOTES_CACHE_KEY, JSON.stringify(votes));
    return votes;
  } catch (error) {
    console.error('Error fetching user votes:', error);
    const cached = localStorage.getItem(USER_VOTES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return {};
  }
};

// ==================== ROLES ====================

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const response = await apiClient.get<{ role: UserRole }>(`/roles/${userId}`);
    return response.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

export const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await apiClient.put(`/roles/${userId}`, { role });
};

// ==================== FAVORITES ====================
const FAVORITES_CACHE_KEY = 'resq_favorites_cache';

export const getFavoriteIds = async (userId: string): Promise<string[]> => {
  try {
    const favorites = await apiClient.get<string[]>(`/favorites/${userId}`);
    localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    const cached = localStorage.getItem(FAVORITES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
};

export const addFavorite = async (userId: string, stationId: string): Promise<void> => {
  await apiClient.post(`/favorites/${userId}`, { stationId });
};

export const removeFavorite = async (userId: string, stationId: string): Promise<void> => {
  await apiClient.delete(`/favorites/${userId}/${stationId}`);
};

export const toggleFavorite = async (userId: string, stationId: string): Promise<void> => {
  const favorites = await getFavoriteIds(userId);
  if (favorites.includes(stationId)) {
    await removeFavorite(userId, stationId);
  } else {
    await addFavorite(userId, stationId);
  }
};

export const isFavorite = (stationId: string): boolean => {
  const favs = JSON.parse(localStorage.getItem(FAVORITES_CACHE_KEY) || '[]');
  return favs.includes(stationId);
};

// ==================== DELIVERY TASKS ====================

export const getTasks = async (): Promise<DeliveryTask[]> => {
  try {
    return await apiClient.get<DeliveryTask[]>('/tasks');
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const createTask = async (
  task: Omit<DeliveryTask, 'id' | 'status' | 'createdAt'>
): Promise<DeliveryTask> => {
  return await apiClient.post<DeliveryTask>('/tasks', task);
};

export const updateTask = async (taskId: string, task: Partial<DeliveryTask>): Promise<DeliveryTask> => {
  return await apiClient.put<DeliveryTask>(`/tasks/${taskId}`, task);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}`);
};

export const claimTask = async (taskId: string, driverId: string): Promise<void> => {
  await apiClient.post(`/tasks/${taskId}/claim`, { driverId });
};

export const completeTask = async (taskId: string): Promise<void> => {
  await apiClient.post(`/tasks/${taskId}/complete`);
};

// ==================== GLOBAL ALERTS ====================

export const getGlobalAlert = async (): Promise<string | null> => {
  try {
    const alert = await apiClient.get<{ message: string } | null>('/alerts');
    return alert?.message || null;
  } catch (error) {
    console.error('Error fetching global alert:', error);
    return null;
  }
};

export const setGlobalAlert = async (message: string, userId: string): Promise<void> => {
  await apiClient.post('/alerts', { message, userId });
};

export const clearGlobalAlert = async (): Promise<void> => {
  await apiClient.delete('/alerts');
};

// ==================== UTILITIES ====================

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

// Seed data endpoint (for initial setup)
export const seedStations = async (stations: Station[]): Promise<void> => {
  await apiClient.post('/stations/seed', { stations });
};

// Offerings/Category Persistence
const CATEGORIES_CACHE_KEY = 'resq_offering_categories_v1';

export const getOfferingCategories = async (): Promise<Record<string, string[]>> => {
  try {
    const categories = await apiClient.get<Record<string, string[]>>('/categories');
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
    return categories;
  } catch (error) {
    console.error('Error fetching offering categories:', error);
    const cached = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return OFFERING_CATEGORIES;
  }
};

export const addOfferingCategory = async (categoryKey: string) => {
  await apiClient.post('/categories', { categoryKey });
  // Invalidate cache and refetch
  const categories = await getOfferingCategories();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('resq:categories:updated'));
  }
  return categories;
};

export const addOfferingItem = async (categoryKey: string, item: string) => {
  await apiClient.post('/items', { categoryKey, item });
  // Invalidate cache and refetch
  const categories = await getOfferingCategories();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('resq:categories:updated'));
  }
  return categories;
};

export const subscribeToCategories = (callback: (categories: Record<string, string[]>) => void) => {
  const categoriesCol = collection(db, 'offering_categories');
  const unsubscribe = onSnapshot(categoriesCol, (snapshot) => {
    const categories: Record<string, string[]> = {};
    snapshot.forEach(doc => {
      categories[doc.id] = doc.data().items;
    });
    callback(categories);
  });
  return unsubscribe;
};
