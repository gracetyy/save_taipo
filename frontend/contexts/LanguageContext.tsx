import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  zh: {
    // Navigation & Common
    'nav.resident': '居民',
    'nav.resources': '搵資源',
    'nav.volunteer': '幫手',
    'nav.logistics': '車手/物流',
    'nav.safety': '安全資訊',
    'nav.links': '有用連結',
    'nav.my_stations': '站點管理',
    'nav.me': '我的',
    'btn.signin': '登入',
    'btn.signout': '登出',
    'btn.dev_login': 'Dev Login',
    'btn.signin_google': 'Sign in with Google',
    'btn.signin_email': 'Sign in with email',
    'btn.cancel': '取消',
    'btn.confirm': '確定',
    'btn.submit': '提交',
    'btn.navigate': '導航',
    'btn.message': '聯絡',
    'btn.claim': '接單 (我送)',
    'btn.complete': '已送達',
    'btn.filter_items': '篩選物資',
    'btn.apply': '套用',
    'btn.clear': '清除',
    'btn.reset': '重置',
    'btn.traffic': '交通狀況',
    'btn.select_all': '全選此類別',
    'btn.deselect_all': '取消全選',
    'btn.back': '返回',
    'btn.share': '分享',
    'btn.add_item': '新增項目',
    'btn.add_category': '新增類別',
    'btn.add': '新增',
    'btn.edit': '編輯',
    'share.success': '連結已複製！',
    'sort.label': '排序',
    'sort.distance': '最近距離',
    'sort.status': '狀態優先',
    'common.loading': '載入中...',
    'station.not_found': '找不到站點',
    'station.delete_confirm': '確定要刪除此站點嗎？此操作無法復原。',
    'station.delete_success': '站點已成功刪除。',
    'station.delete_error': '刪除站點時發生錯誤。',
    'station.delete_need_confirm': '確定要刪除此需求嗎？',
    'station.delete_need_success': '需求已成功刪除。',
    'station.delete_need_error': '刪除需求時發生錯誤。',
    'station.delete_offering_confirm': '確定要刪除此供應嗎？',
    'station.delete_offering_success': '供應已成功刪除。',
    'station.delete_offering_error': '刪除供應時發生錯誤。',
    'station.managed_station_id': '管理站點 ID:',
    'station.login_to_view': '請登入以查看您的站點',
    'station.edit_station': '編輯站點',
    'btn.save': '儲存',
    'station.name': '站點名稱',
    'station.address_location': '地址和位置',
    'station.use_current_location': '使用目前位置',
    'station.hide_map': '隱藏地圖',
    'station.pick_on_map': '在地圖上選擇',
    'station.map_helper_text': '• 拖曳標記或點擊以設定',
    'station.status': '狀態',
    'station.offerings_label': '提供 (您有什麼)',
    'station.needs_label': '需求 (您需要什麼)',
    'station.add_needs': '新增需求',
    'btn.save_changes': '儲存變更',
    'station.manage_desc': '管理您擁有或協調的站點',
    'station.no_owned_stations': '您尚未擁有任何站點',
    'station.create_station_prompt': '建立一個站點以在此處查看',
    
    // Links View
    'links.desc': '社區整理的資訊及群組',
    'links.tg_title': 'Telegram 群組',
    'links.web_title': '相關網站',

    // Status
    'status.available': '🟢 物資充足',
    'status.low_stock': '🟡 急需補給',
    'status.empty_closed': '🔴 已滿 / 暫停',
    'status.closed': '🔴 已關閉',
    'status.unverified': '未能確認',
    'status.outdated': '未能確認',

    // Crowd Status
    'crowd.low': '人流少',
    'crowd.medium': '人流適中',
    'crowd.high': '人流多',
    'crowd.full': '❌ 人流爆滿',

    // Station Types
    'type.all': '全部',
    'type.supply': '物資站',
    'type.rest': '休息站',
    'type.pet_shelter': '寵物寄養',
    'type.food_distribution': '派飯',
    'type.medical': '急救站',
    'type.collection_point': '收集站',

    // Organizer
    'org.official': '政府',
    'org.ngo': '社福',
    'org.community': '民間',

    // Station Card
    'card.updated_mins': '分鐘前更新',
    'card.updated_hours': '小時前更新',
    'card.needs': '急需支援',
    'card.offerings': '提供',
    'card.no_needs': '暫無特別需求',
    'card.no_info': '暫無資訊',
    'card.report_outdated': '報料: 已無物資',
    
    // Verification
    'verify.verified': '已核實',
    'verify.source': '來源',
    'verify.by_official': '政府核實',
    'verify.by_admin': '管理員核實',
    'verify.by_community': '社群核實',

    // Resident View
    'res.search_placeholder': '搜尋物資、地區...',
    'res.more_filters': '更多篩選',
    'res.filter_pets': '寵物友善',
    'res.filter_baby': '嬰兒友善',
    'res.filter_wheelchair': '輪椅友善',
    'res.filter_charging': '充電服務',
    'res.no_stations_map': '附近找不到相關站點',
    'res.no_stations_list': '找不到符合條件的站點。',
    'res.my_location': '目前位置',
    'res.filter_title': '篩選需要的物資',
    'res.view_details': '查看詳情',

    // Volunteer Hub
    'vol.title': '義工/捐贈配對',
    'vol.add_station': '新增站點',
    'vol.search_placeholder': '搜尋需求 (e.g. 水, 飯盒) 或地區...',
    'vol.urgent_only': '只顯示急需',
    'vol.search_results': '搜尋結果',
    'vol.no_results': '暫無符合條件的站點',
    'vol.reset_filters': '重置所有篩選',
    'vol.login_alert': '請先登入以新增站點。',
    'vol.filter_mode': '篩選模式',
    'vol.mode_needs': '站點缺少 (我去捐)',
    'vol.mode_offerings': '站點提供 (我找物資)',

    // Logistics View
    'log.title': '物流 & 車手專區',
    'log.tab_hubs': '收集中心 (Hubs)',
    'log.tab_tasks': '運送任務',
    'log.no_hubs': '暫無收集中心',
    'log.no_tasks': '暫無運送任務',
    'log.login_alert': '請先登入以接單。',
    'task.from': '取貨點',
    'task.to': '目的地',
    'task.items': '運送物品',
    'task.status_pending': '待接單',
    'task.status_in_progress': '運送中',
    'task.status_completed': '已完成',
    'task.posted': '發佈於',

    // Add Station Modal
    'add.title': '新增站點',
    'add.name': '站點名稱',
    'add.address': '地址',
    'add.lat': '緯度 (Latitude)',
    'add.lng': '經度 (Longitude)',
    'add.use_location': '使用目前位置',
    'add.location_error': '無法獲取位置',
    'add.location_required': '請輸入有效坐標或使用目前位置',
    'add.locating': '定位中...',
    'add.type': '類型',
    'add.contact': '聯絡電話',
    'add.contact_link': '聯絡連結 (Telegram/IG)',
    'add.source_url': '來源連結 / 證明',
    'add.needs': '急需物資 (用逗號分隔)',
    'add.offerings': '提供服務/設施 (用逗號分隔)',
    'add.photo': '相片',
    'add.opening_hours': '開放時間',
    'add.other_info': '其他資訊',
    'add.success': '站點已成功新增！',
    'add.error': '新增站點時發生錯誤。',
    'add.placeholder_name': 'e.g. 旺角臨時物資站',
    'add.placeholder_address': 'e.g. 西洋菜南街 22 號',
    'add.placeholder_contact': '可選',
    'add.placeholder_contact_link': 'e.g. https://t.me/group',
    'add.placeholder_source': 'e.g. https://t.me/channel/1234',
    'add.placeholder_needs': 'e.g. Water, Bread, Diapers',
    'add.placeholder_offerings': 'e.g. 充電, 休息區',

    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.or': 'Or',
    'auth.signup': 'Sign up',

    // Me / Saved
    'me.title': '我的',
    'me.saved_stations': '已收藏站點',
    'me.my_stations': '我的站點',
    'me.no_saved': '暫無收藏站點',
    'me.login_desc': '登入以管理個人檔案及查看更多功能',

    // Manage Members Modal
    'manage_members.title': '管理成員',
    'manage_members.owners': '擁有者',
    'manage_members.volunteers': '義工',
    'manage_members.add_title': '新增成員',
    'manage_members.email_placeholder': '輸入用戶電郵',
    
    // Auth & Others
    'auth.login_vote_alert': '請先登入以評分。',
    'badge.admin': 'ADMIN',
    'footer.origin': 'Origin:',
    'auth.dev_login': 'Dev Login',

    // Admin
    'admin.global_alert_broadcast': 'Global Alert Broadcast',
    'admin.alert_placeholder': 'Enter alert message...',
    'admin.publish_alert': 'Publish Alert',

    // Categories
    'cat.accommodation': '住宿/空間',
    'cat.food_drink': '飲食',
    'cat.warmth_sleep': '保暖/寢具',
    'cat.hygiene': '個人護理',
    'cat.electronics': '電力/照明',
    'cat.medical': '醫療/行動',
    'cat.pets': '寵物',
    'cat.service': '服務',
    'cat.tools': '工具',
    'roles.volunteer': '義工',
    'roles.owner': '擁有者',

    // Items
    '住宿': '住宿', '暫住': '暫住', '宿位': '宿位', '庇護中心': '庇護中心', '休息處': '休息處',
    '食物': '食物', '飲品': '飲品', '樽裝水': '樽裝水', '乾糧': '乾糧', '杯麵': '杯麵', '熱食': '熱食', '能量棒': '能量棒', '湯水': '湯水', '罐頭': '罐頭', '餐具': '餐具', '飯盒': '飯盒', '紙杯': '紙杯',
    '保暖物資': '保暖物資', '毛巾': '毛巾', '毛氈': '毛氈', '被鋪': '被鋪', '被': '被', '褸': '褸', '襪': '襪', '暖包': '暖包', '睡袋': '睡袋', '枕頭': '枕頭', '地墊': '地墊', '露營帳篷': '露營帳篷',
    '牙刷': '牙刷', '牙膏': '牙膏', '口罩': '口罩', '豬咀': '豬咀', '濾罐': '濾罐', 'BB尿片': 'BB尿片', '成人尿片': '成人尿片', '清潔用品': '清潔用品', '沐浴露': '沐浴露', '洗頭水': '洗頭水', '濕紙巾': '濕紙巾', '紙巾': '紙巾', '一次性內衣褲': '一次性內衣褲', '拖鞋': '拖鞋', '衛生用品': '衛生用品',
    '叉電線': '叉電線', '尿袋': '尿袋', '火牛': '火牛', '拖板': '拖板', '電池': '電池', '電筒': '電筒', 'SIM Card': 'SIM Card',
    '急救': '急救', '急救包': '急救包', '輪椅': '輪椅',
    '寵物氧氣機': '寵物氧氣機', '寵物飛機籠': '寵物飛機籠', '寵物暫托家庭': '寵物暫托家庭', '貓糧': '貓糧', '狗糧': '狗糧',
    '獸醫服務': '獸醫服務', '寵物救援': '寵物救援',
    '看顧長者': '看顧長者', '兒童暫託': '兒童暫託', '心理支援': '心理支援', '洗澡設施': '洗澡設施', '洗手間': '洗手間', '水機': '水機', '廚房': '廚房',
    'Heat tech': 'Heat tech', '床墊': '床墊', 'N95': 'N95', '眼罩': '眼罩', '紅白藍膠袋': '紅白藍膠袋', '大聲公': '大聲公',

    // Validation
    'validation.enter_item': '請輸入品項名稱',
    'validation.no_category': '請先建立一個類別',
    'validation.already_exists': '該品項已存在',
    'validation.enter_category': '請輸入類別名稱'
  },
  en: {
    // Navigation & Common
    'nav.resident': 'Resident',
    'nav.resources': 'Resources',
    'nav.volunteer': 'Volunteer',
    'nav.logistics': 'Driver/Logistics',
    'nav.safety': 'Safety Info',
    'nav.links': 'Useful Links',
    'nav.my_stations': 'Station Management',
    'nav.me': 'Me',
    'btn.signin': 'Sign In',
    'btn.signout': 'Sign Out',
    'btn.dev_login': 'Dev Login',
    'btn.signin_google': 'Sign in with Google',
    'btn.signin_email': 'Sign in with email',
    'btn.cancel': 'Cancel',
    'btn.confirm': 'Confirm',
    'btn.submit': 'Submit',
    'btn.navigate': 'Navigate',
    'btn.message': 'Contact',
    'btn.claim': 'Accept Task',
    'btn.complete': 'Delivered',
    'btn.filter_items': 'Filter Items',
    'btn.apply': 'Apply',
    'btn.clear': 'Clear',
    'btn.reset': 'Reset',
    'btn.traffic': 'Traffic',
    'btn.select_all': 'Select All',
    'btn.deselect_all': 'Deselect All',
    'btn.back': 'Back',
    'btn.share': 'Share',
    'btn.add_item': 'Add Item',
    'btn.add_category': 'Add Category',
    'btn.add': 'Add',
    'btn.edit': 'Edit',
    'share.success': 'Link copied!',
    'sort.label': 'Sort',
    'sort.distance': 'Nearest',
    'sort.status': 'Status',
    'common.loading': 'Loading...',
    'station.not_found': 'Station Not Found',
    'station.delete_confirm': 'Are you sure you want to delete this station? This action cannot be undone.',
    'station.delete_success': 'Station deleted successfully.',
    'station.delete_error': 'Error deleting station.',
    'station.delete_need_confirm': 'Are you sure you want to delete this need?',
    'station.delete_need_success': 'Need deleted successfully.',
    'station.delete_need_error': 'Error deleting need.',
    'station.delete_offering_confirm': 'Are you sure you want to delete this offering?',
    'station.delete_offering_success': 'Offering deleted successfully.',
    'station.delete_offering_error': 'Error deleting offering.',
    'station.managed_station_id': 'Managed Station ID:',
    'station.login_to_view': 'Please login to view your stations',
    'station.edit_station': 'Edit Station',
    'btn.save': 'Save',
    'station.name': 'Station Name',
    'station.address_location': 'Address & Location',
    'station.use_current_location': 'Use Current Location',
    'station.hide_map': 'Hide Map',
    'station.pick_on_map': 'Pick on Map',
    'station.map_helper_text': '• Drag marker or click to set',
    'station.status': 'Status',
    'station.offerings_label': 'Offerings (What You Have)',
    'station.needs_label': 'Needs (What You Need)',
    'station.add_needs': 'Add Needs',
    'btn.save_changes': 'Save Changes',
    'station.manage_desc': 'Manage stations you own or coordinate',
    'station.no_owned_stations': "You don't own any stations yet",
    'station.create_station_prompt': 'Create a station to see it here',
    
    // Links View
    'links.desc': 'Community curated info & groups',
    'links.tg_title': 'Telegram Groups',
    'links.web_title': 'Related Websites',

    // Status
    'status.available': '🟢 Available',
    'status.low_stock': '🟡 Low Stock',
    'status.empty_closed': '🔴 Closed / Full',
    'status.closed': '🔴 Closed',
    'status.unverified': 'Unverified',
    'status.outdated': 'Unverified',

    // Crowd Status
    'crowd.low': 'Quiet',
    'crowd.medium': 'Moderate',
    'crowd.high': 'Busy',
    'crowd.full': '❌ Packed',

    // Station Types
    'type.all': 'All',
    'type.supply': 'Supply',
    'type.rest': 'Shelter',
    'type.pet_shelter': 'Pet Shelter',
    'type.food_distribution': 'Food/Meals',
    'type.medical': 'First Aid',
    'type.collection_point': 'Collection Hub',

    // Organizer
    'org.official': 'Gov',
    'org.ngo': 'NGO',
    'org.community': 'Community',

    // Station Card
    'card.updated_mins': ' mins ago',
    'card.updated_hours': ' hrs ago',
    'card.needs': 'Urgent Needs',
    'card.offerings': 'Available',
    'card.no_needs': 'No specific needs',
    'card.no_info': 'No info available',
    'card.report_outdated': 'Report Outdated',

    // Verification
    'verify.verified': 'Verified',
    'verify.source': 'Source',
    'verify.by_official': 'By Gov',
    'verify.by_admin': 'By Admin',
    'verify.by_community': 'By Community',

    // Resident View
    'res.search_placeholder': 'Search supplies, location...',
    'res.more_filters': 'Filters',
    'res.filter_pets': 'Pet Friendly',
    'res.filter_baby': 'Baby Friendly',
    'res.filter_wheelchair': 'Wheelchair',
    'res.filter_charging': 'Charging',
    'res.no_stations_map': 'No stations found nearby',
    'res.no_stations_list': 'No stations match your criteria.',
    'res.my_location': 'My Location',
    'res.filter_title': 'Filter by Supplies',
    'res.view_details': 'View Details',

    // Volunteer Hub
    'vol.title': 'Volunteer / Donate',
    'vol.add_station': 'Add Station',
    'vol.search_placeholder': 'Search needs (e.g. Water) or location...',
    'vol.urgent_only': 'Urgent Only',
    'vol.search_results': 'Results',
    'vol.no_results': 'No matching stations found',
    'vol.reset_filters': 'Reset Filters',
    'vol.login_alert': 'Please login to add a station.',
    'vol.filter_mode': 'Filter Mode',
    'vol.mode_needs': 'Station Needs (I want to donate)',
    'vol.mode_offerings': 'Station Offers (I am searching)',

    // Logistics View
    'log.title': 'Logistics & Driver Hub',
    'log.tab_hubs': 'Collection Points',
    'log.tab_tasks': 'Delivery Tasks',
    'log.no_hubs': 'No Collection Points found',
    'log.no_tasks': 'No delivery tasks available',
    'log.login_alert': 'Please login to accept tasks.',
    'task.from': 'Pickup From',
    'task.to': 'Deliver To',
    'task.items': 'Cargo',
    'task.status_pending': 'Pending',
    'task.status_in_progress': 'In Progress',
    'task.status_completed': 'Completed',
    'task.posted': 'Posted',

    // Add Station Modal
    'add.title': 'Add New Station',
    'add.name': 'Station Name',
    'add.address': 'Address',
    'add.lat': 'Latitude',
    'add.lng': 'Longitude',
    'add.use_location': 'Use Current Location',
    'add.location_error': 'Failed to get location',
    'add.location_required': 'Please enter valid coordinates or use current location',
    'add.locating': 'Locating...',
    'add.type': 'Type',
    'add.contact': 'Contact Number',
    'add.contact_link': 'Contact Link (Telegram/IG)',
    'add.source_url': 'Source/Proof URL',
    'add.needs': 'Urgent Needs',
    'add.offerings': 'Offerings',
    'add.photo': 'Photo',
    'add.opening_hours': 'Opening Hours',
    'add.other_info': 'Other Info',
    'add.success': 'Station added successfully!',
    'add.error': 'Error adding station.',
    'add.placeholder_name': 'e.g. Mong Kok Temporary Station',
    'add.placeholder_address': 'e.g. 22 Sai Yeung Choi St',
    'add.placeholder_contact': 'Optional',
    'add.placeholder_contact_link': 'e.g. https://t.me/group',
    'add.placeholder_source': 'e.g. https://t.me/channel/1234',
    'add.placeholder_needs': 'e.g. Water, Bread, Diapers',
    'add.placeholder_offerings': 'e.g. Charging, Rest Area',

    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.or': 'Or',
    'auth.signup': 'Sign up',

    // Me / Saved
    'me.title': 'Me',
    'me.saved_stations': 'Saved Stations',
    'me.my_stations': 'My Stations',
    'me.no_saved': 'No saved stations',
    'me.login_desc': 'Login to manage profile and access more features',

    // Manage Members Modal
    'manage_members.title': 'Manage Members',
    'manage_members.owners': 'Owners',
    'manage_members.volunteers': 'Volunteers',
    'manage_members.add_title': 'Add Member',
    'manage_members.email_placeholder': 'Enter user email',

    // Auth & Others
    'auth.login_vote_alert': 'Please login to vote.',
    'badge.admin': 'ADMIN',
    'footer.origin': 'Origin:',
    'auth.dev_login': 'Dev Login',

    // Admin
    'admin.global_alert_broadcast': 'Global Alert Broadcast',
    'admin.alert_placeholder': 'Enter alert message...',
    'admin.publish_alert': 'Publish Alert',

    // Categories
    'cat.accommodation': 'Accommodation',
    'cat.food_drink': 'Food & Drink',
    'cat.warmth_sleep': 'Warmth & Sleep',
    'cat.hygiene': 'Hygiene',
    'cat.electronics': 'Electronics',
    'cat.medical': 'Medical',
    'cat.pets': 'Pets',
    'cat.service': 'Service',
    'cat.tools': 'Tools',
    'roles.volunteer': 'Volunteer',
    'roles.owner': 'Owner',

    // Items (Translations)
    '住宿': 'Accommodation', '暫住': 'Temp Stay', '宿位': 'Shelter Space', '庇護中心': 'Shelter Center', '休息處': 'Rest Area',
    '食物': 'Food', '飲品': 'Drinks', '樽裝水': 'Bottled Water', '乾糧': 'Dry Food', '杯麵': 'Cup Noodles', '熱食': 'Hot Food', '能量棒': 'Energy Bar', '湯水': 'Soup', '罐頭': 'Canned Food', '餐具': 'Utensils', '飯盒': 'Meal Box', '紙杯': 'Paper Cups',
    '保暖物資': 'Warmth Supplies', '毛巾': 'Towel', '毛氈': 'Blanket', '被鋪': 'Bedding', '被': 'Quilt', '褸': 'Jacket', '襪': 'Socks', '暖包': 'Heat Pack', '睡袋': 'Sleeping Bag', '枕頭': 'Pillow', '地墊': 'Mat', '露營帳篷': 'Tent',
    '牙刷': 'Toothbrush', '牙膏': 'Toothpaste', '口罩': 'Masks', '豬咀': 'Gas Mask / Respirator', '濾罐': 'Filter Canister', 'BB尿片': 'Baby Diapers', '成人尿片': 'Adult Diapers', '清潔用品': 'Cleaning Supplies', '沐浴露': 'Body Wash', '洗頭水': 'Shampoo', '濕紙巾': 'Wet Wipes', '紙巾': 'Tissues', '一次性內衣褲': 'Disposable Underwear', '拖鞋': 'Slippers', '衛生用品': 'Hygiene Products',
    '叉電線': 'Charging Cable', '尿袋': 'Power Bank', '火牛': 'Adapter', '拖板': 'Power Strip', '電池': 'Batteries', '電筒': 'Flashlight', 'Sim Card': 'Sim Card',
    '急救': 'First Aid', '急救包': 'First Aid Kit', '輪椅': 'Wheelchair', 
    '寵物氧氣機': 'Pet Oxygen Machine', '寵物飛機籠': 'Pet Crate', '寵物暫托家庭': 'Pet Foster Family', '貓糧': 'Cat Food', '狗糧': 'Dog Food',
    '獸醫服務': 'Vet Service', '寵物救援': 'Pet Rescue',
    '看顧長者': 'Elderly Care', '兒童暫託': 'Child Care', '心理支援': 'Psychological Support', '洗澡設施': 'Shower Facilities', '洗手間': 'Restroom', '水機': 'Water Dispenser', '廚房': 'Kitchen',
    'Heat tech': 'Heat tech', '床墊': 'Mattress', 'N95': 'N95', '眼罩': 'Eye mask', '紅白藍膠袋': 'Jumbo bag', '大聲公': 'Megaphone',

    // Validation
    'validation.enter_item': 'Please enter an item name',
    'validation.no_category': 'Please create a category first',
    'validation.already_exists': 'This item already exists',
    'validation.enter_category': 'Please enter a category name'
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};