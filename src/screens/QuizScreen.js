import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mascot from '../components/Mascot';
import { PAL } from '../theme';
import { usePronunciationAudio } from '../utils/audio';

export default function QuizScreen({ route, navigation }) {
  const { topic, words } = route.params;
  const insets = useSafeAreaInsets();
  
  const [idx, setIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [correctCount, setCorrectCount] = useState(0);
  
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const w = words[idx];
  const { play: playSound } = usePronunciationAudio(w?.audio_url, {
    autoPlayKey: idx,
    autoPlayDelay: 500,
  });

  // Generate 4 options for the current word
  const options = useMemo(() => {
    if (!w) return [];
    // Here we need all words from this topic to pick distractors.
    // For simplicity, we only use `words` passed (the ones user studied)
    // If words.length < 4, we might not have enough distractors. 
    // Ideally we should pass allTopicWords from CountScreen.
    const pool = words.filter(x => x.word_en !== w.word_en);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    return [...distractors, w].sort(() => Math.random() - 0.5);
  }, [idx, w, words]);

  // Auto play on new question
  useEffect(() => {
    setPicked(null);
    setRevealed(false);
  }, [idx, w]);

  const onPick = (opt) => {
    if (revealed) return;
    setPicked(opt);
    setRevealed(true);
    
    const isCorrect = opt.word_en === w.word_en;
    
    setTimeout(() => {
      if (isCorrect) {
        setCorrectCount(c => c + 1);
      } else {
        setHearts(h => Math.max(0, h - 1));
      }
      
      if (idx + 1 < words.length) {
        setIdx(idx + 1);
      } else {
        navigation.navigate('Result', { topic, words, correct: isCorrect ? correctCount + 1 : correctCount });
      }
    }, 1500); // show feedback for 1.5s
  };

  if (!w) return null;

  const tColor = PAL[topic.color] || PAL.primary;
  const tColorDark = PAL[`${topic.color}Dark`] || PAL.primaryDark;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {Array.from({ length: words.length }).map((_, i) => (
            <View key={i} style={[
              styles.progressDot,
              { backgroundColor: i < idx + 1 ? tColor : 'rgba(0,0,0,0.08)' }
            ]} />
          ))}
        </View>
        <View style={styles.heartsBadge}>
          <Text style={{ fontSize: 16 }}>❤️</Text>
          <Text style={styles.heartsText}>{hearts}</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Nghe và chọn hình đúng 🤔</Text>
        <Text style={styles.subtitle}>Bé hãy bấm vào loa để nghe lại nhé</Text>
      </View>

      <View style={styles.audioSection}>
        <TouchableOpacity style={[styles.bigAudioBtn, { backgroundColor: tColor, borderBottomColor: tColorDark }]} onPress={playSound}>
          <Text style={{ fontSize: 50, color: '#fff' }}>🔊</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optionsGrid}>
        {options.map((opt, i) => {
          const isCorrect = opt.word_en === w.word_en;
          const isPicked = picked && picked.word_en === opt.word_en;
          
          let bg = PAL.surface;
          let borderColor = 'rgba(0,0,0,0.06)';
          let shadowColor = 'rgba(0,0,0,0.08)';
          
          if (revealed) {
            if (isCorrect) {
              bg = PAL.mint + '33';
              borderColor = PAL.mintDark;
              shadowColor = PAL.mintDark;
            } else if (isPicked) {
              bg = PAL.coral + '33';
              borderColor = PAL.coralDark;
              shadowColor = PAL.coralDark;
            } else {
              bg = PAL.surface;
            }
          }

          return (
            <TouchableOpacity
              key={opt.word_en + i}
              activeOpacity={0.8}
              onPress={() => onPick(opt)}
              disabled={revealed}
              style={[
                styles.optionBtn,
                { 
                  backgroundColor: bg,
                  borderColor: borderColor,
                  shadowColor: shadowColor,
                  transform: [{ translateY: isPicked ? 2 : 0 }]
                }
              ]}
            >
              {opt.image_url ? (
                <Image source={{ uri: opt.image_url }} style={styles.optionImg} resizeMode="contain" />
              ) : (
                <Text style={styles.optionEmoji}>{opt.emoji || '❓'}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {revealed && (
        <View style={[
          styles.feedbackSlide, 
          { 
            backgroundColor: picked.word_en === w.word_en ? PAL.mint + '22' : PAL.coral + '22',
            borderTopColor: picked.word_en === w.word_en ? PAL.mintDark + '55' : PAL.coralDark + '55'
          }
        ]}>
          <Mascot size={50} mood={picked.word_en === w.word_en ? 'happy' : 'sad'} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[
              styles.feedbackTitle,
              { color: picked.word_en === w.word_en ? PAL.mintDark : PAL.coralDark }
            ]}>
              {picked.word_en === w.word_en ? 'Tuyệt vời! 🎉' : 'Sai rồi 😢'}
            </Text>
            <Text style={styles.feedbackSubtitle}>
              {picked.word_en === w.word_en ? `Đúng là "${w.word_en}" — ${w.word_vi}` : `Đáp án đúng: "${w.word_en}"`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 10, borderRadius: 5 },
  heartsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,107,107,0.14)' },
  heartsText: { fontSize: 16, fontWeight: '700', color: '#E04E4E' },
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
  optionBtn: {
    width: '47%', aspectRatio: 1, borderRadius: 24,
    borderWidth: 2, padding: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  optionEmoji: { fontSize: 70 },
  optionImg: { width: '90%', height: '90%' },
  feedbackSlide: {
    paddingHorizontal: 22, paddingVertical: 16,
    borderTopWidth: 2, borderTopStyle: 'dashed',
    flexDirection: 'row', alignItems: 'center',
  },
  feedbackTitle: { fontSize: 18, fontWeight: '700' },
  feedbackSubtitle: { fontSize: 14, color: PAL.ink, opacity: 0.75, marginTop: 2 },
});
