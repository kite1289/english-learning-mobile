import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import Mascot from '../components/Mascot';
import Pop from '../components/Pop';
import { PAL } from '../theme';
import { usePronunciationAudio } from '../utils/audio';
import { playSfx } from '../utils/sfx';
import { getCachedAssetUri } from '../utils/cache';
import { Word } from '../types';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
  const { topic, words, allWords } = route.params;
  const insets = useSafeAreaInsets();

  const distractorPool = allWords && allWords.length >= 4 ? allWords : words;
  const [idx, setIdx] = useState(0);

  // Per-question state
  const [attempted, setAttempted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [wrongSet, setWrongSet] = useState<string[]>([]);
  const [shakeMap, setShakeMap] = useState<Record<string, number>>({});

  const firstTryRef = useRef(0);
  const w = words[idx];

  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Cached assets state
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [cachedOptions, setCachedOptions] = useState<Word[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // 4 options for the current word
  const options = useMemo(() => {
    if (!w) return [];
    const pool = distractorPool.filter(x => x.word_en !== w.word_en);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    return [...distractors, w].sort(() => Math.random() - 0.5);
  }, [idx, w, distractorPool]);

  // Resolve cached asset URIs for the current word and option images
  useEffect(() => {
    if (!w) return;
    setLoadingAssets(true);
    setCachedAudioUrl(w.audio_url || null);
    setRecordedUri(null);

    const resolveAssets = async () => {
      // Resolve audio URI
      if (w.audio_url) {
        const audioUri = await getCachedAssetUri(w.audio_url);
        if (audioUri) setCachedAudioUrl(audioUri);
      }

      // Resolve option image URIs
      const resolved = await Promise.all(
        options.map(async (opt) => {
          if (opt.image_url) {
            const cachedUri = await getCachedAssetUri(opt.image_url);
            if (cachedUri) {
              return { ...opt, image_url: cachedUri };
            }
          }
          return opt;
        })
      );
      setCachedOptions(resolved);
      setLoadingAssets(false);
    };

    resolveAssets();
  }, [idx, w]);

  const { play: playSound } = usePronunciationAudio(cachedAudioUrl, {
    autoPlayKey: idx,
    autoPlayDelay: 500,
    fallbackText: w?.word_en,
  });

  const advance = () => {
    if (idx + 1 < words.length) {
      setAttempted(false);
      setSolved(false);
      setWrongSet([]);
      setShakeMap({});
      setIdx(idx + 1);
    } else {
      navigation.navigate('Match', { topic, words, correct: firstTryRef.current });
    }
  };

  const onPick = (opt: Word) => {
    if (solved) return;
    const isCorrect = opt.word_en === w.word_en;

    if (isCorrect) {
      playSfx('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!attempted) firstTryRef.current += 1;
      setSolved(true);
    } else {
      playSfx('wrong');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setAttempted(true);
      setWrongSet(prev => (prev.includes(opt.word_en) ? prev : [...prev, opt.word_en]));
      setShakeMap(prev => ({ ...prev, [opt.word_en]: (prev[opt.word_en] || 0) + 1 }));
    }
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Microphone permission not granted');
        return;
      }

      Speech.stop();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordedUri(null);
    } catch (err) {
      console.log('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.log('Failed to stop recording', err);
    }
  };

  const playRecordedVoice = async () => {
    if (!recordedUri) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
      await sound.playAsync();
    } catch (err) {
      console.log('Failed to play recorded voice', err);
    }
  };

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  if (!w) return null;

  const tColor = PAL[topic.color] || PAL.primary;
  const tColorDark = PAL[`${topic.color}Dark`] || PAL.primaryDark;

  const showHint = !solved && wrongSet.length >= 2;

  let feedback = null;
  if (solved) {
    feedback = { mood: 'wow', title: 'Tuyệt vời! 🎉', sub: `Đúng là "${w.word_en}" — ${w.word_vi}`, color: PAL.mintDark, bg: PAL.mint };
  } else if (attempted) {
    feedback = { mood: 'happy', title: 'Gần đúng rồi, thử lại nha 💪', sub: 'Nghe lại rồi chọn hình khác nhé!', color: tColorDark, bg: tColor };
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Quay lại">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {Array.from({ length: words.length }).map((_, i) => (
            <View key={i} style={[
              styles.progressDot,
              { backgroundColor: i < idx + (solved ? 1 : 0) ? tColor : i === idx ? tColor + '66' : 'rgba(0,0,0,0.08)' }
            ]} />
          ))}
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Nghe và chọn hình đúng 🤔</Text>
        <Text style={styles.subtitle}>Bé bấm vào loa để nghe lại nhé</Text>
      </View>

      <View style={styles.audioSection}>
        <Pop popKey={idx} entrance>
          <TouchableOpacity
            style={[styles.bigAudioBtn, { backgroundColor: tColor, borderBottomColor: tColorDark }]}
            onPress={() => playSound()}
            accessibilityLabel="Nghe phát âm"
          >
            <Text style={{ fontSize: 50, color: '#fff' }}>🔊</Text>
          </TouchableOpacity>
        </Pop>
      </View>

      {loadingAssets ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tColor} />
        </View>
      ) : (
        <View style={styles.optionsGrid}>
          {cachedOptions.map((opt, i) => {
            const isCorrectOpt = opt.word_en === w.word_en;
            const isDimmed = wrongSet.includes(opt.word_en);
            const highlight = (solved && isCorrectOpt) || (showHint && isCorrectOpt);

            let bg = PAL.surface;
            let borderColor = 'rgba(0,0,0,0.06)';
            let shadowColor = 'rgba(0,0,0,0.08)';
            let shadowOpacity = 1;
            if (highlight) {
              bg = PAL.mint + '33';
              borderColor = PAL.mintDark;
              shadowOpacity = 0;
            } else if (isDimmed) {
              bg = PAL.surface;
              borderColor = 'rgba(0,0,0,0.06)';
            }

            return (
              <Pop
                key={opt.word_en + i}
                style={styles.optionWrap}
                popKey={solved && isCorrectOpt ? 'solved' : undefined}
                shakeKey={shakeMap[opt.word_en]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onPick(opt)}
                  disabled={solved || isDimmed}
                  accessibilityLabel={opt.word_en}
                  style={[
                    styles.optionBtn,
                    { backgroundColor: bg, borderColor, shadowColor, shadowOpacity, opacity: isDimmed ? 0.4 : 1 },
                  ]}
                >
                  {opt.image_url ? (
                    <Image source={{ uri: opt.image_url }} style={styles.optionImg} resizeMode="contain" />
                  ) : (
                    <Text style={styles.optionEmoji}>{opt.emoji || '❓'}</Text>
                  )}
                </TouchableOpacity>
              </Pop>
            );
          })}
        </View>
      )}

      {solved && (
        <Pop entrance popKey="voice" style={styles.voicePracticeCard}>
          <Text style={styles.voiceTitle}>🎙️ Bé tập phát âm cùng Gấu nhé!</Text>
          <View style={styles.voiceRow}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                isRecording && styles.micBtnRecording,
                { shadowColor: isRecording ? PAL.coralDark : PAL.primaryDark }
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.7}
            >
              <Text style={styles.micEmoji}>{isRecording ? '🔴' : '🎙️'}</Text>
            </TouchableOpacity>

            <View style={styles.audioControls}>
              {recordedUri && (
                <TouchableOpacity style={styles.soundControlBtn} onPress={playRecordedVoice}>
                  <Text style={styles.soundControlEmoji}>🐻</Text>
                  <Text style={styles.soundControlText}>Nghe bé nói</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.soundControlBtn} onPress={() => playSound()}>
                <Text style={styles.soundControlEmoji}>🔊</Text>
                <Text style={styles.soundControlText}>Nghe máy đọc</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.voiceStatusText, isRecording && { color: PAL.coral, fontWeight: '700' }]}>
            {isRecording ? 'Gấu đang nghe bé... 🐻👂' : recordedUri ? 'Bé đọc giỏi quá! Hãy nghe lại hoặc bấm Tiếp tục.' : 'Bấm giữ Mic để ghi âm giọng nói'}
          </Text>

          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: PAL.mint, borderBottomColor: PAL.mintDark }]}
            onPress={advance}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Tiếp tục →</Text>
          </TouchableOpacity>
        </Pop>
      )}

      {!solved && feedback && (
        <View style={[styles.feedbackSlide, { backgroundColor: feedback.bg + '22', borderTopColor: feedback.color + '55' }]}>
          <Mascot size={50} mood={feedback.mood} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.feedbackTitle, { color: feedback.color }]}>{feedback.title}</Text>
            <Text style={styles.feedbackSubtitle}>{feedback.sub}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 10, borderRadius: 5 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '700', color: PAL.ink },
  subtitle: { fontSize: 14, color: PAL.ink, opacity: 0.55, marginTop: 2 },
  audioSection: { paddingHorizontal: 22, paddingTop: 18, alignItems: 'center' },
  bigAudioBtn: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center', borderBottomWidth: 8,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  optionsGrid: {
    flex: 1, paddingHorizontal: 18, paddingBottom: 16, paddingTop: 20,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'flex-start',
  },
  optionWrap: { width: '47%', marginBottom: 16 },
  optionBtn: {
    width: '100%', aspectRatio: 1, borderRadius: 24,
    borderWidth: 2, padding: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  optionEmoji: { fontSize: 70 },
  optionImg: { width: '90%', height: '90%' },
  feedbackSlide: {
    paddingHorizontal: 22, paddingVertical: 16,
    borderTopWidth: 2,
    flexDirection: 'row', alignItems: 'center',
  },
  feedbackTitle: { fontSize: 18, fontWeight: '700' },
  feedbackSubtitle: { fontSize: 14, color: PAL.ink, opacity: 0.75, marginTop: 2 },
  voicePracticeCard: {
    backgroundColor: PAL.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    borderWidth: 3,
    borderColor: PAL.mint + '33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    alignItems: 'center',
  },
  voiceTitle: { fontSize: 18, fontWeight: '700', color: PAL.ink, marginBottom: 16 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 24, width: '100%', justifyContent: 'center' },
  micBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PAL.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: PAL.primaryDark,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 0,
  },
  micBtnRecording: {
    backgroundColor: PAL.coral,
    borderBottomColor: PAL.coralDark,
    transform: [{ scale: 1.08 }],
  },
  micEmoji: { fontSize: 36, color: '#fff' },
  audioControls: { flexDirection: 'column', gap: 8 },
  soundControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 8,
  },
  soundControlEmoji: { fontSize: 18 },
  soundControlText: { fontSize: 14, fontWeight: '700', color: PAL.ink },
  voiceStatusText: { fontSize: 13, color: PAL.ink, opacity: 0.6, marginTop: 16, textAlign: 'center' },
  continueBtn: {
    width: '100%',
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 5,
    marginTop: 20,
  },
  continueBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
