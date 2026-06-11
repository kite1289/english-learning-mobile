import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { loadProgress, saveProgress, DEFAULT_PROGRESS } from '../storage/progress';
import { Progress, Topic, Outfit, Sticker, DailyQuests } from '../types';

interface ProgressContextType extends Progress {
  loaded: boolean;
  completeLesson: (args: { topic: Topic; stars: number; score: number }) => {
    coinsEarned: number;
    newSticker: Sticker | null;
    streak: number;
    streakMilestone?: number | null;
    streakBonus?: number;
  };
  buyOutfit: (outfit: Outfit) => boolean;
  equipOutfit: (id: string) => void;
  persist: (next: Progress) => void;
  claimQuestReward: (questId: 'lessons' | 'perfect' | 'streak') => void;
  buyTheme: (themeId: string, price: number) => boolean;
  equipTheme: (themeId: string) => void;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

const todayStr = (): string => new Date().toISOString().slice(0, 10);
const dayDiff = (a: string, b: string): number => 
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

const generateDailyQuests = (): DailyQuests => {
  return {
    lessons: {
      id: 'lessons',
      title: 'Học 1 chủ đề tiếng Anh',
      target: 1,
      current: 0,
      rewardCoins: 25,
      claimed: false,
    },
    perfect: {
      id: 'perfect',
      title: 'Đạt tối đa 3 sao bài học',
      target: 1,
      current: 0,
      rewardCoins: 40,
      claimed: false,
    },
    streak: {
      id: 'streak',
      title: 'Duy trì chuỗi ngày học',
      target: 1,
      current: 0,
      rewardCoins: 20,
      claimed: false,
    },
  };
};

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef<Progress>(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    loadProgress().then((p) => {
      const today = todayStr();
      let updated = { ...p };

      if (!updated.activeTheme) updated.activeTheme = 'garden';
      if (!updated.ownedThemes) updated.ownedThemes = ['garden'];

      // Generate or update daily quests
      if (updated.lastQuestDate !== today) {
        updated.dailyQuests = generateDailyQuests();
        updated.lastQuestDate = today;
        saveProgress(updated);
      }

      progressRef.current = updated;
      setProgress(updated);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  const completeLesson = useCallback(({ topic, stars, score }: { topic: Topic; stars: number; score: number }) => {
    const p = progressRef.current;
    const today = todayStr();

    let streak = p.streak || 0;
    let streakBonus = 0;
    let streakMilestone: number | null = null;

    if (p.lastPlayed !== today) {
      streak = p.lastPlayed && dayDiff(p.lastPlayed, today) === 1 ? streak + 1 : 1;
      
      // Calculate streak milestone bonus
      if (streak === 3) {
        streakBonus = 50;
        streakMilestone = 3;
      } else if (streak === 7) {
        streakBonus = 150;
        streakMilestone = 7;
      } else if (streak === 14) {
        streakBonus = 350;
        streakMilestone = 14;
      }
    } else if (streak === 0) {
      streak = 1;
    }

    const coinsEarned = score;
    let newSticker: Sticker | null = null;
    if (stars > 0 && topic) {
      newSticker = { id: `${topic.id}-${Date.now()}`, emoji: topic.emoji, name: topic.name_vi };
    }

    // Update daily quests
    let dailyQuests = p.dailyQuests ? { ...p.dailyQuests } : generateDailyQuests();
    dailyQuests.lessons = {
      ...dailyQuests.lessons,
      current: Math.min(dailyQuests.lessons.target, dailyQuests.lessons.current + 1),
    };
    if (stars === 3) {
      dailyQuests.perfect = {
        ...dailyQuests.perfect,
        current: Math.min(dailyQuests.perfect.target, dailyQuests.perfect.current + 1),
      };
    }
    dailyQuests.streak = {
      ...dailyQuests.streak,
      current: 1, // Active for today
    };

    const next: Progress = {
      ...p,
      coins: (p.coins || 0) + coinsEarned + streakBonus,
      streak,
      lastPlayed: today,
      stickers: newSticker ? [...(p.stickers || []), newSticker] : (p.stickers || []),
      dailyQuests,
      lastQuestDate: today,
    };
    persist(next);
    return { coinsEarned, newSticker, streak, streakMilestone, streakBonus };
  }, [persist]);

  const claimQuestReward = useCallback((questId: 'lessons' | 'perfect' | 'streak') => {
    const p = progressRef.current;
    if (!p.dailyQuests) return;
    const quest = p.dailyQuests[questId];
    if (!quest || quest.claimed || quest.current < quest.target) return;

    const updatedQuests = {
      ...p.dailyQuests,
      [questId]: {
        ...quest,
        claimed: true,
      },
    };

    persist({
      ...p,
      coins: (p.coins || 0) + quest.rewardCoins,
      dailyQuests: updatedQuests,
    });
  }, [persist]);

  const buyTheme = useCallback((themeId: string, price: number): boolean => {
    const p = progressRef.current;
    const owned = p.ownedThemes || ['garden'];
    if (owned.includes(themeId)) return false;
    if ((p.coins || 0) < price) return false;
    persist({
      ...p,
      coins: p.coins - price,
      ownedThemes: [...owned, themeId],
      activeTheme: themeId,
    });
    return true;
  }, [persist]);

  const equipTheme = useCallback((themeId: string): void => {
    const p = progressRef.current;
    const owned = p.ownedThemes || ['garden'];
    if (!owned.includes(themeId)) return;
    persist({ ...p, activeTheme: themeId });
  }, [persist]);

  const buyOutfit = useCallback((outfit: Outfit): boolean => {
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

  const equipOutfit = useCallback((id: string): void => {
    const p = progressRef.current;
    if (!(p.ownedOutfits || ['none']).includes(id)) return;
    persist({ ...p, outfit: id });
  }, [persist]);

  return (
    <ProgressContext.Provider value={{
      ...progress,
      loaded,
      completeLesson,
      buyOutfit,
      equipOutfit,
      persist,
      claimQuestReward,
      buyTheme,
      equipTheme,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = (): ProgressContextType => {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
};
