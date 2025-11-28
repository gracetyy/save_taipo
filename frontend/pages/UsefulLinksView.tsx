
import { ExternalLink, MessageCircle, Globe, ShieldAlert, Truck, Heart, Users, Flame, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const UsefulLinksView = () => {
    const { t } = useLanguage();

    const tgGroups = [
        { name: '即時大埔火災緊貼時事資訊及救援', url: 'https://t.me/Taipohelper', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
        { name: '大埔物資救援組', url: 'https://t.me/+7PObuQ5xWiI2ZGFl', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
        { name: '大埔宏福苑火災資料連結整合', url: 'https://t.me/taipolink', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
        { name: '外區要車可去呢度', url: 'https://t.me/+eZU1LSsOI9w0YjE9', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: '大埔救援 註冊社工', url: 'https://t.me/+vuGgtnjG1RFlMWQ1', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
        { name: '大埔救援 保暖物資', url: 'https://t.me/+rD2pJFnFnBswNjhl', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
        { name: '大埔救援 食物飲品', url: 'https://t.me/+KbJF_gjyBAUzMzJl', icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-50' },
        { name: '大埔救援 步兵組', url: 'https://t.me/+C5xoHzMFGFZlM2Jl', icon: Users, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { name: '大埔救援 車手組', url: 'https://t.me/+D726KaBxHKA2YjQ1', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { name: '大埔救援 情緒支援', url: 'https://t.me/+4pazW1aPYDc1Y2E1', icon: Heart, color: 'text-teal-500', bg: 'bg-teal-50' },
    ];

    const websites = [
        { name: '宏福苑報平安', url: 'https://taipo-fire.web.app/'},
        { name: '大埔火災全港資源整合', url: 'https://opaque-laundry-ab5.notion.site/2b797bbbedf88061b0b3f8970b8642a7?source%EF%BF%BC'},
        { name: '大埔宏福邨大火支援服務（總表）', url: 'https://docs.google.com/spreadsheets/d/1AnwUGMWTyfpIWZ9FJClav6Qhj_SVVKtgwC5_ttrAsRI/edit?usp=sharing'},
        { name: '大埔宏福苑互助站', url: 'https://wangfuk-fire-sos.netlify.app/'},
        { name: '宏福苑火災援助平台', url: 'https://wang-fuk-connect.lovable.app/'},
        { name: '大埔宏福苑緊急資源簿', url: 'https://v0-emergency-resource-app-neon.vercel.app/'},
        { name: '宏福苑消息', url: 'https://blaze-info.vercel.app/'},
        { name: '香港火災救援信息聚合平台', url: 'https://telegram-rescue-3bhcgua4.manus.space/'},
        { name: '大埔宏福苑協尋與救助平台', url: 'https://taipo1126.com/volunteer/tasks?brid=LsIpilOE9-hSWQw_heN91Q'},
    ];

    const resident_websites = [
        { name: '宏福苑報平安', url: 'https://taipo-fire.web.app/'},
        { name: '大埔火災全港150+資源整合', url: 'https://opaque-laundry-ab5.notion.site/2b797bbbedf88061b0b3f8970b8642a7'},
        { name: '大埔宏福邨大火支援服務（總表）', url: 'https://docs.google.com/spreadsheets/d/1AnwUGMWTyfpIWZ9FJClav6Qhj_SVVKtgwC5_ttrAsRI/edit?usp=sharing'},
        { name: '大埔宏福苑互助站', url: 'https://wangfuk-fire-sos.netlify.app/'},
        { name: '宏福苑火災援助平台', url: 'https://wang-fuk-connect.lovable.app/'},
        { name: '大埔宏福苑緊急資源簿', url: 'https://v0-emergency-resource-app-neon.vercel.app/'},
        { name: '宏福苑消息', url: 'https://blaze-info.vercel.app/'},
        { name: '宏福苑火警尋親庇護中心即時名單', url: 'https://tai-po-wangfuk-fire-family-search.vercel.app/'},
        { name: '緊急寵物救援平台', url: 'https://taipofire-petrescue.vercel.app/#/'},
        ];

    const volunteer_websites = [
        { name: '宏福苑報平安', url: 'https://taipo-fire.web.app/'},
        { name: '大埔火災全港150+資源整合', url: 'https://opaque-laundry-ab5.notion.site/2b797bbbedf88061b0b3f8970b8642a7'},
        { name: '大埔宏福邨大火支援服務（總表）', url: 'https://docs.google.com/spreadsheets/d/1AnwUGMWTyfpIWZ9FJClav6Qhj_SVVKtgwC5_ttrAsRI/edit?usp=sharing'},
        { name: '物資供應總覽', url: 'https://docs.google.com/spreadsheets/d/1W8A40TCVAY5prHNyVk-TqdSv2EumkVvN9l7LoUrY8-w/edit?gid=0#gid=0'},
        { name: '大埔火災物資點算組', url: 'https://docs.google.com/forms/d/e/1FAIpQLSe_9mEGHylYbvnvhMnrZ_7WuIzG9CDVSzj5FZ1jkBHIs8dWlQ/viewform'},
        { name: '大埔物資供應總覽', url: 'https://cswbrian.github.io/help-taipo/'},
        { name: '大埔宏福苑互助站', url: 'https://wangfuk-fire-sos.netlify.app/'},
        { name: '宏福苑火災援助平台', url: 'https://wang-fuk-connect.lovable.app/'},
        { name: '大埔宏福苑緊急資源簿', url: 'https://v0-emergency-resource-app-neon.vercel.app/'},
        { name: '宏福苑消息', url: 'https://blaze-info.vercel.app/'},
        { name: '香港火災救援信息聚合平台', url: 'https://telegram-rescue-3bhcgua4.manus.space/'},
        { name: '大埔宏福苑協尋與救助平台', url: 'https://taipo1126.com/volunteer/tasks?brid=LsIpilOE9-hSWQw_heN91Q'},
        { name: '宏福苑消息', url: 'https://blaze-info.vercel.app/'},
        { name: '宏福苑火警尋親庇護中心即時名單', url: 'https://tai-po-wangfuk-fire-family-search.vercel.app/'},
        { name: '緊急寵物救援平台', url: 'https://taipofire-petrescue.vercel.app/#/'},
        { name: '災害訊息查證', url: 'https://tai-po-msg-frontend-fcw9.vercel.app/'},
        { name: '直播監控 (HOY/TVB/ANN/HK01)', url: 'https://cslfelix.github.io/hknews/'},
    ];

    return (
        <div className="pb-24 min-h-screen bg-white">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-50 p-4 border-b">
                <h1 className="text-xl font-bold">{t('nav.links')}</h1>
            </div>

            <div className="p-4 space-y-6">
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <MessageCircle size={16} className="mr-2" />
                        {t('links.tg_title')}
                    </h2>
                    <div className="grid gap-3">
                        {tgGroups.map((group, idx) => (
                            <a 
                                key={idx} 
                                href={group.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition active:scale-[0.99] bg-white"
                            >
                                <div className={`p-2 rounded-full ${group.bg} ${group.color} mr-3 shrink-0`}>
                                    <group.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 text-sm truncate">{group.name}</div>
                                    <div className="text-xs text-blue-500 truncate">Telegram Group</div>
                                </div>
                                <ExternalLink size={16} className="text-gray-300 ml-2 shrink-0" />
                            </a>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <Globe size={16} className="mr-2" />
                        {t('links.web_title')}
                    </h2>
                    <div className="grid gap-3">
                         {websites.map((site, idx) => (
                            <a 
                                key={idx} 
                                href={site.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition bg-gradient-to-br from-white to-gray-50 active:scale-[0.99]"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900">{site.name}</h3>
                                    <ExternalLink size={16} className="text-gray-400" />
                                </div>
                                <div className="text-[10px] text-blue-600 truncate bg-blue-50 px-2 py-1 rounded inline-block max-w-full">
                                    {site.url}
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                <div className="p-4 bg-gray-50 rounded-lg border text-center">
                    <Info size={24} className="mx-auto text-gray-400 mb-2"/>
                    <p className="text-xs text-gray-500">
                        以上連結由社區提供，內容與本平台無關。<br/>
                        Links are provided by the community.
                    </p>
                </div>
            </div>
        </div>
    );
};
