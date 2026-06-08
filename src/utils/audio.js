import { useCallback, useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Speech from 'expo-speech';

let audioModePromise = null;

const ensurePronunciationAudioMode = async () => {
  if (!audioModePromise) {
    audioModePromise = setAudioModeAsync({
      playsInSilentMode: true,
    }).catch((error) => {
      audioModePromise = null;
      console.log('Error configuring audio mode:', error);
    });
  }

  await audioModePromise;
};

const getPlaybackRate = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 1);

const speakFallback = (text, requestedRate = 1) => {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return;
  const rate = getPlaybackRate(requestedRate);

  Speech.stop().catch(() => {});
  Speech.speak(value, { language: 'en-US', rate: Math.min(Math.max(rate * 0.85, 0.6), 1) });
};

export const usePronunciationAudio = (source, { autoPlayKey, autoPlayDelay = 0, fallbackText } = {}) => {
  const audioSource = useMemo(() => (source ? { uri: source } : null), [source]);
  const player = useAudioPlayer(audioSource, {
    updateInterval: 150,
  });
  const status = useAudioPlayerStatus(player);
  const playRef = useRef(null);
  const sourceVersionRef = useRef(0);

  useEffect(() => {
    sourceVersionRef.current += 1;
  }, [source]);

  const play = useCallback(async (requestedRate = 1) => {
    const rate = getPlaybackRate(requestedRate);

    if (!source) {
      speakFallback(fallbackText, rate);
      return;
    }

    const playSourceVersion = sourceVersionRef.current;
    await ensurePronunciationAudioMode();

    if (playSourceVersion !== sourceVersionRef.current) {
      return;
    }

    try {
      player.setPlaybackRate?.(rate, 'high');

      if (player.isLoaded || status.isLoaded || status.didJustFinish) {
        await player.seekTo(0).catch(() => {});
      }

      player.play();
    } catch (error) {
      console.log('Error playing sound:', error);
      speakFallback(fallbackText, rate);
    }
  }, [fallbackText, player, source, status.didJustFinish, status.isLoaded]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (autoPlayKey === undefined || (!source && !fallbackText)) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      playRef.current?.();
    }, autoPlayDelay);

    return () => {
      clearTimeout(timeout);
    };
  }, [autoPlayDelay, autoPlayKey, fallbackText, source]);

  return { play };
};
