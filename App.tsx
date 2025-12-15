import React, { useState } from 'react';
import { Persona } from './types';
import PersonaSelector from './components/PersonaSelector';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-700 selection:text-white">
        {/* Background Ambient Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/10 blur-[100px] rounded-full mix-blend-screen" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="relative z-0 h-full flex flex-col">
            {!selectedPersona ? (
                <div className="flex-1 flex items-center justify-center">
                    <PersonaSelector onSelect={setSelectedPersona} />
                </div>
            ) : (
                <div className="flex-1">
                    <ChatInterface 
                        persona={selectedPersona} 
                        onBack={() => setSelectedPersona(null)} 
                    />
                </div>
            )}
        </div>
    </div>
  );
};

export default App;