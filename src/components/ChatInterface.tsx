
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Loader2, Copy, Check, ChevronDown, Clock, Zap, Coins, Cpu } from 'lucide-react';
import { Message, Role, ModelId, MODELS, Session } from '../types';
import { streamChatResponse, calculateCost } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { api } from '../services/apiService';

interface ChatInterfaceProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  sessionId: string | null;
  onSessionCreated: (session: Session) => void;
  refreshSessions: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  selectedModel, 
  onModelChange, 
  sessionId, 
  onSessionCreated,
  refreshSessions
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalSessionId = useRef<string | null>(sessionId);

  // Sync ref with prop
  useEffect(() => {
    internalSessionId.current = sessionId;
  }, [sessionId]);

  // Load messages when sessionId changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!sessionId) {
        setMessages([{
          id: 'welcome',
          role: Role.MODEL,
          content: "你好！我是 **Gemini Nexus**。我们的对话将被自动保存。",
          timestamp: Date.now(),
          metrics: { startTime: Date.now() }
        }]);
        return;
      }

      setIsLoadingHistory(true);
      const history = await api.getMessages(sessionId);
      if (history.length > 0) {
        setMessages(history);
      } else {
         setMessages([]);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, isLoadingHistory]);

  // Helper formats
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const formatCost = (cost?: number) => !cost ? '$0.00' : (cost < 0.000001 ? '<$0.000001' : `$${cost.toFixed(6)}`);
  const formatLatency = (start: number, end?: number) => !end ? '...' : `${((end - start) / 1000).toFixed(2)}s`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const startTime = Date.now();
    const userMessageContent = input;
    setInput('');
    setIsGenerating(true);

    // 1. Create Session if needed
    let activeSessionId = internalSessionId.current;
    if (!activeSessionId) {
      // Use first 20 chars as title
      const title = userMessageContent.slice(0, 30) + (userMessageContent.length > 30 ? '...' : '');
      const newSession = await api.createSession(title);
      if (newSession) {
        activeSessionId = newSession.id;
        internalSessionId.current = newSession.id;
        onSessionCreated(newSession); // Update parent state
      } else {
        console.warn("Could not create session. Chat will not be saved.");
        alert("无法连接到数据库！\n请确保后端服务 (npm run server) 已启动。\n您的消息将不会被保存。");
      }
    }

    // 2. Add User Message to UI & Save to DB
    const userMessage: Message = {
      id: Date.now().toString(), 
      role: Role.USER,
      content: userMessageContent,
      timestamp: startTime,
      metrics: { startTime }
    };

    setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), userMessage]); 

    if (activeSessionId) {
      api.saveMessage(activeSessionId, userMessage);
    }

    // 3. Prepare Bot Placeholder
    const botStartTime = Date.now();
    const botMessageId = (startTime + 1).toString();
    
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: botStartTime,
      isLoading: true,
      metrics: { startTime: botStartTime }
    }]);

    try {
      const history = messages.filter(m => m.id !== 'welcome');
      const stream = streamChatResponse(history, userMessageContent, selectedModel);
      let accumulatedContent = '';
      let finalUsage: any;

      for await (const chunk of stream) {
        accumulatedContent += chunk.text;
        if (chunk.usage) finalUsage = chunk.usage;
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { 
                ...msg, 
                content: accumulatedContent, 
                isLoading: false,
                metrics: {
                  ...msg.metrics!,
                  outputTokens: finalUsage?.candidatesTokenCount ?? Math.ceil(accumulatedContent.length / 4)
                }
              } 
            : msg
        ));
      }

      // 4. Finalize Bot Message & Save
      const endTime = Date.now();
      const inputTokens = finalUsage?.promptTokenCount || 0;
      const outputTokens = finalUsage?.candidatesTokenCount || 0;
      const totalTokens = finalUsage?.totalTokenCount || (inputTokens + outputTokens);
      const cost = calculateCost(selectedModel, inputTokens, outputTokens);
      
      const finalBotMessage: Message = {
        id: botMessageId,
        role: Role.MODEL,
        content: accumulatedContent,
        timestamp: botStartTime,
        metrics: {
          startTime: botStartTime,
          endTime,
          inputTokens,
          outputTokens,
          totalTokens,
          cost
        }
      };

      setMessages(prev => prev.map(msg => msg.id === botMessageId ? finalBotMessage : msg));
      
      if (activeSessionId) {
        await api.saveMessage(activeSessionId, finalBotMessage);
        refreshSessions(); // Update timestamp order in sidebar
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, content: "Error: " + err, isLoading: false } : msg));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) { console.error(err); }
  };

  const currentModelName = MODELS.find(m => m.id === selectedModel)?.name;

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm">加载历史会话...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header Model Selector */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 py-4 flex justify-end">
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
                  className={`flex flex-col items-start px-4 py-3 rounded-lg text-left transition-colors ${selectedModel === model.id ? 'bg-black/5' : 'hover:bg-black/5'}`}
                >
                  <span className={`text-sm font-semibold ${selectedModel === model.id ? 'text-slate-900' : 'text-slate-600'}`}>{model.name}</span>
                  <span className="text-[10px] text-slate-500">{model.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-20 py-20 space-y-8 custom-scrollbar pb-36">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-5 animate-fade-in ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === Role.USER ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20' : 'bg-white/80 backdrop-blur-md border border-white/40'}`}>
              {msg.role === Role.USER ? <User size={20} className="text-white" /> : <Sparkles size={20} className="text-indigo-500" />}
            </div>

            <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
              <div className={`group relative w-full rounded-3xl px-6 pt-5 pb-9 shadow-sm transition-all duration-300 ${msg.role === Role.USER ? 'bg-blue-600/70 backdrop-blur-2xl border border-white/20 text-white rounded-tr-md shadow-[0_4px_20px_rgba(37,99,235,0.15)]' : 'bg-white/60 backdrop-blur-3xl border border-white/40 text-slate-800 rounded-tl-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]'}`}>
                {msg.isLoading && !msg.content ? (
                  <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin h-4 w-4" /><span className="text-xs font-medium">思考中...</span></div>
                ) : (
                  <>
                    <MarkdownRenderer content={msg.content} theme={msg.role === Role.USER ? 'dark' : 'light'} />
                    {!msg.isLoading && msg.role !== 'system' && (
                      <button onClick={() => copyToClipboard(msg.content, msg.id)} className={`absolute bottom-2 right-3 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1.5 text-xs backdrop-blur-md border border-white/10 ${msg.role === Role.USER ? 'bg-white/10 hover:bg-white/20 text-white/90' : 'bg-white/40 hover:bg-white/60 text-slate-500 hover:text-slate-800'}`}>
                        {copiedId === msg.id ? <><Check size={12} className="text-emerald-500" /><span className="font-medium">已复制</span></> : <><Copy size={12} /><span>复制</span></>}
                      </button>
                    )}
                  </>
                )}
              </div>

              {msg.role === Role.MODEL && msg.metrics && (
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-medium opacity-80 px-2 text-slate-400 justify-start`}>
                  <div className="flex items-center gap-1"><Clock size={10} /><span>{formatTime(msg.timestamp)}</span></div>
                  <div className="w-px h-2 bg-slate-300" />
                  <div className="flex items-center gap-1"><Zap size={10} className="text-blue-500" /><span>{formatLatency(msg.metrics.startTime, msg.metrics.endTime)}</span></div>
                  <div className="w-px h-2 bg-slate-300" />
                  <div className="flex items-center gap-1"><Cpu size={10} className="text-purple-500" /><span>{msg.metrics.totalTokens || 0} tokens</span></div>
                  <div className="w-px h-2 bg-slate-300" />
                  <div className="flex items-center gap-1 text-emerald-600"><Coins size={10} /><span>{formatCost(msg.metrics.cost)}</span></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-20 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
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
                className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-center ${input.trim() && !isGenerating ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-black/5 text-slate-400 cursor-not-allowed'}`}
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
