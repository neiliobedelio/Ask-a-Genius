export enum SpeakerVoice {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  avatar: string;
  era: string;
  color: string;
  description: string;
  systemInstruction: string;
  voiceName: SpeakerVoice;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 data URI
  audioBuffer?: AudioBuffer | null;
  isAudioLoading?: boolean;
  timestamp: number;
}

export interface ChatState {
  persona: Persona | null;
  messages: Message[];
  isTyping: boolean;
}