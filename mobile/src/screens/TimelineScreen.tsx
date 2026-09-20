import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { TimelineEntry } from '../api/types';
import { DIAPER_ICONS, FEEDING_ICONS, PUMP_ICON } from '../icons';
import { colors, font, radius, shadow, spacing } from '../theme';
import { formatClockTime, formatRelativeTime } from '../utils/time';

const FEEDING_LABELS: Record<string, string> = {
  breastfeed: 'Breastfed',
  bottle: 'Bottle',
  solids: 'Solids',
  combo: 'Combo feed',
};
const DIAPER_LABELS: Record<string, string> = { wet: 'Wet diaper', dirty: 'Dirty diaper', dry: 'Dry diaper' };

function EntryRow({ entry, babyId }: { entry: TimelineEntry; babyId: string }) {
  const navigation = useNavigation<any>();
  const isFeeding = entry.kind === 'feeding';
  const isDiaper = entry.kind === 'diaper';
  const isPump = entry.kind === 'pump';

  const label = isFeeding
    ? FEEDING_LABELS[entry.type as string]
    : isDiaper
      ? DIAPER_LABELS[entry.type as string]
      : 'Pumped';

  const details = [
    isFeeding && entry.amountMl ? `${entry.amountMl} ml` : null,
    (isFeeding || isPump) && entry.durationMin ? `${entry.durationMin} min` : null,
    isDiaper && entry.texture ? entry.texture : null,
    isDiaper && entry.color ? entry.color : null,
  ].filter(Boolean);

  const badgeColor = isFeeding ? colors.feeding : isPump ? colors.pump : colors.diaper;
  const badgeSoft = isFeeding ? colors.feedingSoft : isPump ? colors.pumpSoft : colors.diaperSoft;
  const iconName = isFeeding
    ? FEEDING_ICONS[entry.type as keyof typeof FEEDING_ICONS]
    : isPump
      ? PUMP_ICON
      : DIAPER_ICONS[entry.type as keyof typeof DIAPER_ICONS];

  const onPress = () => {
    if (isFeeding) {
      navigation.navigate('AddFeeding', {
        babyId,
        entry: {
          id: entry.id,
          type: entry.type,
          amountMl: entry.amountMl ?? null,
          durationMin: entry.durationMin ?? null,
          startedAt: entry.timestamp,
          notes: entry.notes,
        },
      });
    } else if (isDiaper) {
      navigation.navigate('AddDiaper', {
        babyId,
        entry: {
          id: entry.id,
          type: entry.type,
          texture: entry.texture ?? null,
          color: entry.color ?? null,
          loggedAt: entry.timestamp,
          notes: entry.notes,
        },
      });
    } else {
      navigation.navigate('AddPump', {
        babyId,
        entry: {
          id: entry.id,
          startedAt: entry.timestamp,
          durationMin: entry.durationMin ?? null,
          notes: entry.notes,
        },
      });
    }
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBadge, { backgroundColor: badgeSoft }]}>
        <MaterialCommunityIcons name={iconName} size={20} color={badgeColor} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{label}</Text>
          <Text style={styles.rowTime}>{formatRelativeTime(entry.timestamp)}</Text>
        </View>
        <Text style={styles.rowMeta}>
          {[...details, `by ${entry.loggedByName}`].join(' · ')} · {formatClockTime(entry.timestamp)}
        </Text>
        {entry.notes ? <Text style={styles.rowNotes}>{entry.notes}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const { token, selectedBabyId, babies } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token || !selectedBabyId) {
        setEntries([]);
        return;
      }
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const data = await api.getTimeline(token, selectedBabyId, 100);
        setEntries(data);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, selectedBabyId]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (babies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="albums-outline" size={40} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
        <Text style={styles.emptyText}>Add a baby from the Home tab to start tracking.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator color={colors.feeding} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top + spacing.lg }]}
      data={entries}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      ListHeaderComponent={<Text style={styles.screenTitle}>Timeline</Text>}
      renderItem={({ item }) => <EntryRow entry={item} babyId={selectedBabyId as string} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={40} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyText}>No entries yet. Log a feeding or diaper change to see it here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: spacing.xl, flexGrow: 1 },
  screenTitle: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.textPrimary, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowTitle: { fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.textPrimary },
  rowTime: { fontSize: font.size.sm, color: colors.textSecondary, fontWeight: font.weight.bold },
  rowMeta: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: 2 },
  rowNotes: { fontSize: font.size.sm, color: colors.textPrimary, marginTop: spacing.xs, fontStyle: 'italic' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyText: { textAlign: 'center', color: colors.textSecondary, fontSize: font.size.md },
});
