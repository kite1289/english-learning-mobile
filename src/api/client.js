import axios from 'axios';

const CMS_API_URL = process.env.EXPO_PUBLIC_CMS_API_URL;
const DEFAULT_CMS_API_URL = 'http://139.162.60.184:8001/api';

const normalizeUrl = (url) => url.replace(/\/+$/, '');

export const API_URL = normalizeUrl(
  CMS_API_URL || DEFAULT_CMS_API_URL
);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const REMOTE_URL_PATTERN = /https?:\/\//i;

const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractWrappedRemoteUrl = (value) => {
  const decodedValue = safeDecodeURIComponent(value);
  const remoteUrlMatch = decodedValue.match(REMOTE_URL_PATTERN);
  if (!remoteUrlMatch) return null;

  const remoteUrlIndex = remoteUrlMatch.index;
  if (remoteUrlIndex === 0) return null;

  const prefix = decodedValue.slice(0, remoteUrlIndex);
  if (!prefix.includes('/storage/')) return null;

  return decodedValue.slice(remoteUrlIndex);
};

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
