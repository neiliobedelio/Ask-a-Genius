import React from 'react';
import { PERSONAS } from '../constants';
import { Persona } from '../types';
import Avatar from './Avatar';

interface PersonaSelectorProps {
  onSelect: (persona: Persona) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-500">
          Zeitgeist Interviews
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
          Seek guidance from design history's giants, reimagined for the modern era. Select a mentor to begin your critique.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            onClick={() => onSelect(persona)}
            className="group relative flex flex-col items-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/80 hover:border-zinc-600 transition-all duration-300 text-left hover:-translate-y-2 hover:shadow-2xl hover:shadow-zinc-950/50"
          >
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${persona.color}`} />
            
            <Avatar src={persona.avatar} alt={persona.name} size="xl" className="mb-4 group-hover:scale-105 transition-transform duration-300" />
            
            <h3 className="text-xl font-bold text-zinc-100 mb-1">{persona.name}</h3>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3">{persona.title}</span>
            <p className="text-sm text-zinc-400 text-center line-clamp-3">{persona.description}</p>
            
            <div className="mt-4 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
              Start Session
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonaSelector;