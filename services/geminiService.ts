import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Message, Role } from "../types";

// Initialize the API client
// Ensure process.env.API_KEY is available in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Streaming chat with the model.
 * Uses gemini-2.5-flash for speed and efficiency.
 */
export const streamChatResponse = async function* (
  history: Message[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  
  // Filter out messages that might be in an invalid state or system messages if needed
  // converting our app's Message type to the API's content format
  // Note: We are starting a new chat session for simplicity in this demo to maintain history context manually if needed,
  // but here we use the chat helper for proper history management.
  
  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: '你是 Gemini Nexus，一个乐于助人、智能且回答简洁的 AI 助手。请主要使用中文与用户交流。',
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
      if (responseChunk.text) {
        yield responseChunk.text;
      }
    }
  } catch (error) {
    console.error("Error in streamChatResponse:", error);
    yield "\n\n**错误:** 无法连接到 Gemini。请检查您的网络连接或 API 密钥。";
  }
};

/**
 * Analyzes an image with a prompt.
 * Uses gemini-2.5-flash.
 */
export const analyzeImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Strip the data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64Image.split(',')[1] || base64Image;
    // Determine mime type roughly or default to png/jpeg (API is flexible)
    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt || "请详细描述这张图片的内容。"
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