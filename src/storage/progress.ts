import AsyncStorage from '@react-native-async-storage/async-storage';
import { Progress } from '../types';

const KEY = 'progress.v1';

export const DEFAULT_PROGRESS: Progress = {
  coins: 0,
  stickers: [],
  streak: 0,
  lastPlayed: null,
  outfit: 'none',
  ownedOutfits: ['none'],
  activeTheme: 'garden',
  ownedThemes: ['garden'],
  lastQuestDate: null,
};

export const loadProgress = async (): Promise<Progress> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch (error) {
    console.log('loadProgress error:', error);
    return { ...DEFAULT_PROGRESS };
  }
};

export const saveProgress = async (progress: Progress): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  } catch (error) {
    console.log('saveProgress error:', error);
  }
};
