import { AppState } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';

// Single source of truth for the audio session (playback + recording).
//
// Why this exists: recording flips the iOS session to PlayAndRecord (routes to
// the quiet earpiece) and can leave Android focus ducked. If the playback mode is
// only applied once at startup, the session never recovers and audio stays tiny
// until the app is restarted. So we re-apply the playback mode (cheaply, throttled)
// before every playback and whenever the app returns to foreground, and we route
// recording through applyRecordingAudioMode so there is one owner of the session.
const PLAYBACK_AUDIO_MODE = {
  playsInSilentMode: true,
  interruptionMode: 'duckOthers' as const,
  allowsRecording: false,
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
};

const THROTTLE_MS = 1000;
let lastAppliedAt = 0;

// Re-applies the playback audio mode. Throttled so rapid SFX don't spam the
// native bridge; pass `force` to bypass the throttle (e.g. right after recording).
export const applyPlaybackAudioMode = async (force = false): Promise<void> => {
  const now = Date.now();
  if (!force && now - lastAppliedAt < THROTTLE_MS) return;
  lastAppliedAt = now;

  try {
    await setAudioModeAsync(PLAYBACK_AUDIO_MODE);
  } catch (error) {
    lastAppliedAt = 0;
    console.log('Error configuring playback audio mode:', error);
  }
};

// Switches the session into recording mode (iOS PlayAndRecord). Always pair a
// successful recording with applyPlaybackAudioMode(true) afterwards to restore
// normal playback routing/volume.
export const applyRecordingAudioMode = async (): Promise<void> => {
  // Invalidate the playback throttle so the post-recording restore re-applies.
  lastAppliedAt = 0;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: 'duckOthers',
    });
  } catch (error) {
    console.log('Error configuring recording audio mode:', error);
  }
};

let appStateSubscribed = false;

// Restores the playback session when the app returns to foreground — recovers
// from Android audio-focus loss / interruptions that left the volume ducked.
export const initPlaybackAudioModeLifecycle = (): void => {
  if (appStateSubscribed) return;
  appStateSubscribed = true;

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      applyPlaybackAudioMode(true);
    }
  });
};
