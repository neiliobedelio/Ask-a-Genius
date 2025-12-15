import { GoogleGenAI, Modality } from "@google/genai";
import { Persona, Message } from '../types';
import { decodeBase64, decodeAudioData } from './audioUtils';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Singleton AudioContext to manage browser limits
let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, 
    });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

/**
 * Generates a text response from the specific persona.
 */
export const generateTextResponse = async (
  prompt: string, 
  persona: Persona,
  chatHistory: Message[]
): Promise<string> => {
  
  const model = "gemini-2.5-flash";
  
  try {
    // Construct content parts from history
    const contents = chatHistory.map(msg => {
      const parts: any[] = [{ text: msg.text }];
      
      if (msg.image) {
        // Extract base64 data and mime type
        // Data URI format: data:[<mediatype>][;base64],<data>
        const matches = msg.image.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
           parts.push({
             inlineData: {
               mimeType: matches[1],
               data: matches[2]
             }
           });
        }
      }
      
      return {
        role: msg.role,
        parts: parts
      };
    });

    // Append the current prompt if not already in history (it should be, but just in case logic changes)
    // The calling component adds the user message to state before calling this.
    // However, if we just appended the user message to state, it IS in chatHistory.
    // If the caller separates them, we'd need to add it here. 
    // Assuming chatHistory INCLUDES the latest user prompt for this implementation.

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: persona.systemInstruction,
        temperature: 0.7, 
      },
    });

    return response.text || "I'm having trouble speaking right now.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "The connection to the past is staticy. Please try again.";
  }
};

/**
 * Generates speech from text using the persona's assigned voice.
 */
export const generateSpeech = async (
  text: string, 
  persona: Persona
): Promise<AudioBuffer | null> => {
  
  const model = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: persona.voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      const ctx = getAudioContext();
      const encodedBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(encodedBytes, ctx);
      return audioBuffer;
    }
    
    return null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};