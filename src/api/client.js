import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

const CMS_API_URL = process.env.EXPO_PUBLIC_CMS_API_URL;
const CMS_PORT = process.env.EXPO_PUBLIC_CMS_PORT || '8000';

const normalizeUrl = (url) => url.replace(/\/+$/, '');

const getExpoDevServerHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;

  const match = scriptURL.match(/^https?:\/\/([^/:?#]+)(?::\d+)?(?:[/?#]|$)/);
  return match?.[1] || null;
};

const getDefaultHost = () => {
  const devServerHost = getExpoDevServerHost();

  if (devServerHost && !['localhost', '127.0.0.1', '::1'].includes(devServerHost)) {
    return devServerHost;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
};

export const API_URL = normalizeUrl(
  CMS_API_URL || `http://${getDefaultHost()}:${CMS_PORT}/api`
);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const getApiOrigin = () => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return null;
  }
};

export const normalizeMediaUrl = (url) => {
  if (!url) return null;

  const value = String(url).trim();
  if (!value) return null;

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return value;

  try {
    const apiUrl = new URL(apiOrigin);
    const mediaUrl = new URL(value);

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

const normalizeWordMedia = (word) => ({
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

export const getTopics = async () => {
  const response = await client.get('/topics');
  return response.data;
};

export const getWordsByTopic = async (topicId) => {
  const response = await client.get(`/topics/${topicId}/words`);
  return Array.isArray(response.data) ? response.data.map(normalizeWordMedia) : response.data;
};

export default client;
