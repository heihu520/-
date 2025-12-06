
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Copy, Check, Sparkles, ChevronDown, Clock, Zap, Coins, Cpu } from 'lucide-react';
import { Message, Role, ModelId, MODELS } from '../types';
import { streamChatResponse, calculateCost } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatInterfaceProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedModel, onModelChange }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.MODEL,
      content: "你好！我是 **Gemini Nexus**。今天有什么我可以帮你的吗？",
      timestamp: Date.now(),
      metrics: {
        startTime: Date.now(),
        endTime: Date.now(),
        totalTokens: 0,
        cost: 0
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined) return '$0.00';
    if (cost === 0) return 'Free';
    if (cost < 0.000001) return '<$0.000001';
    return `$${cost.toFixed(6)}`;
  };

  const formatLatency = (start: number, end?: number) => {
    if (!end) return '...';
    const diff = end - start;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const startTime = Date.now();
    
    const userMessage: Message = {
      id: startTime.toString(),
      role: Role.USER,
      content: input,
      timestamp: startTime,
      metrics: { startTime }
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const botMessageId = (startTime + 1).toString();
    const botStartTime = Date.now();
    
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: botStartTime,
      isLoading: true,
      metrics: { startTime: botStartTime }
    }]);

    try {
      const history = messages; 
      const stream = streamChatResponse(history, userMessage.content, selectedModel);
      let accumulatedContent = '';
      let finalUsage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined;

      for await (const chunk of stream) {
        accumulatedContent += chunk.text;
        if (chunk.usage) {
          finalUsage = chunk.usage;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { 
                ...msg, 
                content: accumulatedContent, 
                isLoading: false,
                metrics: {
                  ...msg.metrics!,
                  // Live update output tokens if available, or rough estimate 1 token ~= 4 chars
                  outputTokens: finalUsage?.candidatesTokenCount ?? Math.ceil(accumulatedContent.length / 4)
                }
              } 
            : msg
        ));
      }

      // Final update with end time and accurate cost
      const endTime = Date.now();
      const inputTokens = finalUsage?.promptTokenCount || 0;
      const outputTokens = finalUsage?.candidatesTokenCount || 0;
      const totalTokens = finalUsage?.totalTokenCount || (inputTokens + outputTokens);
      const cost = calculateCost(selectedModel, inputTokens, outputTokens);

      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { 
              ...msg, 
              metrics: {
                startTime: botStartTime,
                endTime,
                inputTokens,
                outputTokens,
                totalTokens,
                cost
              }
            } 
          : msg
      ));

    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const currentModelName = MODELS.find(m => m.id === selectedModel)?.name;

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header with Model Selector */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 py-4 flex justify-end md:justify-end">
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-20 py-20 space-y-8 custom-scrollbar pb-36">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-5 animate-fade-in ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`
              w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
              ${msg.role === Role.USER 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20' 
                : 'bg-white/80 backdrop-blur-md border border-white/40'}
            `}>
              {msg.role === Role.USER ? <User size={20} className="text-white" /> : <Sparkles size={20} className="text-indigo-500" />}
            </div>

            {/* Bubble Container */}
            <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
              
              {/* Bubble */}
              <div className={`
                group relative w-full rounded-3xl px-6 pt-5 pb-9 shadow-sm transition-all duration-300
                ${msg.role === Role.USER 
                  ? 'bg-blue-600/70 backdrop-blur-2xl border border-white/20 text-white rounded-tr-md shadow-[0_4px_20px_rgba(37,99,235,0.15)]' 
                  : 'bg-white/60 backdrop-blur-3xl border border-white/40 text-slate-800 rounded-tl-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]'}
              `}>
                {msg.isLoading && !msg.content ? (
                  <div className="flex items-center gap-2 text-slate-500">
                     <Loader2 className="animate-spin h-4 w-4" />
                     <span className="text-xs font-medium">思考中...</span>
                  </div>
                ) : (
                  <>
                    <MarkdownRenderer content={msg.content} theme={msg.role === Role.USER ? 'dark' : 'light'} />
                    
                    {!msg.isLoading && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className={`
                          absolute bottom-2 right-3 p-1.5 rounded-lg transition-all
                          opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1.5 text-xs backdrop-blur-md border border-white/10
                          ${msg.role === Role.USER 
                            ? 'bg-white/10 hover:bg-white/20 text-white/90' 
                            : 'bg-white/40 hover:bg-white/60 text-slate-500 hover:text-slate-800'}
                        `}
                        title="复制内容"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="font-medium">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>复制</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Metrics Footer */}
              <div className={`
                flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-medium opacity-80 px-2
                ${msg.role === Role.USER ? 'text-slate-500 justify-end' : 'text-slate-400 justify-start'}
              `}>
                {/* Time */}
                <div className="flex items-center gap-1" title="发送/接收时间">
                  <Clock size={10} />
                  <span>{formatTime(msg.timestamp)}</span>
                </div>

                {/* Extended Metrics for AI responses */}
                {msg.role === Role.MODEL && msg.metrics && (
                  <>
                     <div className="w-px h-2 bg-slate-300" />
                     
                     {/* Latency */}
                     <div className="flex items-center gap-1" title="生成耗时">
                        <Zap size={10} className={msg.isLoading ? "animate-pulse text-amber-500" : "text-blue-500"} />
                        <span>{formatLatency(msg.metrics.startTime, msg.metrics.endTime)}</span>
                     </div>

                     <div className="w-px h-2 bg-slate-300" />

                     {/* Tokens */}
                     <div className="flex items-center gap-1" title={`Input: ${msg.metrics.inputTokens || 0} / Output: ${msg.metrics.outputTokens || 0}`}>
                        <Cpu size={10} className="text-purple-500" />
                        <span>{msg.metrics.totalTokens || 0} tokens</span>
                     </div>

                     <div className="w-px h-2 bg-slate-300" />

                     {/* Cost */}
                     <div className="flex items-center gap-1 text-emerald-600" title="预估成本">
                        <Coins size={10} />
                        <span>{formatCost(msg.metrics.cost)}</span>
                     </div>
                  </>
                )}
              </div>

            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-20 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-white/60 backdrop-blur-[50px] border border-white/40 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden flex items-center p-2 transition-all focus-within:ring-1 focus-within:ring-white/60 focus-within:bg-white/80">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`向 ${currentModelName} 提问...`}
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 border-none rounded-xl pl-6 pr-4 py-4 focus:outline-none text-base"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className={`
                  p-4 rounded-2xl transition-all duration-300 flex items-center justify-center
                  ${input.trim() && !isGenerating
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-black/5 text-slate-400 cursor-not-allowed'}
                `}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
