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
    // Whether this user is currently authenticated on the client
    // This is primarily a frontend/runtime flag; the backend may omit this.
    isLoggedIn?: boolean;
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
    welcomeShown?: boolean; // Whether the user has completed/seen the welcome step (persisted)
}


export enum StationType {
    SUPPLY = 'SUPPLY',
    SHELTER = 'SHELTER',
    CLOSED = 'CLOSED',
    PET_SHELTER = 'PET_SHELTER',
    FOOD_DISTRIBUTION = 'FOOD_DISTRIBUTION',
    MEDICAL = 'MEDICAL',
    COLLECTION_POINT = 'COLLECTION_POINT'
}

export enum SupplyStatus {
    AVAILABLE = '✅',
    LOW_STOCK = '⚠️',
    URGENT = '‼️',
    NO_DATA = '🤨',
    GOV_CONTROL = '🙅🏻',
    PAUSED = '暫停接收物資（現場提供）'
}

export enum CrowdStatus {
    LOW = 'LOW',       // Green
    MEDIUM = 'MEDIUM', // Yellow
    HIGH = 'HIGH',     // Orange
    FULL = 'FULL'      // Red (Packed)
}

export interface NeedItem {
    item: string;
    status: SupplyStatus;
    quantity?: number;
}

export interface Offering {
    item: string;
    status: SupplyStatus;
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
    name_en?: string;
    address: string;
    lat: number;
    lng: number;
    type: StationType;
    organizer: 'GOV' | 'NGO' | 'COMMUNITY';
    status: SupplyStatus;
    crowdStatus?: CrowdStatus;
    needs: NeedItem[];
    offerings: Offering[];
    lastUpdated: number; // Timestamp of content creation/edit
    lastVerified?: number; // Timestamp of last vote/verification
    upvotes: number;
    downvotes: number;
    contactNumber?: string;
    contactLink?: string; // Telegram, FB, IG link
    mapLink?: string; // Prefer direct link to maps when available
    verification?: StationVerification;
    /** @deprecated Use `managers` instead */
    ownerId?: string;
    managers?: string[]; // User emails of station managers
    volunteers?: string[]; // User emails of station volunteers
    /** Misc remarks or comments about the station */
    remarks?: string;
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
    'cat.manpower': [
        '一般義工', '醫護人員', '社工', '車手', '心理輔導員'
    ],
    'cat.warmth': [
        '保暖內衣', '求毛氈', '反光錫紙', '暖包'
    ],
    'cat.food_water': [
        '熱水', '水', '麵包', '能量啫喱', '乾糧', '杯麵', '熱食', '湯水', '罐頭', '紙杯'
    ],
    'cat.hygiene_wash': [
        '大毛巾', '洗頭水', '沐浴露', '垃圾袋', '摺凳', '番梘', '毛巾', '牙刷', '牙膏'
    ],
    'cat.electronics': [
        '尿袋', '照明用品', '差電線', '叉電線', '火牛', '拖板', '電池', 'SIM Card'
    ],
    'cat.bedding': [
        '床墊', '枕頭', '被', '眼罩', '耳塞', '睡袋', '地墊', '露營帳篷'
    ],
    'cat.sanitary': [
        '75%支裝酒精', '濕紙巾', '女性用品', '紙巾', '口罩', '豬咀', '濾罐', 'N95'
    ],
    'cat.pets': [
        '貓狗罐頭', '貓狗乾糧', '寵物衣服', '藥品', '寵物氧氣機', '寵物飛機籠', '寵物暫托家庭', '獸醫服務', '寵物救援'
    ],
    'cat.baby': [
        '奶樽', '奶粉', '尿片', 'BB尿片'
    ],
    'cat.others': [
        '文具', '紅白藍膠袋', '大聲公', '成人尿片', '拖鞋', '內衣褲', '一次性內衣褲'
    ]
};

// Lookup table for item name normalization/translation if needed in future
// Currently storing Chinese name as key, and could store English name or other metadata as value.
// For now, it's just a reference.
export const ITEM_LOOKUP_TABLE: Record<string, { en: string, original?: string }> = {
    '一般義工': { en: 'General volunteers' },
    '醫護人員': { en: 'medic' },
    '社工': { en: 'social worker' },
    '車手': { en: 'driver' },
    '心理輔導員': { en: 'psychological counselor' },
    '保暖內衣': { en: 'Thermal underwear' },
    '求毛氈': { en: 'Blanket' },
    '反光錫紙': { en: 'Reflective foil' },
    '熱水': { en: 'Hot water', original: '熱水 hot water (連紙杯）' },
    '水': { en: 'Water' },
    '麵包': { en: 'Bread', original: '麵包(獨立包裝)' },
    '能量啫喱': { en: 'Energy gel' },
    '大毛巾': { en: 'Large towel', original: '(大)毛巾 towel' },
    '洗頭水': { en: 'Shampoo', original: '（細支裝為主）洗頭水 Shampoo' },
    '沐浴露': { en: 'Body wash', original: '（細支裝為主）沐浴露 body wash' },
    '垃圾袋': { en: 'Trash bag', original: '垃圾袋 trash bag' },
    '摺凳': { en: 'Folding stool', original: '摺凳 Chair' },
    '番梘': { en: 'Soap' },
    '尿袋': { en: 'Power bank', original: '尿袋/差電器/插蘇 Power Bank、Charger' },
    '照明用品': { en: 'Lighting (battery)', original: '照明用品（乾電）' },
    '差電線': { en: 'Charging cable', original: '差電線 Power Cable' },
    '床墊': { en: 'Mattress' },
    '枕頭': { en: 'Pillow' },
    '被': { en: 'Quilt/Blanket' },
    '眼罩': { en: 'Eye mask' },
    '耳塞': { en: 'Earplugs' },
    '75%支裝酒精': { en: '75% Alcohol' },
    '濕紙巾': { en: 'Wet wipes' },
    '女性用品': { en: 'Feminine hygiene products' },
    '貓狗罐頭': { en: 'Pet canned food' },
    '貓狗乾糧': { en: 'Pet dry food' },
    '寵物衣服': { en: 'Pet clothes', original: '寵物衣服、保暖用物品' },
    '藥品': { en: 'Medicine (Pet)' },
    '奶樽': { en: 'Baby bottle' },
    '奶粉': { en: 'Milk powder' },
    '尿片': { en: 'Diapers' },
    '文具': { en: 'Stationery', original: '文具 （粗marker、膠紙、界刀）' },
    '紅白藍膠袋': { en: 'Red-white-blue bag' },
    '大聲公': { en: 'Megaphone' }
};
