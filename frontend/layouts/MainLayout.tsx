import React, { useMemo } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../services/apiClient';
import { UserRole } from '../types';
import { Map, Link, User, Home, HandHeart, Truck, Shield, LogOut, Zap, Globe, Bell, Users } from 'lucide-react';
import { getGlobalAlert } from '../services/dataService';
import { fetchSheetData, getSheetGlobalAlert } from '../services/sheetService';
import { useState, useEffect } from 'react';

const TopBar = () => {
    const { user, login, logout, currentRole, isLoggedIn, setPreLoginRole, effectiveRole, refreshUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { showToast } = useToast();

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
                 <div className="flex items-center gap-3">
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
                {/* Role switching is handled in the MeView profile page now */}
             </div>
        </div>
    );
}

const GlobalAlertBanner = () => {
    const [serverAlert, setServerAlert] = useState<string | null>(null);
    const [sheetAlert, setSheetAlert] = useState<string | null>(null);
    const { user, currentRole, isLoggedIn, effectiveRole } = useAuth();

    // Refs and state for scrolling behavior
    const serverContainerRef = React.useRef<HTMLDivElement | null>(null);
    const serverTextRef = React.useRef<HTMLSpanElement | null>(null);
    const sheetContainerRef = React.useRef<HTMLDivElement | null>(null);
    const sheetTextRef = React.useRef<HTMLSpanElement | null>(null);
    const [serverScrolling, setServerScrolling] = useState(false);
    const [serverDuration, setServerDuration] = useState(10);
    const [sheetScrolling, setSheetScrolling] = useState(false);
    const [sheetDuration, setSheetDuration] = useState(10);
    // gap in px between end of message and next loop
    const [serverGap, setServerGap] = useState(80);
    const [sheetGap, setSheetGap] = useState(80);
    const serverTextContainerRef = React.useRef<HTMLDivElement | null>(null);
    const sheetTextContainerRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchAlerts = async () => {
            const srv = await getGlobalAlert();
            // Trim both ends and remove leading whitespace
            setServerAlert(srv ? srv.trimStart() : null);
            // Check sheet alert; if not loaded, call fetchSheetData to ensure it's populated
            let sheetMsg = getSheetGlobalAlert();
            if (sheetMsg) sheetMsg = sheetMsg.trimStart();
            if (!sheetMsg) {
                try {
                    await fetchSheetData();
                    sheetMsg = getSheetGlobalAlert();
                } catch (e) {
                    console.warn('Failed to fetch sheet for alerts', e);
                }
            }
            setSheetAlert(sheetMsg || null);
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    // Recompute scrolling when messages change or window is resized
    React.useEffect(() => {
        const calc = (container: HTMLDivElement | null, text: HTMLElement | null, setScrolling: (v: boolean) => void, setDuration: (n: number) => void, gap: number) => {
            if (!container || !text) return;
            // Ensure paddingRight applied before measuring scrollWidth so scrollWidth includes the gap.
            text.style.paddingRight = `${gap}px`;
            const containerWidth = container.clientWidth;
            const textWidth = text.scrollWidth;
            if (textWidth > containerWidth) {
                setScrolling(true);
                // Duration proportional to length; speed ~ 60px/s + base
                const speed = 60; // px per second
                const duration = Math.max(6, (containerWidth + textWidth + gap) / speed);
                setDuration(duration);
                // ensure the text has padding on the right to create spacing between loops
                // padding already assigned above
            } else {
                setScrolling(false);
                text.style.paddingRight = '0px';
            }
        };

        const handle = () => {
            calc(serverTextContainerRef.current, serverTextRef.current, setServerScrolling, setServerDuration, serverGap);
            calc(sheetTextContainerRef.current, sheetTextRef.current, setSheetScrolling, setSheetDuration, sheetGap);
        };

        // Run immediately after DOM update to calculate scrolling
        handle();
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, [serverAlert, sheetAlert]);

    // Show to people who either are logged-in non-residents, or selected a pre-login non-resident role.
    // If we have a logged-in user, show only when not a resident; if no logged-in user, show only when pre-login role exists and is non-resident.
    const preLoginRole = currentRole; // currentRole returns preLogin role for unauthenticated users
    const preLoginIsResident = preLoginRole === UserRole.RESIDENT;
    // Use effectiveRole from AuthContext
    // If effectiveRole is resident, hide banner. Otherwise show
    if (!effectiveRole || effectiveRole === UserRole.RESIDENT) return null;
    if (!serverAlert && !sheetAlert) return null;

    return (
        <>
            {serverAlert && (
                <div ref={serverContainerRef} role="status" aria-live="assertive" className="bg-red-600 text-white text-sm font-bold p-2 text-center flex items-center h-10 animate-in slide-in-from-top">
                    <Bell size={16} className="mr-2 animate-pulse flex-shrink-0" style={{ color: '#fff' }} />
                    <div ref={serverTextContainerRef} className="flex-1 overflow-hidden whitespace-nowrap">
                        <span
                            ref={serverTextRef}
                            className={`inline-block text-white`}
                            style={serverScrolling ? { display: 'inline-block', transform: 'translateX(0)', animation: `marquee ${serverDuration}s linear infinite` } : {}}
                        >
                            {serverAlert}
                        </span>
                    </div>
                </div>
            )}
            {sheetAlert && (
                <div ref={sheetContainerRef} role="status" aria-live="polite" className="bg-yellow-400 text-gray-900 text-sm font-bold p-2 text-center flex items-center h-10 animate-in slide-in-from-top">
                    <Bell size={16} className="mr-2 flex-shrink-0 text-[#5A3A00]" style={{ color: '#5A3A00' }} />
                    <div ref={sheetTextContainerRef} className="flex-1 overflow-hidden whitespace-nowrap">
                        <span
                            ref={sheetTextRef}
                            className={`inline-block text-[#5A3A00]`}
                            style={sheetScrolling ? { display: 'inline-block', transform: 'translateX(0)', animation: `marquee ${sheetDuration}s linear infinite` } : {}}
                        >
                            {sheetAlert}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}

export const MainLayout = () => {
    const { user, currentRole, isLoggedIn, effectiveRole } = useAuth();
    const { t } = useLanguage();
    
    const bottomNavLinks = useMemo(() => {
        let links = [];
        // Use `effectiveRole` from AuthContext

        if (!isLoggedIn && !effectiveRole) {
            links = [
                { path: '/', label: t('nav.resident'), icon: <Map size={24} /> },
                { path: '/links', label: t('nav.links'), icon: <Link size={24} /> },
                { path: '/me', label: t('nav.me'), icon: <User size={24} /> },
            ];
            return links;
        }

        switch (effectiveRole) {
            case UserRole.ADMIN:
                links.push({ path: '/admin/users', label: 'Users', icon: <Users size={24} /> });
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
    }, [user, t, effectiveRole]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
             <TopBar />
             <GlobalAlertBanner />
            <style>{`@keyframes marquee { 0% { transform: translateX(0); } 80% { transform: translateX(-100%); } 100% { transform: translateX(-100%); } }`}</style>
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
