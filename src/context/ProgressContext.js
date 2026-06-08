import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { loadProgress, saveProgress, DEFAULT_PROGRESS } from '../storage/progress';

const ProgressContext = createContext(null);

const todayStr = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    loadProgress().then((p) => {
      progressRef.current = p;
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  // Award rewards for finishing a lesson. Reads latest progress via ref so it is
  // safe to call once from an effect without stale-closure bugs.
  const completeLesson = useCallback(({ topic, stars, score }) => {
    const p = progressRef.current;
    const today = todayStr();

    let streak = p.streak || 0;
    if (p.lastPlayed !== today) {
      streak = p.lastPlayed && dayDiff(p.lastPlayed, today) === 1 ? streak + 1 : 1;
    } else if (streak === 0) {
      streak = 1;
    }

    const coinsEarned = score;
    let newSticker = null;
    if (stars > 0 && topic) {
      newSticker = { id: `${topic.id}-${Date.now()}`, emoji: topic.emoji, name: topic.name_vi };
    }

    const next = {
      ...p,
      coins: (p.coins || 0) + coinsEarned,
      streak,
      lastPlayed: today,
      stickers: newSticker ? [...(p.stickers || []), newSticker] : (p.stickers || []),
    };
    persist(next);
    return { coinsEarned, newSticker, streak };
  }, [persist]);

  // Buy an outfit (deduct coins, add to owned, equip it). Returns true on success.
  const buyOutfit = useCallback((outfit) => {
    const p = progressRef.current;
    const owned = p.ownedOutfits || ['none'];
    if (owned.includes(outfit.id)) return false;
    if ((p.coins || 0) < outfit.price) return false;
    persist({
      ...p,
      coins: p.coins - outfit.price,
      ownedOutfits: [...owned, outfit.id],
      outfit: outfit.id,
    });
    return true;
  }, [persist]);

  const equipOutfit = useCallback((id) => {
    const p = progressRef.current;
    if (!(p.ownedOutfits || ['none']).includes(id)) return;
    persist({ ...p, outfit: id });
  }, [persist]);

  return (
    <ProgressContext.Provider value={{ ...progress, loaded, completeLesson, buyOutfit, equipOutfit }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
};
