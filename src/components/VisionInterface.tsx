import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, Loader2, Bot, ScanEye, ChevronDown } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ModelId, MODELS } from '../types';

interface VisionInterfaceProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
}

export const VisionInterface: React.FC<VisionInterfaceProps> = ({ selectedModel, onModelChange }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("文件过大。请上传小于 5MB 的图片。");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setResult(null);
    setPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    try {
      const analysis = await analyzeImage(selectedImage, prompt, selectedModel);
      setResult(analysis);
    } catch (error) {
      console.error("Analysis failed", error);
      setResult("分析图片失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const currentModelName = MODELS.find(m => m.id === selectedModel)?.name;

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-8 custom-scrollbar relative">
      
      {/* Model Selector Top Right */}
      <div className="absolute top-6 right-6 z-30">
        <div className="relative">
          <button 
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 backdrop-blur-2xl border border-white/40 hover:bg-white/80 transition-all text-sm font-medium text-slate-700 shadow-sm"
          >
            <Sparkles size={14} className="text-purple-500" />
            {currentModelName}
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isModelMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white/80 backdrop-blur-3xl border border-white/40 shadow-2xl overflow-hidden animate-fade-in flex flex-col p-1 z-40">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsModelMenuOpen(false);
                  }}
                  className={`flex flex-col items-start px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedModel === model.id 
                      ? 'bg-black/5' 
                      : 'hover:bg-black/5'
                  }`}
                >
                  <span className={`text-sm font-semibold ${selectedModel === model.id ? 'text-slate-900' : 'text-slate-600'}`}>
                    {model.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{model.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-8 pb-10 mt-10">
        
        {/* Header with Glow */}
        <div className="text-center space-y-3 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />
          <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3 relative z-10">
            <span className="p-2 bg-white/40 rounded-xl backdrop-blur-xl border border-white/40 shadow-lg">
              <ScanEye className="text-purple-500" size={28} />
            </span>
            视觉智能
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto relative z-10">
            上传图片，让 Gemini 的多模态引擎为您解析每一个像素。
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            {/* Upload Box */}
            <div className={`
              relative rounded-3xl transition-all duration-300 border overflow-hidden backdrop-blur-md
              ${!selectedImage 
                ? 'h-80 border-dashed border-slate-300 hover:border-blue-400 hover:bg-white/40 cursor-pointer group bg-white/20' 
                : 'border-solid border-white/40 bg-white/20 shadow-xl'}
            `}>
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center mb-6 border border-white/50 group-hover:scale-110 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-300">
                    <Upload className="text-slate-400 group-hover:text-blue-500" size={32} />
                  </div>
                  <p className="text-lg text-slate-600 font-medium">点击上传图片</p>
                  <p className="text-slate-400 text-sm mt-2">JPG, PNG, WebP (最大 5MB)</p>
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-0" />
                  <img src={selectedImage} alt="Preview" className="relative z-10 w-full h-full object-contain p-4" />
                  <button 
                    onClick={handleClear}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/60 hover:bg-red-500 hover:text-white backdrop-blur-md border border-white/40 rounded-full text-slate-600 transition-all hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            {/* Prompt Area */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-500 ml-1">自定义提示词 (可选)</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl opacity-0 group-focus-within:opacity-30 blur transition duration-500"></div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例如：分析这张图表中的数据趋势..."
                  className="relative w-full bg-white/40 backdrop-blur-[40px] border border-white/40 rounded-3xl p-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none h-32 text-sm shadow-inner"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg backdrop-blur-md
                ${!selectedImage || isLoading 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={24} /> 分析中...
                </>
              ) : (
                <>
                  <Sparkles size={24} /> 开始分析
                </>
              )}
            </button>
          </div>

          {/* Right Column: Result */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="h-full bg-white/50 backdrop-blur-[50px] rounded-3xl border border-white/40 p-6 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden">
               {/* Decorative light leak */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[60px] pointer-events-none rounded-full" />
               
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200/50 pb-4 z-10">
                <Bot size={20} className="text-emerald-500" />
                Gemini 分析报告
              </h3>
              
              <div className="flex-1 relative z-10">
                {!result && !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Sparkles size={64} strokeWidth={1} className="mb-4" />
                    <p className="font-light">等待图片输入...</p>
                  </div>
                )}
                
                {isLoading && (
                   <div className="h-full flex flex-col items-center justify-center space-y-6">
                     <div className="relative w-20 h-20">
                       <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                       <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                     </div>
                     <p className="text-blue-500 font-medium animate-pulse">Gemini 正在观察...</p>
                   </div>
                )}

                {result && (
                  <div className="animate-fade-in prose-custom">
                    <MarkdownRenderer content={result} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};