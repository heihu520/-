import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { Message, Role } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.MODEL,
      content: "你好！我是 **Gemini Nexus**。今天有什么可以帮你的吗？",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const botMessageId = (Date.now() + 1).toString();
    // Initialize bot message placeholder
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now(),
      isLoading: true
    }]);

    try {
      // Use previous messages as history (excluding the one we just added for now, to keep logic clean)
      // The service maps them correctly.
      const history = messages; 
      
      const stream = streamChatResponse(history, userMessage.content);
      let accumulatedContent = '';

      for await (const textChunk of stream) {
        accumulatedContent += textChunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: accumulatedContent, isLoading: false } 
            : msg
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-nexus-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === Role.USER ? 'bg-indigo-600' : 'bg-emerald-600'}
              shadow-lg
            `}>
              {msg.role === Role.USER ? <User size={18} /> : <Bot size={18} />}
            </div>

            <div className={`
              max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-md
              ${msg.role === Role.USER 
                ? 'bg-nexus-700 text-white rounded-tr-sm' 
                : 'bg-nexus-800 text-gray-100 rounded-tl-sm border border-nexus-700'}
            `}>
              {msg.isLoading && !msg.content ? (
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-nexus-900 border-t border-nexus-700">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="询问 Gemini 任何问题..."
            className="w-full bg-nexus-800 text-white placeholder-gray-400 border border-nexus-700 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-lg"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 top-2 p-2 bg-accent hover:bg-accentHover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-2">
          Gemini 可能会犯错。请务必核实重要信息。
        </p>
      </div>
    </div>
  );
};