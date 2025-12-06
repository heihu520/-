
import React, { useState, useEffect } from 'react';
import { AppMode, ModelId, MODELS } from './types';
import { ChatInterface } from './components/ChatInterface';
import { VisionInterface } from './components/VisionInterface';
import { AboutModal } from './components/AboutModal';
import { MessageSquare, Image, Zap, Menu, X, Info, MapPin, Globe, Activity, Loader2, Wifi } from 'lucide-react';

interface UserLocation {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
  org: string;
}

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-3-pro-preview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  useEffect(() => {
    const fetchLocation = async () => {
      setLoadingLocation(true);
      
      // Helper to try fetching from a URL
      const tryFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return await res.json();
        } catch (e) {
          console.warn(`Failed to fetch from ${url}`, e);
          return null;
        }
      };

      // Strategy 1: ipwho.is (No auth, robust)
      let data = await tryFetch('https://ipwho.is/');
      if (data && data.success) {
        setLocation({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country_name: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          org: data.connection?.org || data.org || 'Unknown'
        });
        setLoadingLocation(false);
        return;
      }

      // Strategy 2: ipapi.co (Fallback)
      data = await tryFetch('https://ipapi.co/json/');
      if (data && data.ip) {
        setLocation({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country_name: data.country_name,
          latitude: data.latitude,
          longitude: data.longitude,
          org: data.org || 'Unknown'
        });
        setLoadingLocation(false);
        return;
      }

      // Strategy 3: ipinfo.io (Limited free tier)
      data = await tryFetch('https://ipinfo.io/json');
      if (data && data.ip) {
        const [lat, lon] = (data.loc || "0,0").split(',');
        setLocation({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country_name: data.country,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          org: data.org || 'Unknown'
        });
        setLoadingLocation(false);
        return;
      }

      // All failed
      setLoadingLocation(false);
    };

    fetchLocation();
  }, []);

  const NavItem = ({ targetMode, icon: Icon, label }: { targetMode: AppMode, icon: any, label: string }) => (
    <button
      onClick={() => {
        setMode(targetMode);
        setIsMobileMenuOpen(false);
      }}
      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
        mode === targetMode
          ? 'bg-white/60 text-blue-600 shadow-sm border border-white/40'
          : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
      }`}
    >
      {mode === targetMode && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />
      )}
      <Icon size={18} className={`z-10 transition-transform duration-300 ${mode === targetMode ? "text-blue-500 scale-110" : "group-hover:scale-110"}`} />
      <span className="z-10 font-medium tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden text-slate-700 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar - Desktop (Light Deep Acrylic Style) */}
      <aside className="hidden md:flex w-80 flex-col border-r border-white/40 bg-white/40 backdrop-blur-3xl z-20 shadow-[5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/50">
              <Zap size={22} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">
                Gemini Nexus
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider">PRO PREVIEW</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <NavItem targetMode={AppMode.CHAT} icon={MessageSquare} label="AI 对话" />
            <NavItem targetMode={AppMode.VISION} icon={Image} label="视觉分析" />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          
          {/* User Location Info Card */}
          <div className="mx-2 p-4 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md shadow-sm transition-all hover:shadow-md group min-h-[140px] flex flex-col justify-between">
             <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 pb-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">网络节点</span>
                </div>
                {loadingLocation ? (
                  <Loader2 size={12} className="animate-spin text-slate-400" />
                ) : (
                   <div className={`w-1.5 h-1.5 rounded-full ${location ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500'} animate-pulse`} />
                )}
             </div>
             
             {loadingLocation ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                   <Loader2 size={20} className="animate-spin opacity-50" />
                   <span className="text-xs">定位中...</span>
                </div>
             ) : location ? (
               <div className="space-y-2.5 animate-fade-in">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-400">IP 地址</span>
                   <span className="font-mono text-slate-700 font-medium bg-white/40 px-1.5 py-0.5 rounded border border-white/50">{location.ip}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-400">地区</span>
                   <span className="text-slate-700 text-right font-medium max-w-[120px] truncate" title={`${location.city}, ${location.country_name}`}>
                     {location.city}, {location.country_name}
                   </span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-400">坐标</span>
                   <span className="font-mono text-slate-600">
                     {location.latitude?.toFixed(2)}, {location.longitude?.toFixed(2)}
                   </span>
                 </div>
                 {location.org && (
                   <div className="pt-1 border-t border-slate-200/50">
                     <span className="text-[10px] text-slate-400 block truncate text-center mt-1" title={location.org}>{location.org}</span>
                   </div>
                 )}
               </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                   <Wifi size={20} className="opacity-50" />
                   <span className="text-xs">无法获取位置信息</span>
                </div>
             )}
          </div>

          {/* System Status Card */}
          <div className="mx-2 p-4 rounded-2xl bg-white/40 border border-white/40 backdrop-blur-md shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">系统就绪</span>
             </div>
             <p className="text-xs text-slate-500 truncate flex items-center justify-between">
               <span>当前模型</span>
               <span className="font-medium text-slate-700 bg-white/50 px-1.5 py-0.5 rounded text-[10px] border border-white/30">
                 {MODELS.find(m => m.id === selectedModel)?.tag}
               </span>
             </p>
          </div>

          <button 
            onClick={() => setIsAboutOpen(true)}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <Info size={18} className="group-hover:text-blue-500 transition-colors" />
            <span className="font-medium">关于项目</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header (Light Deep Glass) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-2xl border-b border-white/20 z-50 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
           <Zap size={20} className="text-blue-600" />
           <span className="font-bold tracking-wide text-slate-800">Gemini Nexus</span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-slate-600 hover:bg-black/5 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/90 backdrop-blur-3xl pt-24 px-6 animate-fade-in flex flex-col">
          <nav className="space-y-4">
            <NavItem targetMode={AppMode.CHAT} icon={MessageSquare} label="AI 对话" />
            <NavItem targetMode={AppMode.VISION} icon={Image} label="视觉分析" />
            
            {/* Mobile Location Info */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe size={12} /> 网络信息
              </h3>
              {loadingLocation ? (
                 <div className="text-xs text-slate-500 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> 定位中...</div>
              ) : location ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-500">IP: <span className="text-slate-800 font-mono">{location.ip}</span></div>
                  <div className="text-slate-500">Loc: <span className="text-slate-800">{location.city}</span></div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">无法获取位置</div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <button 
                onClick={() => {
                  setIsAboutOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-black/5"
              >
                <Info size={20} />
                <span className="font-medium">关于项目</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        {mode === AppMode.CHAT ? (
          <ChatInterface selectedModel={selectedModel} onModelChange={setSelectedModel} />
        ) : (
          <VisionInterface selectedModel={selectedModel} onModelChange={setSelectedModel} />
        )}
      </main>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
