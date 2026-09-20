import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { TimelineEntry } from '../api/types';
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

  const dotStyle = isFeeding ? styles.feedingDot : isPump ? styles.pumpDot : styles.diaperDot;

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
      <View style={[styles.dot, dotStyle]} />
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{label}</Text>
          <Text style={styles.rowTime}>{formatRelativeTime(entry.timestamp)}</Text>
        </View>
        <Text style={styles.rowMeta}>
          {[...details, `by ${entry.loggedByName}`].join(' · ')} · {formatClockTime(entry.timestamp)}
        </Text>
        {entry.notes ? <Text style={styles.rowNotes}>{entry.notes}</Text> : null}
        <Text style={styles.editHint}>Tap to edit</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TimelineScreen() {
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
        <Text style={styles.emptyText}>Add a baby from the Home tab to start tracking.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={entries}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={({ item }) => <EntryRow entry={item} babyId={selectedBabyId as string} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No entries yet. Log a feeding or diaper change to see it here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F2' },
  listContent: { padding: 20, paddingTop: 60 },
  row: { flexDirection: 'row', marginBottom: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: 12 },
  feedingDot: { backgroundColor: '#7B61C7' },
  pumpDot: { backgroundColor: '#3E9C7F' },
  diaperDot: { backgroundColor: '#F0965B' },
  rowContent: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F0EAF9' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#3E2E63' },
  rowTime: { fontSize: 13, color: '#8A7CA8', fontWeight: '600' },
  rowMeta: { fontSize: 13, color: '#8A7CA8', marginTop: 4 },
  rowNotes: { fontSize: 13, color: '#5B4B8A', marginTop: 6, fontStyle: 'italic' },
  editHint: { fontSize: 11, color: '#B3A6CC', marginTop: 8, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: '#8A7CA8', fontSize: 15 },
});
