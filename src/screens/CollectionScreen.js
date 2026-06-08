import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Mascot from '../components/Mascot';
import Pop from '../components/Pop';
import { PAL } from '../theme';
import { OUTFITS } from '../data/outfits';
import { useProgress } from '../context/ProgressContext';
import { playSfx } from '../utils/sfx';

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { coins, stickers = [], outfit, ownedOutfits = ['none'], buyOutfit, equipOutfit } = useProgress();

  const onPressOutfit = (o) => {
    if (o.id === outfit) return;
    if (ownedOutfits.includes(o.id)) {
      equipOutfit(o.id);
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    if (coins >= o.price) {
      if (buyOutfit(o)) {
        playSfx('correct');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Quay lại">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bộ sưu tập</Text>
        <View style={styles.coinBadge}>
          <Text style={{ fontSize: 18 }}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          <Mascot size={120} mood="happy" outfit={outfit} />
          <Text style={styles.previewName}>Bạn Gấu của bé</Text>
        </View>

        <Text style={styles.sectionTitle}>Trang phục mascot 👕</Text>
        <View style={styles.outfitGrid}>
          {OUTFITS.map((o) => {
            const owned = ownedOutfits.includes(o.id);
            const equipped = o.id === outfit;
            const affordable = coins >= o.price;

            let label = `${o.price} 🪙`;
            let btnStyle = styles.btnBuy;
            if (equipped) { label = 'Đang dùng'; btnStyle = styles.btnEquipped; }
            else if (owned) { label = 'Dùng'; btnStyle = styles.btnUse; }
            else if (!affordable) { btnStyle = styles.btnLocked; }

            return (
              <Pop key={o.id} style={styles.outfitCard} popKey={equipped ? 'eq' : undefined}>
                <View style={[styles.outfitPreview, equipped && { borderColor: PAL.mintDark }]}>
                  <Mascot size={60} mood="happy" outfit={o.id} />
                </View>
                <Text style={styles.outfitName}>{o.name}</Text>
                <TouchableOpacity
                  style={[styles.outfitBtn, btnStyle]}
                  onPress={() => onPressOutfit(o)}
                  disabled={equipped}
                  accessibilityLabel={`${o.name} ${label}`}
                >
                  <Text style={[styles.outfitBtnText, (equipped || (!owned && !affordable)) && { color: PAL.ink, opacity: 0.5 }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              </Pop>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Sticker của bé ⭐</Text>
        {stickers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có sticker nào.{'\n'}Học xong bài để nhận sticker nhé! 🎁</Text>
          </View>
        ) : (
          <View style={styles.stickerGrid}>
            {stickers.map((s, i) => (
              <View key={s.id || i} style={styles.stickerTile}>
                <Text style={styles.stickerEmoji}>{s.emoji}</Text>
                <Text style={styles.stickerName} numberOfLines={1}>{s.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },
  topBar: {
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: PAL.ink },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: PAL.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  coinText: { fontSize: 16, fontWeight: '700', color: PAL.ink },
  previewCard: {
    alignItems: 'center', marginHorizontal: 22, marginTop: 8, paddingVertical: 20,
    backgroundColor: PAL.surface, borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16,
  },
  previewName: { fontSize: 15, fontWeight: '700', color: PAL.ink, opacity: 0.6, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: PAL.ink, paddingHorizontal: 22, marginTop: 24, marginBottom: 12 },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 18 },
  outfitCard: { width: '47%', alignItems: 'center', backgroundColor: PAL.surface, borderRadius: 22, paddingVertical: 14, marginBottom: 14 },
  outfitPreview: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: PAL.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  outfitName: { fontSize: 15, fontWeight: '700', color: PAL.ink, marginTop: 8 },
  outfitBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 14, minWidth: 96, alignItems: 'center' },
  outfitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnBuy: { backgroundColor: PAL.primary, borderBottomWidth: 3, borderBottomColor: PAL.primaryDark },
  btnUse: { backgroundColor: PAL.mint, borderBottomWidth: 3, borderBottomColor: PAL.mintDark },
  btnEquipped: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnLocked: { backgroundColor: 'rgba(0,0,0,0.06)' },
  emptyBox: { marginHorizontal: 22, paddingVertical: 28, alignItems: 'center', backgroundColor: PAL.surface, borderRadius: 22 },
  emptyText: { fontSize: 14, fontWeight: '600', color: PAL.ink, opacity: 0.5, textAlign: 'center', lineHeight: 22 },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 12 },
  stickerTile: {
    width: '29%', aspectRatio: 0.9, backgroundColor: PAL.surface, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  stickerEmoji: { fontSize: 40 },
  stickerName: { fontSize: 11, fontWeight: '600', color: PAL.ink, opacity: 0.6, marginTop: 2 },
});
