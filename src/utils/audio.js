import { useCallback, useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

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

export const usePronunciationAudio = (source, { autoPlayKey, autoPlayDelay = 0 } = {}) => {
  const player = useAudioPlayer(source || null);
  const status = useAudioPlayerStatus(player);
  const pendingPlayRef = useRef(false);
  const playRef = useRef(null);
  const sourceVersionRef = useRef(0);

  useEffect(() => {
    sourceVersionRef.current += 1;
    pendingPlayRef.current = false;
  }, [source]);

  const play = useCallback(async () => {
    if (!source) return;

    const playSourceVersion = sourceVersionRef.current;
    pendingPlayRef.current = true;
    await ensurePronunciationAudioMode();

    if (playSourceVersion !== sourceVersionRef.current) {
      return;
    }

    if (!player.isLoaded && !status.isLoaded) {
      return;
    }

    pendingPlayRef.current = false;

    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }, [player, source, status.isLoaded]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (!pendingPlayRef.current || !source || (!player.isLoaded && !status.isLoaded)) {
      return;
    }

    pendingPlayRef.current = false;

    player.seekTo(0)
      .then(() => player.play())
      .catch((error) => {
        console.log('Error playing sound:', error);
      });
  }, [player, source, status.isLoaded]);

  useEffect(() => {
    if (autoPlayKey === undefined || !source) {
      pendingPlayRef.current = false;
      return undefined;
    }

    const timeout = setTimeout(() => {
      playRef.current?.();
    }, autoPlayDelay);

    return () => {
      clearTimeout(timeout);
      pendingPlayRef.current = false;
    };
  }, [autoPlayDelay, autoPlayKey, source]);

  return { play };
};
