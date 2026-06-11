import { documentDirectory, getInfoAsync, makeDirectoryAsync, downloadAsync } from 'expo-file-system/legacy';

const CACHE_DIR = `${documentDirectory}cached_assets/`;

// Ensure cache directory exists
const ensureCacheDir = async (): Promise<void> => {
  try {
    const dirInfo = await getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.log('Error creating cache directory:', error);
  }
};

// Clean/sanitize filename
const getCacheFilename = (url: string): string => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1] || 'asset';
  // Add a hash of the URL to prevent collisions
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return `${Math.abs(hash)}_${filename}`;
};

export const getCachedAssetUri = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) return null;
  
  // Only cache remote HTTP(S) resources
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  await ensureCacheDir();
  const filename = getCacheFilename(url);
  const localUri = `${CACHE_DIR}${filename}`;

  try {
    const fileInfo = await getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }

    // Download file
    const downloadResult = await downloadAsync(url, localUri);
    if (downloadResult.status === 200) {
      return localUri;
    }
    return url; // Fallback on non-200 status
  } catch (error) {
    console.log(`Failed to cache asset: ${url}`, error);
    return url; // Fallback on error
  }
};

// Preload a list of assets
export const preloadAssets = async (urls: (string | null | undefined)[]): Promise<void> => {
  const activeUrls = urls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  await Promise.all(activeUrls.map(url => getCachedAssetUri(url).catch(() => null)));
};
