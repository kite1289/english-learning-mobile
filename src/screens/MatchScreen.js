import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Mascot from '../components/Mascot';
import Pop from '../components/Pop';
import Confetti from '../components/Confetti';
import { PAL } from '../theme';
import { usePronunciationAudio } from '../utils/audio';
import { playSfx } from '../utils/sfx';

const MAX_PAIRS = 6;

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export default function MatchScreen({ route, navigation }) {
  const { topic, words, correct } = route.params;
  const insets = useSafeAreaInsets();

  const tColor = PAL[topic.color] || PAL.primary;
  const tColorDark = PAL[`${topic.color}Dark`] || PAL.primaryDark;

  // Build a deck of image/image pairs from the studied words.
  const deck = useMemo(() => {
    const chosen = shuffle(words).slice(0, Math.min(words.length, MAX_PAIRS));
    const cards = [];
    chosen.forEach((wd, p) => {
      cards.push({ key: `${p}-a`, pair: p, word: wd });
      cards.push({ key: `${p}-b`, pair: p, word: wd });
    });
    return shuffle(cards);
  }, [words]);

  const totalPairs = deck.length / 2;

  const [flipped, setFlipped] = useState([]); // card indices currently face up
  const [matched, setMatched] = useState([]); // matched card keys
  const [shakeMap, setShakeMap] = useState({});
  const [busy, setBusy] = useState(false);
  const [matchedAudioCue, setMatchedAudioCue] = useState(null);
  const navigatedRef = useRef(false);
  usePronunciationAudio(matchedAudioCue?.audio_url, {
    autoPlayKey: matchedAudioCue?.key,
    autoPlayDelay: 300,
    fallbackText: matchedAudioCue?.word_en,
  });

  const onTap = (i) => {
    const card = deck[i];
    if (busy || matched.includes(card.key) || flipped.includes(i)) return;

    if (flipped.length === 0) {
      Haptics.selectionAsync().catch(() => {});
      setFlipped([i]);
      return;
    }

    const j = flipped[0];
    setFlipped([j, i]);
    setBusy(true);

    if (deck[j].pair === card.pair) {
      playSfx('correct');
      setMatchedAudioCue({ ...card.word, key: `${card.pair}-${Date.now()}` });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => {
        setMatched((m) => [...m, deck[j].key, card.key]);
        setFlipped([]);
        setBusy(false);
      }, 550);
    } else {
      playSfx('wrong');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setTimeout(() => {
        setShakeMap((s) => ({ ...s, [j]: (s[j] || 0) + 1, [i]: (s[i] || 0) + 1 }));
        setFlipped([]);
        setBusy(false);
      }, 850);
    }
  };

  // Celebrate + continue when everything is matched.
  useEffect(() => {
    if (matched.length > 0 && matched.length === deck.length && !navigatedRef.current) {
      navigatedRef.current = true;
      playSfx('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const t = setTimeout(() => {
        navigation.navigate('Result', { topic, words, correct });
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [matched, deck.length]);

  const matchedPairs = matched.length / 2;
  const done = matched.length === deck.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Confetti run={done} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Quay lại">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {Array.from({ length: totalPairs }).map((_, i) => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i < matchedPairs ? tColor : 'rgba(0,0,0,0.08)' }]} />
          ))}
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Tìm cặp giống nhau 🧩</Text>
        <Text style={styles.subtitle}>Lật 2 thẻ giống nhau để ghi nhớ từ nhé!</Text>
      </View>

      <View style={styles.grid}>
        {deck.map((card, i) => {
          const isUp = flipped.includes(i) || matched.includes(card.key);
          const isMatched = matched.includes(card.key);
          return (
            <Pop key={card.key} style={styles.cardWrap} popKey={isMatched ? 'm' : undefined} shakeKey={shakeMap[i]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onTap(i)}
                disabled={isUp || busy}
                accessibilityLabel={isUp ? card.word.word_en : 'Thẻ úp'}
                style={[
                  styles.card,
                  isUp
                    ? { backgroundColor: PAL.surface, borderColor: isMatched ? PAL.mintDark : tColor }
                    : { backgroundColor: tColor, borderColor: tColorDark },
                ]}
              >
                {isUp ? (
                  card.word.image_url ? (
                    <Image source={{ uri: card.word.image_url }} style={styles.cardImg} resizeMode="contain" />
                  ) : (
                    <Text style={styles.cardEmoji}>{card.word.emoji || '❓'}</Text>
                  )
                ) : (
                  <Text style={styles.cardBack}>?</Text>
                )}
                {isMatched && <Text style={styles.cardLabel}>{card.word.word_en}</Text>}
              </TouchableOpacity>
            </Pop>
          );
        })}
      </View>

      {done && (
        <View style={styles.doneBar}>
          <Mascot size={50} mood="wow" />
          <Text style={styles.doneText}>Bé nhớ giỏi quá! 🎉</Text>
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
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: PAL.ink },
  subtitle: { fontSize: 14, color: PAL.ink, opacity: 0.55, marginTop: 2 },
  grid: {
    flex: 1, paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 12,
  },
  cardWrap: { width: '29%', aspectRatio: 0.82 },
  card: {
    flex: 1, borderRadius: 20, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 0,
  },
  cardImg: { width: '88%', height: '70%' },
  cardEmoji: { fontSize: 48 },
  cardBack: { fontSize: 40, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: PAL.ink, marginTop: 2 },
  doneBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 22, paddingVertical: 16,
    backgroundColor: PAL.mint + '22', borderTopWidth: 2, borderTopColor: PAL.mintDark + '55',
  },
  doneText: { fontSize: 18, fontWeight: '700', color: PAL.mintDark },
});
