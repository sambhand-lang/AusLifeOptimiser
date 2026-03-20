import React, { createContext, useContext, useState } from 'react';
import type { Persona } from '../utils/suburbScoring';

interface PersonaContextType {
  persona: Persona;
  setPersona: (persona: Persona) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersonaState] = useState<Persona>(() => {
    const saved = localStorage.getItem('user_persona');
    return (saved as Persona) || 'balanced';
  });

  const setPersona = (p: Persona) => {
    setPersonaState(p);
    localStorage.setItem('user_persona', p);
  };

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
