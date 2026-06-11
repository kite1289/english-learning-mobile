import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Topic, Word } from '../types';

const CMS_API_URL = process.env.EXPO_PUBLIC_CMS_API_URL;
const DEFAULT_CMS_API_URL = 'http://139.162.60.184:8001/api';

const normalizeUrl = (url: string): string => url.replace(/\/+$/, '');

export const API_URL = normalizeUrl(
  CMS_API_URL || DEFAULT_CMS_API_URL
);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const REMOTE_URL_PATTERN = /https?:\/\//i;

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractWrappedRemoteUrl = (value: string): string | null => {
  const decodedValue = safeDecodeURIComponent(value);
  const remoteUrlMatch = decodedValue.match(REMOTE_URL_PATTERN);
  if (!remoteUrlMatch) return null;

  const remoteUrlIndex = remoteUrlMatch.index;
  if (remoteUrlIndex === undefined || remoteUrlIndex === 0) return null;

  const prefix = decodedValue.slice(0, remoteUrlIndex);
  if (!prefix.includes('/storage/')) return null;

  return decodedValue.slice(remoteUrlIndex);
};

const getApiOrigin = (): string | null => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return null;
  }
};

export const normalizeMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const value = String(url).trim();
  if (!value) return null;

  const wrappedRemoteUrl = extractWrappedRemoteUrl(value);
  if (wrappedRemoteUrl) return wrappedRemoteUrl;

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return value;

  try {
    const apiUrl = new URL(apiOrigin);
    const mediaUrl = new URL(value);
    const wrappedAbsoluteRemoteUrl = extractWrappedRemoteUrl(mediaUrl.pathname);
    if (wrappedAbsoluteRemoteUrl) return wrappedAbsoluteRemoteUrl;

    if (LOCAL_HOSTS.has(mediaUrl.hostname) && mediaUrl.host !== apiUrl.host) {
      mediaUrl.protocol = apiUrl.protocol;
      mediaUrl.host = apiUrl.host;
    }

    return mediaUrl.toString();
  } catch {
    const path = value.startsWith('/') ? value : `/${value}`;
    return new URL(path, apiOrigin).toString();
  }
};

const normalizeWordMedia = (word: any): Word => ({
  ...word,
  image_url: normalizeMediaUrl(word.image_url),
  audio_url: normalizeMediaUrl(word.audio_url),
});

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

client.interceptors.response.use(
  response => response,
  error => {
    console.log('CMS API request failed:', {
      baseURL: API_URL,
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// Offline Cache Keys
const CACHE_TOPICS_KEY = 'cache_topics_v1';
const cacheWordsKey = (topicId: number | string) => `cache_words_v1_${topicId}`;

export const getTopics = async (): Promise<Topic[]> => {
  try {
    const response = await client.get('/topics');
    const topics: Topic[] = response.data;
    // Cache the topics for offline usage
    await AsyncStorage.setItem(CACHE_TOPICS_KEY, JSON.stringify(topics)).catch(() => {});
    return topics;
  } catch (err) {
    console.log('Error fetching topics online, loading from cache...');
    const cached = await AsyncStorage.getItem(CACHE_TOPICS_KEY).catch(() => null);
    if (cached) {
      return JSON.parse(cached);
    }
    throw err;
  }
};

export const getWordsByTopic = async (topicId: number | string): Promise<Word[]> => {
  try {
    const response = await client.get(`/topics/${topicId}/words`);
    const rawWords = response.data;
    const words: Word[] = Array.isArray(rawWords) ? rawWords.map(normalizeWordMedia) : [];
    // Cache the words for offline usage
    await AsyncStorage.setItem(cacheWordsKey(topicId), JSON.stringify(words)).catch(() => {});
    return words;
  } catch (err) {
    console.log(`Error fetching words for topic ${topicId} online, loading from cache...`);
    const cached = await AsyncStorage.getItem(cacheWordsKey(topicId)).catch(() => null);
    if (cached) {
      return JSON.parse(cached);
    }
    throw err;
  }
};

export default client;
