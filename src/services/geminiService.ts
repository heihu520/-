import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Message, Role, ModelId } from "../types";

// Initialize the API client
// Ensure process.env.API_KEY is available in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ChatStreamResponse {
  text: string;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Streaming chat with the model.
 * Yields objects containing text chunks and optional usage metadata.
 */
export const streamChatResponse = async function* (
  history: Message[],
  newMessage: string,
  modelId: ModelId
): AsyncGenerator<ChatStreamResponse, void, unknown> {
  
  const chat: Chat = ai.chats.create({
    model: modelId,
    config: {
      systemInstruction: '你是 Gemini Nexus，一个智能、乐于助人且反应迅速的 AI 助手。请使用中文回答用户的问题。',
    },
    history: history.filter(m => m.role !== Role.SYSTEM).map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  try {
    const resultStream = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      const text = responseChunk.text || "";
      const usage = responseChunk.usageMetadata;
      
      yield { text, usage };
    }
  } catch (error) {
    console.error("Error in streamChatResponse:", error);
    yield { text: "\n\n**错误:** 无法连接到 Gemini。请检查网络连接或 API Key。" };
  }
};

/**
 * Calculates estimated cost based on model and token usage.
 * Pricing is approximate based on public preview/GA rates (USD).
 */
export const calculateCost = (modelId: ModelId, inputTokens: number, outputTokens: number): number => {
  let inputRate = 0; // per 1M tokens
  let outputRate = 0; // per 1M tokens

  switch (modelId) {
    case 'gemini-3-pro-preview':
      // Estimated Pro pricing
      inputRate = 1.25; 
      outputRate = 5.00;
      break;
    case 'gemini-2.5-flash':
      // Estimated Flash pricing
      inputRate = 0.075;
      outputRate = 0.30;
      break;
    case 'gemini-flash-lite-latest':
      // Estimated Lite pricing
      inputRate = 0.0375;
      outputRate = 0.15;
      break;
    default:
      inputRate = 0.10;
      outputRate = 0.40;
  }

  const inputCost = (inputTokens / 1_000_000) * inputRate;
  const outputCost = (outputTokens / 1_000_000) * outputRate;
  
  return inputCost + outputCost;
};

/**
 * Analyzes an image with a prompt.
 */
export const analyzeImage = async (
  base64Image: string,
  prompt: string,
  modelId: ModelId
): Promise<string> => {
  try {
    // Strip the data URL prefix if present
    const base64Data = base64Image.split(',')[1] || base64Image;
    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt || "请详细描述这张图片。"
          }
        ]
      }
    });

    return response.text || "未生成描述。";
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    return "分析图片时出错，请重试。";
  }
};