import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PAL } from '../theme';

const COUNTS = [
  { n: 5,  en: 'Five',    label: 'Dễ thương',    stars: 1, color: 'mint' },
  { n: 10, en: 'Ten',     label: 'Vừa phải',     stars: 2, color: 'primary' },
  { n: 15, en: 'Fifteen', label: 'Siêu trí nhớ', stars: 3, color: 'coral' },
];

export default function CountScreen({ route, navigation }) {
  const { topic } = route.params;
  const insets = useSafeAreaInsets();

  const onPickCount = (c) => {
    navigation.navigate('Learn', { topic, count: c.n });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={[styles.topicBadge, { backgroundColor: (PAL[topic.color] || PAL.primary) + '24' }]}>
          <Text style={{ fontSize: 18 }}>{topic.emoji}</Text>
          <Text style={[styles.topicText, { color: PAL[`${topic.color}Dark`] || PAL.primaryDark }]}>
            {topic.name_en} · {topic.name_vi}
          </Text>
        </View>
        <Text style={styles.title}>Học bao nhiêu từ?</Text>
        <Text style={styles.subtitle}>Bé chọn độ dài bài học nhé!</Text>
      </View>

      <View style={styles.list}>
        {COUNTS.map((c) => (
          <TouchableOpacity
            key={c.n}
            activeOpacity={0.8}
            onPress={() => onPickCount(c)}
            style={styles.card}
            accessibilityLabel={`${c.n} từ vựng`}
          >
            <View style={[styles.iconBox, { backgroundColor: PAL[c.color], borderBottomColor: PAL[`${c.color}Dark`] }]}>
              <Text style={styles.iconText}>{c.n}</Text>
              <Text style={styles.iconEn}>{c.en}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.n} từ vựng</Text>
              <Text style={styles.cardSubtitle}>{c.label}</Text>
              <View style={styles.stars}>
                {[1,2,3].map(s => (
                  <Text key={s} style={{ fontSize: 16, opacity: s <= c.stars ? 1 : 0.2 }}>⭐</Text>
                ))}
              </View>
            </View>
            <Text style={{ fontSize: 26, color: PAL.ink, opacity: 0.3 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  backBtn: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center'
  },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  topicBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
  },
  topicText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 30, color: PAL.ink, fontWeight: '700', marginTop: 16 },
  subtitle: { fontSize: 15, color: PAL.ink, opacity: 0.6, marginTop: 4 },
  list: { flex: 1, paddingHorizontal: 22, paddingTop: 24, justifyContent: 'center', gap: 14 },
  card: {
    backgroundColor: PAL.surface, borderRadius: 26, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 10,
  },
  iconBox: {
    width: 68, height: 68, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4,
  },
  iconText: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 30 },
  iconEn: { fontSize: 11, fontWeight: '700', color: '#fff', opacity: 0.9 },
  cardTitle: { fontSize: 19, fontWeight: '700', color: PAL.ink },
  cardSubtitle: { fontSize: 13, color: PAL.ink, opacity: 0.6 },
  stars: { flexDirection: 'row', marginTop: 4, gap: 2 },
});
