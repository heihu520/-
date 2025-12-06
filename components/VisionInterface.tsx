import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, Loader2, Bot } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

export const VisionInterface: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("文件过大。请上传 5MB 以下的图片。");
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
      const analysis = await analyzeImage(selectedImage, prompt);
      setResult(analysis);
    } catch (error) {
      console.error("Analysis failed", error);
      setResult("无法分析图片，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-nexus-900 p-6">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <ImageIcon className="text-pink-500" /> 视觉分析
          </h2>
          <p className="text-gray-400">上传图片并让 Gemini 进行分析。</p>
        </div>

        {/* Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="space-y-4">
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-nexus-700 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-nexus-800/50 transition-all group"
              >
                <div className="p-4 bg-nexus-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-gray-400 group-hover:text-accent" size={32} />
                </div>
                <p className="text-gray-300 font-medium">点击上传图片</p>
                <p className="text-gray-500 text-sm mt-1">支持 JPG, PNG, WebP (最大 5MB)</p>
              </div>
            ) : (
              <div className="relative group rounded-2xl overflow-hidden border border-nexus-700 shadow-2xl">
                <img src={selectedImage} alt="Preview" className="w-full h-64 object-cover" />
                <button 
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 backdrop-blur rounded-full text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">提示词 (可选)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：这道菜里有哪些配料？"
                className="w-full bg-nexus-800 border border-nexus-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none h-24"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                ${!selectedImage || isLoading 
                  ? 'bg-nexus-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> 分析中...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> 开始分析
                </>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-nexus-800/50 rounded-2xl border border-nexus-700 p-6 min-h-[300px] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bot size={20} className="text-emerald-400" />
              Gemini 分析结果
            </h3>
            
            <div className="flex-1">
              {!result && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                  <Sparkles size={48} className="mb-2" />
                  <p>分析结果将显示在这里</p>
                </div>
              )}
              
              {isLoading && (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-pulse">
                   <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p>正在解读像素...</p>
                 </div>
              )}

              {result && (
                <div className="animate-fade-in">
                  <MarkdownRenderer content={result} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};