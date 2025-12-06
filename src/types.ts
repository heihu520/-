
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface MessageMetrics {
  startTime: number;
  endTime?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isLoading?: boolean;
  image?: string; // base64 string for vision requests
  metrics?: MessageMetrics;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export enum AppMode {
  CHAT = 'chat',
  VISION = 'vision'
}

export interface VisionAnalysisResult {
  text: string;
}

export type ModelId = 
  | 'gemini-3-pro-preview' 
  | 'gemini-2.5-flash' 
  | 'gemini-flash-lite-latest'
  | 'gemini-2.0-flash-exp';

export const MODELS: { id: ModelId; name: string; desc: string; tag: string }[] = [
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3 Pro', 
    desc: '最强推理能力，适合复杂任务',
    tag: '旗舰'
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    desc: '速度与智能的最佳平衡',
    tag: '标准'
  },
  { 
    id: 'gemini-flash-lite-latest', 
    name: 'Gemini Flash Lite', 
    desc: '极速响应，超低延迟',
    tag: '轻量'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Exp',
    desc: '实验性更新，探索新特性',
    tag: '实验'
  }
];
