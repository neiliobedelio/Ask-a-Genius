import React, { useEffect, useState, useRef } from 'react';
import { getAudioContext } from '../services/geminiService';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  isLoading: boolean;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer, isLoading, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = async () => {
    if (!audioBuffer) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop previous instance if any
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { /* ignore */ }
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      sourceRef.current = null;
    };

    sourceRef.current = source;
    source.start();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { /* ignore */ }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    if (autoPlay && audioBuffer) {
        // Small timeout to allow UI to settle
        setTimeout(() => playAudio(), 100);
    }
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBuffer, autoPlay]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-zinc-500 text-xs mt-2 animate-pulse">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span>Synthesizing voice...</span>
      </div>
    );
  }

  if (!audioBuffer) return null;

  return (
    <button
      onClick={isPlaying ? stopAudio : playAudio}
      className={`mt-2 flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isPlaying 
          ? 'bg-zinc-100 text-zinc-900 shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
      }`}
    >
      {isPlaying ? (
        <>
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Playing...</span>
          {/* Audio Visualizer Mock */}
          <div className="flex space-x-0.5 h-3 items-end ml-1">
             <div className="w-0.5 bg-zinc-900 animate-[bounce_1s_infinite] h-2"></div>
             <div className="w-0.5 bg-zinc-900 animate-[bounce_1.2s_infinite] h-3"></div>
             <div className="w-0.5 bg-zinc-900 animate-[bounce_0.8s_infinite] h-1.5"></div>
          </div>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Listen</span>
        </>
      )}
    </button>
  );
};

export default AudioPlayer;