import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'progress.v1';

export const DEFAULT_PROGRESS = {
  coins: 0,
  stickers: [],
  streak: 0,
  lastPlayed: null,
  outfit: 'none',
  ownedOutfits: ['none'],
};

export const loadProgress = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch (error) {
    console.log('loadProgress error:', error);
    return { ...DEFAULT_PROGRESS };
  }
};

export const saveProgress = async (progress) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  } catch (error) {
    console.log('saveProgress error:', error);
  }
};
