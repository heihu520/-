import React from 'react';
import { X, Cpu, Zap, Eye, Code } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[10px] animate-fade-in"
        onClick={onClose}
      />

      {/* Acrylic Modal Window - Heavy Light Blur */}
      <div className="relative bg-white/70 backdrop-blur-[50px] border border-white/50 rounded-[2rem] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden animate-fade-in ring-1 ring-white/60">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white/40">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="text-blue-500" /> 关于 Gemini Nexus
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 text-slate-600">
          <p className="text-lg leading-relaxed text-slate-700">
            <strong>Gemini Nexus</strong> 是一个高性能演示应用，将 Windows 11 的 <strong>Mica & Acrylic (云母与亚克力)</strong> 美学与 Google <strong>Gemini 3 Pro</strong> 的强大智能完美融合。
          </p>

          <div className="grid gap-4">
            <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50">
              <div className="bg-blue-100 p-3 rounded-xl h-fit text-blue-600 shadow-sm">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-slate-900 font-medium">极速交互</h3>
                <p className="text-sm mt-1 text-slate-500">毫秒级延迟流式传输，提供丝般顺滑的 AI 对话体验。</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50">
              <div className="bg-pink-100 p-3 rounded-xl h-fit text-pink-500 shadow-sm">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-slate-900 font-medium">视觉智能</h3>
                <p className="text-sm mt-1 text-slate-500">多模态引擎支持，将视觉信息转化为结构化洞察。</p>
              </div>
            </div>

             <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50">
              <div className="bg-purple-100 p-3 rounded-xl h-fit text-purple-600 shadow-sm">
                <Code size={24} />
              </div>
              <div>
                <h3 className="text-slate-900 font-medium">深度玻璃 UI</h3>
                <p className="text-sm mt-1 text-slate-500">采用重度高斯模糊的 Mica & Acrylic 材质，打造沉浸式体验。</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white/40 text-center text-xs text-slate-400 border-t border-black/5">
          Powered by Google GenAI SDK & Tailwind CSS
        </div>
      </div>
    </div>
  );
};