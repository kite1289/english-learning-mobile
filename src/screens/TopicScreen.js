import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mascot from '../components/Mascot';
import { PAL } from '../theme';
import { getTopics } from '../api/client';

export default function TopicScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopics().then(data => {
      setTopics(data);
      setLoading(false);
    }).catch(err => {
      console.log('Error fetching topics:', err);
      setLoading(false);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Mascot size={48} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.greetingText}>Xin chào, Bé!</Text>
            <Text style={styles.titleText}>Học gì hôm nay? ✨</Text>
          </View>
        </View>
        <View style={styles.fireBadge}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={styles.fireText}>7</Text>
        </View>
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.sectionTitle}>Chọn chủ đề</Text>
        <Text style={styles.sectionSubtitle}>Bé thích học gì nào?</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PAL.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {topics.map((t, i) => (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Count', { topic: t })}
              style={[
                styles.topicCard,
                {
                  backgroundColor: t.color ? PAL[t.color] : PAL.primary,
                  transform: [{ rotate: i % 2 === 0 ? '-1deg' : '1deg' }],
                  shadowColor: t.color ? PAL[`${t.color}Dark`] : PAL.primaryDark,
                }
              ]}
            >
              <View style={styles.cardBgDeco1} />
              <View style={styles.cardBgDeco2} />
              <Text style={styles.emojiText}>{t.emoji}</Text>
              <View>
                <Text style={styles.cardEn}>{t.name_en}</Text>
                <Text style={styles.cardVi}>{t.name_vi}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  header: {
    paddingHorizontal: 22, paddingTop: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontSize: 13, color: PAL.ink, opacity: 0.6, fontWeight: '600' },
  titleText: { fontSize: 18, color: PAL.ink, fontWeight: '700' },
  fireBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, backgroundColor: PAL.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 0,
  },
  fireText: { fontSize: 16, color: PAL.ink, fontWeight: '700' },
  subtitleContainer: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 14 },
  sectionTitle: { fontSize: 32, color: PAL.ink, fontWeight: '700' },
  sectionSubtitle: { fontSize: 15, color: PAL.ink, opacity: 0.6, marginTop: 4 },
  grid: {
    paddingHorizontal: 18, paddingBottom: 24,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },
  topicCard: {
    width: '47%', borderRadius: 28, padding: 16,
    minHeight: 168, justifyContent: 'space-between',
    marginBottom: 14, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  cardBgDeco1: {
    position: 'absolute', top: -16, right: -16,
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.22)'
  },
  cardBgDeco2: {
    position: 'absolute', bottom: -22, left: -10,
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.14)'
  },
  emojiText: { fontSize: 56, lineHeight: 65 },
  cardEn: { fontSize: 22, color: '#fff', fontWeight: '700' },
  cardVi: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});
