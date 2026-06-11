import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PAL } from '../theme';
import { getWordsByTopic } from '../api/client';
import { usePronunciationAudio } from '../utils/audio';
import { getCachedAssetUri, preloadAssets } from '../utils/cache';
import Pop from '../components/Pop';
import { Word } from '../types';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Learn'>;

export default function LearnScreen({ route, navigation }: Props) {
  const { topic, count } = route.params;
  const insets = useSafeAreaInsets();
  
  const [words, setWords] = useState<Word[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    getWordsByTopic(topic.id).then(data => {
      const list = Array.isArray(data) ? data : [];
      const shuffled = [...list].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      setAllWords(list);
      setWords(selected);
      setLoading(false);

      // Pre-load all assets for the topic in the background
      const urlsToPreload = list.flatMap(w => [w.image_url, w.audio_url]);
      preloadAssets(urlsToPreload);
    }).catch(err => {
      console.log('Error fetching words:', err);
      setLoading(false);
    });
  }, [topic.id, count]);

  const currentWord = words[idx];

  // Resolve cached asset URIs whenever current word changes
  useEffect(() => {
    if (!currentWord) return;
    setCachedImageUrl(currentWord.image_url || null);
    setCachedAudioUrl(currentWord.audio_url || null);

    if (currentWord.image_url) {
      getCachedAssetUri(currentWord.image_url).then(uri => {
        if (uri) setCachedImageUrl(uri);
      });
    }
    if (currentWord.audio_url) {
      getCachedAssetUri(currentWord.audio_url).then(uri => {
        if (uri) setCachedAudioUrl(uri);
      });
    }
  }, [currentWord, idx]);

  const { play: playSound } = usePronunciationAudio(cachedAudioUrl, {
    autoPlayKey: idx,
    autoPlayDelay: 300,
    fallbackText: currentWord?.word_en,
  });

  const onNext = () => {
    if (idx + 1 < words.length) {
      setIdx(idx + 1);
    } else {
      navigation.navigate('Quiz', { topic, words, allWords });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PAL.primary} />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Không có dữ liệu từ vựng cho chủ đề này.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: PAL.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      </View>

      <View style={styles.content}>
        <Text style={styles.counterText}>Từ {idx + 1} / {words.length}</Text>

        <Pop entrance popKey={idx} style={[styles.card, { borderColor: tColor + '40', shadowColor: tColorDark }]}>
          <View style={[styles.cardDeco1, { backgroundColor: tColor + '40' }]} />

          {cachedImageUrl ? (
            <Image source={{ uri: cachedImageUrl }} style={styles.cardImage} resizeMode="contain" />
          ) : (
            <Text style={styles.cardEmoji}>{currentWord.emoji || '❓'}</Text>
          )}

          <Text style={styles.cardEn}>{currentWord.word_en}</Text>
          <Text style={styles.cardVi}>{currentWord.word_vi}</Text>

          <View style={styles.audioRow}>
            <TouchableOpacity
              style={[styles.audioBtn, { backgroundColor: tColor, borderBottomColor: tColorDark }]}
              onPress={() => playSound()}
              accessibilityLabel="Nghe phát âm"
            >
              <Text style={{ fontSize: 24, color: '#fff' }}>🔊</Text>
            </TouchableOpacity>
          </View>
        </Pop>

        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: tColor, borderBottomColor: tColorDark }]}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {idx + 1 === words.length ? 'Làm bài tập 🎯' : 'Tiếp theo →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 10, borderRadius: 5 },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18, justifyContent: 'space-between' },
  counterText: { textAlign: 'center', fontSize: 13, color: PAL.ink, opacity: 0.55, fontWeight: '600' },
  card: {
    backgroundColor: PAL.surface, borderRadius: 36, paddingVertical: 32, paddingHorizontal: 24,
    borderWidth: 3, alignItems: 'center', position: 'relative', overflow: 'hidden', marginVertical: 12,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20,
  },
  cardDeco1: { position: 'absolute', top: 16, left: 16, width: 10, height: 10, borderRadius: 5 },
  cardImage: { width: 150, height: 150, marginBottom: 14 },
  cardEmoji: { fontSize: 130, marginBottom: 14 },
  cardEn: { fontSize: 42, fontWeight: '700', color: PAL.ink, letterSpacing: -0.5 },
  cardVi: { fontSize: 16, fontWeight: '600', color: PAL.ink, opacity: 0.55, marginTop: 8 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  audioBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5,
  },
  nextBtn: {
    width: '100%', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 24,
    alignItems: 'center', borderBottomWidth: 5,
  },
  nextBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
});
