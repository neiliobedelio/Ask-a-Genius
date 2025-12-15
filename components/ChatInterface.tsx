import React, { useState, useEffect, useRef } from 'react';
import { Persona, Message, ChatState } from '../types';
import { generateTextResponse, generateSpeech } from '../services/geminiService';
import { SUGGESTED_QUESTIONS } from '../constants';
import Avatar from './Avatar';
import AudioPlayer from './AudioPlayer';

interface ChatInterfaceProps {
  persona: Persona;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ persona, onBack }) => {
  const [state, setState] = useState<ChatState>({
    persona,
    messages: [],
    isTyping: false,
  });
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, state.isTyping]);

  // Initial greeting
  useEffect(() => {
    if (state.messages.length === 0) {
        const initialId = Date.now().toString();
        const initialText = `Hello. I see you've summoned me to 2024. I am ${persona.name}. What shall we discuss?`;
        
        setState(prev => ({
            ...prev,
            messages: [{
                id: initialId,
                role: 'model',
                text: initialText,
                timestamp: Date.now(),
                isAudioLoading: true // Auto load voice for intro
            }]
        }));

        // Trigger TTS for intro
        generateSpeech(initialText, persona).then(buffer => {
            setState(prev => ({
                ...prev,
                messages: prev.messages.map(m => 
                    m.id === initialId ? { ...m, audioBuffer: buffer, isAudioLoading: false } : m
                )
            }));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (text: string) => {
    if ((!text.trim() && !selectedImage) || state.isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      image: selectedImage || undefined,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Prepare history for API (including the new message)
    const history = [...state.messages, userMessage];

    // 1. Get Text Response
    const responseText = await generateTextResponse(text, persona, history);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        isAudioLoading: true, // Start loading audio indicator immediately
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, modelMessage],
      isTyping: false,
    }));

    // 2. Fetch Audio in background
    const audioBuffer = await generateSpeech(responseText, persona);
    
    setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => 
            m.id === modelMessageId ? { ...m, audioBuffer, isAudioLoading: false } : m
        )
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-zinc-950 overflow-hidden">
      
      {/* LEFT PANEL: VISUAL REPRESENTATION (Mobile: Top, Desktop: Left) */}
      <div className="w-full md:w-1/3 lg:w-1/4 h-64 md:h-full bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 relative flex flex-col">
        {/* Header inside visual panel for desktop */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-zinc-950/80 to-transparent">
           <button 
                onClick={onBack}
                className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div className="flex flex-col items-end">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Live Connection
                </span>
            </div>
        </div>

        {/* The "Video" Feed */}
        <div className="flex-1 relative overflow-hidden group">
            <img 
                src={persona.avatar} 
                alt={persona.name} 
                className={`w-full h-full object-cover transition-all duration-[3000ms] ease-in-out ${state.isTyping ? 'scale-105 saturate-100' : 'scale-100 saturate-[0.8] grayscale-[0.3]'}`}
            />
            {/* Overlay effects */}
            <div className={`absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 ${persona.color}`}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-zinc-950/30"></div>
            
            {/* Speaking visualizer overlay */}
            {state.isTyping && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
            )}
            
            {/* Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-2xl font-bold text-white leading-none mb-1 shadow-black drop-shadow-md">{persona.name}</h1>
                <p className="text-zinc-300 text-sm opacity-90">{persona.title}</p>
            </div>
        </div>
      </div>


      {/* RIGHT PANEL: CHAT */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950 relative">
          
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
            {state.messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {msg.role === 'model' && (
                        <Avatar src={persona.avatar} alt={persona.name} size="sm" className="mt-1 flex-shrink-0 md:hidden" />
                    )}

                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div 
                            className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed overflow-hidden ${
                                msg.role === 'user' 
                                    ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' 
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm shadow-sm'
                            }`}
                        >
                            {msg.image && (
                                <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                                    <img src={msg.image} alt="User upload" className="max-w-full h-auto max-h-60 object-cover" />
                                </div>
                            )}
                            {msg.text}
                        </div>
                        {msg.role === 'model' && (
                            <AudioPlayer 
                                audioBuffer={msg.audioBuffer || null} 
                                isLoading={!!msg.isAudioLoading} 
                                autoPlay={true} 
                            />
                        )}
                    </div>
                </div>
            </div>
            ))}
            
            {state.isTyping && (
            <div className="flex w-full justify-start">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-zinc-500 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-zinc-500 rounded-full typing-dot"></div>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {state.messages.length < 3 && !state.isTyping && (
            <div className="px-6 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleSendMessage(q)}
                        className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                    >
                        {q}
                    </button>
                ))}
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-zinc-950 border-t border-zinc-900">
            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-2 relative inline-block">
                    <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg border border-zinc-700" />
                    <button 
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 hover:bg-zinc-700 border border-zinc-600"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            
            <div className="relative flex items-center gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
                    title="Upload image for critique"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedImage ? "Ask for feedback on this image..." : "Ask for inspiration..."}
                    disabled={state.isTyping}
                    className="w-full bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 placeholder-zinc-600 disabled:opacity-50 transition-all"
                />
                <button
                    onClick={() => handleSendMessage(inputText)}
                    disabled={(!inputText.trim() && !selectedImage) || state.isTyping}
                    className="absolute right-2 p-1.5 bg-zinc-100 text-zinc-950 rounded-lg hover:bg-zinc-300 disabled:opacity-50 disabled:hover:bg-zinc-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-zinc-600">
                    AI can make mistakes. Responses based on historic personas.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;