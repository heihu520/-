import React, { useState } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { VisionInterface } from './components/VisionInterface';
import { MessageSquare, Image, Zap, Menu, X, Github } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const NavItem = ({ targetMode, icon: Icon, label }: { targetMode: AppMode, icon: any, label: string }) => (
    <button
      onClick={() => {
        setMode(targetMode);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        mode === targetMode
          ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={mode === targetMode ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-nexus-700 bg-nexus-900/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-tr from-accent to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Gemini Nexus
            </h1>
          </div>
          
          <nav className="space-y-2">
            <NavItem targetMode={AppMode.CHAT} icon={MessageSquare} label="AI 对话" />
            <NavItem targetMode={AppMode.VISION} icon={Image} label="视觉分析" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-nexus-700">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-nexus-800/50 border border-nexus-700 text-sm text-gray-400">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="truncate">系统运行正常</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-nexus-900/90 backdrop-blur border-b border-nexus-700 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
           <Zap size={20} className="text-accent" />
           <span className="font-bold">Gemini Nexus</span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-gray-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-nexus-900 pt-20 px-4">
          <nav className="space-y-4">
            <NavItem targetMode={AppMode.CHAT} icon={MessageSquare} label="AI 对话" />
            <NavItem targetMode={AppMode.VISION} icon={Image} label="视觉分析" />
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative pt-16 md:pt-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-nexus-900 to-nexus-900 -z-10 pointer-events-none" />
        
        {mode === AppMode.CHAT ? <ChatInterface /> : <VisionInterface />}
      </main>
    </div>
  );
}