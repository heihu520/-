
import React, { useState, useEffect } from 'react';
import { AppMode, ModelId, MODELS, Session } from './types';
import { ChatInterface } from './components/ChatInterface';
import { VisionInterface } from './components/VisionInterface';
import { AboutModal } from './components/AboutModal';
import { MessageSquare, Image, Zap, Menu, X, Info, MapPin, Globe, Activity, Loader2, Wifi, Plus, Trash2, MessageCircle } from 'lucide-react';
import { api } from './services/apiService';

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
  
  // Session State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Load Sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    const data = await api.getSessions();
    setSessions(data);
    setIsLoadingSessions(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null); // Null ID means "New Chat State"
    setMode(AppMode.CHAT);
    if(window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setMode(AppMode.CHAT);
    if(window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个会话吗？')) {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
    }
  };

  // Callback when ChatInterface creates a session automatically
  const onSessionCreated = (newSession: Session) => {
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // Location Fetching (Existing Logic)
  useEffect(() => {
    const fetchLocation = async () => {
      setLoadingLocation(true);
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
      // Fallbacks skipped for brevity, keeping simple logic here for update
      setLoadingLocation(false);
    };
    fetchLocation();
  }, []);

  const NavItem = ({ targetMode, icon: Icon, label, active }: { targetMode?: AppMode, icon: any, label: string, active?: boolean }) => (
    <button
      onClick={() => {
        if(targetMode) setMode(targetMode);
        setIsMobileMenuOpen(false);
      }}
      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
        active || (targetMode && mode === targetMode && !currentSessionId && targetMode !== AppMode.CHAT)
          ? 'bg-white/60 text-blue-600 shadow-sm border border-white/40'
          : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />
      )}
      <Icon size={18} className={`z-10 transition-transform duration-300 ${active ? "text-blue-500 scale-110" : "group-hover:scale-110"}`} />
      <span className="z-10 font-medium tracking-wide truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden text-slate-700 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-80 flex-col border-r border-white/40 bg-white/40 backdrop-blur-3xl z-20 shadow-[5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/50">
              <Zap size={22} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Gemini Nexus</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider">PRO PREVIEW</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 justify-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 mb-4 font-medium"
            >
              <Plus size={18} /> 新建对话
            </button>
            <NavItem targetMode={AppMode.VISION} icon={Image} label="视觉分析" active={mode === AppMode.VISION} />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">历史记录</div>
          {isLoadingSessions ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">暂无历史记录</div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-transparent ${
                  currentSessionId === session.id 
                    ? 'bg-white/60 shadow-sm border-white/40' 
                    : 'hover:bg-white/30 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={currentSessionId === session.id ? 'text-blue-500' : 'text-slate-400'} />
                  <span className={`text-sm truncate ${currentSessionId === session.id ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                    {session.title}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-auto p-6 space-y-4 bg-white/20 backdrop-blur-sm border-t border-white/20">
           {/* Simple Location Display */}
           {location && (
             <div className="flex items-center justify-between text-xs text-slate-500">
               <div className="flex items-center gap-1.5">
                 <Globe size={12} />
                 <span>{location.city}</span>
               </div>
               <span className="font-mono opacity-70">{location.ip}</span>
             </div>
           )}

          <button 
            onClick={() => setIsAboutOpen(true)}
            className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Info size={16} /> 关于项目
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-2xl border-b border-white/20 z-50 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
           <Zap size={20} className="text-blue-600" />
           <span className="font-bold tracking-wide text-slate-800">Nexus</span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-slate-600 hover:bg-black/5 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/90 backdrop-blur-3xl pt-24 px-6 animate-fade-in flex flex-col h-full pb-10">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 justify-center py-3 bg-blue-600 text-white rounded-xl shadow-lg mb-6"
          >
            <Plus size={18} /> 新建对话
          </button>
          
          <div className="space-y-2 mb-6">
             <NavItem targetMode={AppMode.VISION} icon={Image} label="视觉分析" active={mode === AppMode.VISION} />
          </div>

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">历史记录</div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {sessions.map(session => (
              <button 
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`w-full text-left p-3 rounded-lg text-sm truncate ${currentSessionId === session.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 bg-white/50'}`}
              >
                {session.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        {mode === AppMode.CHAT ? (
          <ChatInterface 
            selectedModel={selectedModel} 
            onModelChange={setSelectedModel} 
            sessionId={currentSessionId}
            onSessionCreated={onSessionCreated}
            refreshSessions={loadSessions}
          />
        ) : (
          <VisionInterface selectedModel={selectedModel} onModelChange={setSelectedModel} />
        )}
      </main>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
