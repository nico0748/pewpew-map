import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Level } from '../types';

interface LevelContextValue {
  level: Level;
  setLevel: (l: Level) => void;
}

const LevelContext = createContext<LevelContextValue | null>(null);
const STORAGE_KEY = 'cav-level';

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<Level>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'beginner' ? 'beginner' : 'pro';
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, level);
  }, [level]);
  return <LevelContext.Provider value={{ level, setLevel }}>{children}</LevelContext.Provider>;
}

export function useLevel(): LevelContextValue {
  const ctx = useContext(LevelContext);
  if (!ctx) throw new Error('useLevel must be used within LevelProvider');
  return ctx;
}
