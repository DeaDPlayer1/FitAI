import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

function FinishModal({
  visible,
  completedSets,
  totalSets,
  elapsed,
  onCancel,
  onConfirm,
  finishing,
}: {
  visible: boolean;
  completedSets: number;
  totalSets: number;
  elapsed: string;
  onCancel: () => void;
  onConfirm: () => void;
  finishing: boolean;
}) {
  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInDown.springify()} style={styles.finishModal}>
          <View style={styles.finishIconRow}>
            <View style={styles.finishIconBox}>
              <MaterialCommunityIcons name="trophy" size={32} color="#F59E0B" />
            </View>
          </View>
          <Text style={styles.finishTitle}>Finish Workout?</Text>
          <Text style={styles.finishSubtitle}>Great work! Here's your session summary:</Text>

          <View style={styles.finishStats}>
            <View style={styles.finishStat}>
              <Text style={styles.finishStatVal}>{elapsed}</Text>
              <Text style={styles.finishStatLabel}>Duration</Text>
            </View>
            <View style={styles.finishStatDiv} />
            <View style={styles.finishStat}>
              <Text style={styles.finishStatVal}>{completedSets}/{totalSets}</Text>
              <Text style={styles.finishStatLabel}>Sets Done</Text>
            </View>
            <View style={styles.finishStatDiv} />
            <View style={styles.finishStat}>
              <Text style={styles.finishStatVal}>{pct}%</Text>
              <Text style={styles.finishStatLabel}>Completion</Text>
            </View>
          </View>

          <View style={styles.finishActions}>
            <TouchableOpacity style={styles.keepGoingBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.keepGoingText}>Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishConfirmBtn}
              onPress={onConfirm}
              disabled={finishing}
              activeOpacity={0.8}
            >
              {finishing
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.finishConfirmText}>Finish 🎉</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  finishModal: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    gap: 8,
    ...theme.shadow.premium,
  },
  finishIconRow: { alignItems: 'center' },
  finishIconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  finishTitle: {
    fontSize: 22,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  finishSubtitle: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  finishStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    justifyContent: 'space-around',
  },
  finishStat: { alignItems: 'center', flex: 1 },
  finishStatVal: {
    fontSize: 20,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  finishStatLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  finishStatDiv: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  finishActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  keepGoingBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  keepGoingText: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.secondary,
  },
  finishConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.premium,
  },
  finishConfirmText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
});

export default FinishModal;
