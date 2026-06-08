import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Mascot from '../components/Mascot';
import Pop from '../components/Pop';
import { PAL } from '../theme';
import { usePronunciationAudio } from '../utils/audio';
import { playSfx } from '../utils/sfx';

export default function QuizScreen({ route, navigation }) {
  const { topic, words, allWords } = route.params;
  const insets = useSafeAreaInsets();

  // Distractors are drawn from the whole topic (falls back to studied words),
  // so options are varied and less predictable across questions.
  const distractorPool = allWords && allWords.length >= 4 ? allWords : words;

  const [idx, setIdx] = useState(0);

  // Per-question state (no hearts / no penalty — child retries until correct).
  const [attempted, setAttempted] = useState(false); // any wrong tap this question?
  const [solved, setSolved] = useState(false);
  const [wrongSet, setWrongSet] = useState([]);       // word_en tapped wrong -> dimmed
  const [shakeMap, setShakeMap] = useState({});       // word_en -> shake counter

  const firstTryRef = useRef(0); // # solved with no wrong attempt (for stars)

  const w = words[idx];
  const { play: playSound } = usePronunciationAudio(w?.audio_url, {
    autoPlayKey: idx,
    autoPlayDelay: 500,
    fallbackText: w?.word_en,
  });

  // 4 options for the current word.
  const options = useMemo(() => {
    if (!w) return [];
    const pool = distractorPool.filter(x => x.word_en !== w.word_en);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    return [...distractors, w].sort(() => Math.random() - 0.5);
  }, [idx, w, distractorPool]);


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

  const onPick = (opt) => {
    if (solved) return;
    const isCorrect = opt.word_en === w.word_en;

    if (isCorrect) {
      playSfx('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!attempted) firstTryRef.current += 1;
      setSolved(true);
      setTimeout(advance, 1300);
    } else {
      playSfx('wrong');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setAttempted(true);
      setWrongSet(prev => (prev.includes(opt.word_en) ? prev : [...prev, opt.word_en]));
      setShakeMap(prev => ({ ...prev, [opt.word_en]: (prev[opt.word_en] || 0) + 1 }));
    }
  };

  if (!w) return null;

  const tColor = PAL[topic.color] || PAL.primary;
  const tColorDark = PAL[`${topic.color}Dark`] || PAL.primaryDark;

  // After 2 wrong tries, gently reveal the correct answer to scaffold (no failure).
  const showHint = !solved && wrongSet.length >= 2;

  // Bottom feedback bar state
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

      <View style={styles.optionsGrid}>
        {options.map((opt, i) => {
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

      {feedback && (
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
  audioSection: { paddingHorizontal: 22, paddingTop: 24, alignItems: 'center' },
  bigAudioBtn: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', borderBottomWidth: 8,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  optionsGrid: {
    flex: 1, paddingHorizontal: 18, paddingBottom: 16, paddingTop: 32,
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
});
