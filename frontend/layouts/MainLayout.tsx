import React, { useMemo } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../types';
import { Map, Link, User, Home, HandHeart, Truck, Shield, LogOut, Zap, Globe, Bell, Users } from 'lucide-react';
import { getGlobalAlert } from '../services/dataService';
import { useState, useEffect } from 'react';

const TopBar = () => {
    const { user, login, logout } = useAuth();
    const { language, setLanguage } = useLanguage();

    return (
        <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm z-[1100] relative">
             <div className="flex items-center space-x-3">
                <button 
                    onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                    className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold transition"
                >
                    <Globe size={14} />
                    <span>{language === 'zh' ? 'EN / 中' : '中 / EN'}</span>
                </button>
             </div>
             <div>
                {user ? (
                    <div className="flex items-center space-x-3">
                        {user.role === UserRole.ADMIN && (
                            <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                                <Shield size={10} className="mr-1"/>ADMIN
                            </span>
                        )}
                        {user.role === UserRole.STATION_MANAGER && (
                            <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                                <Users size={10} className="mr-1"/>LEAD
                            </span>
                        )}
                        {user.role === UserRole.DRIVER && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                                <Truck size={10} className="mr-1"/>DRIVER
                            </span>
                        )}
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <button onClick={logout} className="text-gray-400 hover:text-red-500">
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={login}
                            className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full border border-gray-300 transition"
                            title="Login with Google"
                        >
                            <Zap size={14} className="mr-1 text-orange-500"/>
                            Login with Google
                        </button>
                    </div>
                )}
             </div>
        </div>
    );
}

const GlobalAlertBanner = () => {
    const [alertMsg, setAlertMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlert = async () => {
            const msg = await getGlobalAlert();
            setAlertMsg(msg);
        };
        fetchAlert();
        
        // Poll for updates
        const interval = setInterval(fetchAlert, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!alertMsg) return null;

    return (
        <div className="bg-red-600 text-white text-sm font-bold p-2 text-center flex items-center justify-center animate-in slide-in-from-top">
            <Bell size={16} className="mr-2 animate-pulse" />
            <span>{alertMsg}</span>
        </div>
    );
}

export const MainLayout = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const bottomNavLinks = useMemo(() => {
        let links = [];

        if (!user) {
            links = [
                { path: '/', label: t('nav.resident'), icon: <Map size={24} /> },
                { path: '/links', label: t('nav.links'), icon: <Link size={24} /> },
                { path: '/me', label: t('nav.me'), icon: <User size={24} /> },
            ];
            return links;
        }

        switch (user.role) {
            case UserRole.ADMIN:
                links.push({ path: '/admin/dashboard', label: 'Admin', icon: <Shield size={24} /> });
                links.push({ path: '/manager/stations', label: t('nav.my_stations'), icon: <Home size={24} /> });
                links.push({ path: '/volunteer/hub', label: t('nav.volunteer'), icon: <HandHeart size={24} /> });
                links.push({ path: '/driver/tasks', label: t('nav.logistics'), icon: <Truck size={24} /> });
                break;
            case UserRole.STATION_MANAGER:
                links.push({ path: '/manager/stations', label: t('nav.my_stations'), icon: <Home size={24} /> });
                links.push({ path: '/volunteer/hub', label: t('nav.volunteer'), icon: <HandHeart size={24} /> });
                break;
            case UserRole.DRIVER:
                links.push({ path: '/driver/tasks', label: t('nav.logistics'), icon: <Truck size={24} /> });
                links.push({ path: '/volunteer/hub', label: t('nav.volunteer'), icon: <HandHeart size={24} /> });
                break;
            case UserRole.VOLUNTEER:
                links.push({ path: '/volunteer/hub', label: t('nav.volunteer'), icon: <HandHeart size={24} /> });
                break;
            case UserRole.RESIDENT:
            default:
                links.push({ path: '/', label: t('nav.resident'), icon: <Map size={24} /> });
                break;
        }
        
        links.push({ path: '/links', label: t('nav.links'), icon: <Link size={24} /> });
        links.push({ path: '/me', label: t('nav.me'), icon: <User size={24} /> });

        return links;
    }, [user, t]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
             <TopBar />
             <GlobalAlertBanner />
             <div className="flex-1 max-w-lg mx-auto w-full bg-gray-50 min-h-screen shadow-2xl relative pb-16">
                 <Outlet />
             </div>
             {/* Bottom Navigation */}
             <div id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                 <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                     {bottomNavLinks.map((link) => (
                         <NavLink 
                             key={link.path} 
                             to={link.path} 
                             className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             {link.icon}
                             <span className="text-[10px] font-medium">{link.label}</span>
                         </NavLink>
                     ))}
                 </div>
             </div>
        </div>
    );
};
