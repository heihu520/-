export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isLoading?: boolean;
  image?: string; // base64 string for vision requests
}

export enum AppMode {
  CHAT = 'chat',
  VISION = 'vision'
}

export interface VisionAnalysisResult {
  text: string;
}