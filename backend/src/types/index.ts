// Single source of truth for types shared between frontend and backend

export enum UserMode {
    RESIDENT = 'RESIDENT',
    VOLUNTEER = 'VOLUNTEER'
}

/**
 * Defines the access level and capabilities of a user.
 * This is the primary determinant of what a user can see and do.
 */
export enum UserRole {
    GUEST = 'GUEST',                  // Anonymous user, can only view public data.
    RESIDENT = 'RESIDENT',            // General user, can view stations, request help.
    VOLUNTEER = 'VOLUNTEER',          // Can join stations, participate in tasks.
    DRIVER = 'DRIVER',                // Specialized volunteer for logistics.
    STATION_MANAGER = 'STATION_MANAGER',// Manages a specific station, its members, and inventory.
    ADMIN = 'ADMIN'                   // Superuser, can manage all data, users, and system settings.
}

/**
 * Represents a team of users working at a station, can be used for shifts etc.
 */
export interface Team {
    id: string;
    name: string;
    stationId: string;
    members: string[]; // array of user IDs
    teamLeadId: string; // user ID of the team lead
}

/**
 * Represents the user's current status in the system.
 */
export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE', // e.g. volutneer not on duty
    SUSPENDED = 'SUSPENDED', // Banned by admin
}



export enum VehicleType {
    CAR = 'CAR',
    VAN = 'VAN',
    TRUCK = 'TRUCK',
    MOTORCYCLE = 'MOTORCYCLE',
}

export interface DriverProfile {
    vehicleType: VehicleType;
    licensePlate: string;
    region: 'HK' | 'KLN' | 'NT';
    isOnline: boolean;
    currentLocation: {
        lat: number;
        lng: number;
    };
}
export interface UserProfile {
    id: string; // Firebase Auth UID
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: number; // Timestamp
    lastLogin: number; // Timestamp

    driverProfile?: DriverProfile;
    vehicleType?: string; // Legacy

    // For STATION_MANAGER
    managedStationIds?: string[];

    // For VOLUNTEER
    stationTeams?: string[]; // List of team IDs the user belongs to

    // User settings/preferences
    prefersLanguage: 'en' | 'zh';
    notificationsEnabled: boolean;
}


export enum StationType {
    SUPPLY = 'SUPPLY',
    REST = 'REST',
    PET_SHELTER = 'PET_SHELTER',
    FOOD_DISTRIBUTION = 'FOOD_DISTRIBUTION',
    MEDICAL = 'MEDICAL',
    COLLECTION_POINT = 'COLLECTION_POINT'
}

export enum SupplyStatus {
    AVAILABLE = 'AVAILABLE', // Green
    LOW_STOCK = 'LOW_STOCK', // Yellow
    EMPTY_CLOSED = 'EMPTY_CLOSED' // Red
}

export enum CrowdStatus {
    LOW = 'LOW',       // Green
    MEDIUM = 'MEDIUM', // Yellow
    HIGH = 'HIGH',     // Orange
    FULL = 'FULL'      // Red (Packed)
}

export interface NeedItem {
    item: string;
    quantity?: number;
    unit?: string;
}

export interface StationVerification {
    isVerified: boolean;
    verifiedBy: 'ADMIN' | 'COMMUNITY' | 'OFFICIAL';
    sourceUrl?: string; // Link to source message (e.g. Telegram/FB)
    verifiedAt?: number;
}

export interface Station {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: StationType;
    organizer: 'OFFICIAL' | 'NGO' | 'COMMUNITY';
    status: SupplyStatus;
    crowdStatus?: CrowdStatus;
    needs: NeedItem[];
    offerings: string[];
    features: {
        hasPets: boolean;
        isWheelchairAccessible: boolean;
        hasBabyCare: boolean;
        hasCharging: boolean;
    };
    lastUpdated: number; // Timestamp of content creation/edit
    lastVerified?: number; // Timestamp of last vote/verification
    upvotes: number;
    downvotes: number;
    contactNumber: string;
    contactLink?: string; // Telegram, FB, IG link
    verification?: StationVerification;
    /** @deprecated Use `managers` instead */
    ownerId?: string;
    managers?: string[]; // User emails of station managers
    volunteers?: string[]; // User emails of station volunteers
}

export interface DeliveryTask {
    id: string;
    fromStationId: string;
    toStationId: string;
    items: string[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    driverId?: string;
    createdAt: number;
}

export interface TransportTask {
    taskId: string;
    status: 'PENDING' | 'CLAIMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    pickup: {
        locationName: string;
        address: string;
        lat: number;
        lng: number;
        contactName: string;
        contactPhone: string;
    };
    dropoff: {
        locationName: string;
        stationId?: string;
        address: string;
        lat: number;
        lng: number;
    };
    items: {
        item: string;
        quantity: string;
    }[];
    vehicleRequirement: 'CAR' | 'VAN' | 'TRUCK';
    assignedDriverId?: string;
    claimedAt?: number;
    createdBy: string;
    createdAt: number;
}


export interface Coordinates {
    lat: number;
    lng: number;
}

// Data Structure for Categorized Offerings
export const OFFERING_CATEGORIES: Record<string, string[]> = {
    'cat.accommodation': [
        '住宿', '暫住', '宿位', '庇護中心', '休息處', '洗澡設施', '洗手間', '水機', '廚房'
    ],
    'cat.food_drink': [
        '食物', '飲品', '樽裝水', '乾糧', '杯麵', '熱食', '能量棒', '湯水', '罐頭', '餐具', '飯盒', '紙杯'
    ],
    'cat.warmth_sleep': [
        '保暖物資', '毛巾', '毛氈', '被鋪', '被', '褸', '襪', '暖包', '睡袋', '枕頭', '地墊', '露營帳篷', 'Heat tech', '床墊', '眼罩'
    ],
    'cat.hygiene': [
        '牙刷', '牙膏', '口罩', '豬咀', '濾罐', 'BB尿片', '成人尿片', '清潔用品', '沐浴露', '洗頭水', '濕紙巾', '紙巾', '一次性內衣褲', '拖鞋', "內衣褲", '衛生用品', 'N95'
    ],
    'cat.electronics': [
        '叉電線', '尿袋', '火牛', '拖板', '電池', '電筒', 'SIM Card'
    ],
    'cat.medical': [
        '急救', '急救包', '輪椅'
    ],
    'cat.pets': [
        '寵物氧氣機', '寵物飛機籠', '寵物暫托家庭', '貓糧', '狗糧', '獸醫服務', '寵物救援'
    ],
    'cat.service': [
        '看顧長者', '兒童暫託', '心理支援'
    ],
    'cat.tools': [
        '紅白藍膠袋', '大聲公'
    ]
};
