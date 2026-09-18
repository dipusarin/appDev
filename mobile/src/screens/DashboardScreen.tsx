import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { BabySummary } from '../api/types';
import { formatClockTime, formatRelativeTime } from '../utils/time';

const FEEDING_LABELS: Record<string, string> = { breast: 'Breastfed', bottle: 'Bottle', formula: 'Formula' };
const DIAPER_LABELS: Record<string, string> = { wet: 'Wet', dirty: 'Dirty', both: 'Wet & dirty' };

function AddBabyForm() {
  const { addBaby } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addBaby(name.trim());
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Add your baby to get started</Text>
      <TextInput
        style={styles.input}
        placeholder="Baby's name"
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add baby</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { token, babies, selectedBabyId, setSelectedBabyId } = useAuth();
  const [summary, setSummary] = useState<BabySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(
    async (isRefresh = false) => {
      if (!token || !selectedBabyId) {
        setSummary(null);
        return;
      }
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const data = await api.getSummary(token, selectedBabyId);
        setSummary(data);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, selectedBabyId]
  );

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  if (babies.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <AddBabyForm />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSummary(true)} />}
    >
      {babies.length > 1 && (
        <View style={styles.babyChips}>
          {babies.map((baby) => (
            <TouchableOpacity
              key={baby.id}
              style={[styles.chip, selectedBabyId === baby.id && styles.chipActive]}
              onPress={() => setSelectedBabyId(baby.id)}
            >
              <Text style={[styles.chipText, selectedBabyId === baby.id && styles.chipTextActive]}>
                {baby.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Last feeding</Text>
            {summary?.lastFeeding ? (
              <>
                <Text style={styles.cardValue}>{formatRelativeTime(summary.lastFeeding.startedAt)}</Text>
                <Text style={styles.cardMeta}>
                  {FEEDING_LABELS[summary.lastFeeding.type]}
                  {summary.lastFeeding.amountMl ? ` · ${summary.lastFeeding.amountMl} ml` : ''}
                  {summary.lastFeeding.durationMin ? ` · ${summary.lastFeeding.durationMin} min` : ''}
                  {'  '}by {summary.lastFeeding.loggedByName}
                </Text>
                <Text style={styles.cardTime}>{formatClockTime(summary.lastFeeding.startedAt)}</Text>
              </>
            ) : (
              <Text style={styles.cardMeta}>No feedings logged yet</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Last diaper change</Text>
            {summary?.lastDiaper ? (
              <>
                <Text style={styles.cardValue}>{formatRelativeTime(summary.lastDiaper.loggedAt)}</Text>
                <Text style={styles.cardMeta}>
                  {DIAPER_LABELS[summary.lastDiaper.type]} · by {summary.lastDiaper.loggedByName}
                </Text>
                <Text style={styles.cardTime}>{formatClockTime(summary.lastDiaper.loggedAt)}</Text>
              </>
            ) : (
              <Text style={styles.cardMeta}>No diaper changes logged yet</Text>
            )}
          </View>
        </>
      )}

      <View style={styles.quickAddRow}>
        <TouchableOpacity
          style={[styles.quickAddButton, styles.feedingButton]}
          onPress={() => navigation.navigate('AddFeeding', { babyId: selectedBabyId })}
        >
          <Text style={styles.quickAddText}>+ Feeding</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAddButton, styles.diaperButton]}
          onPress={() => navigation.navigate('AddDiaper', { babyId: selectedBabyId })}
        >
          <Text style={styles.quickAddText}>+ Diaper</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, flexGrow: 1, backgroundColor: '#FFF8F2' },
  babyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6DFF2',
  },
  chipActive: { backgroundColor: '#7B61C7', borderColor: '#7B61C7' },
  chipText: { color: '#5B4B8A', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0EAF9',
  },
  cardLabel: { fontSize: 13, color: '#8A7CA8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 24, fontWeight: '700', color: '#3E2E63', marginTop: 6 },
  cardMeta: { fontSize: 14, color: '#5B4B8A', marginTop: 4 },
  cardTime: { fontSize: 12, color: '#B3A6CC', marginTop: 6 },
  quickAddRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  quickAddButton: { flex: 1, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  feedingButton: { backgroundColor: '#7B61C7' },
  diaperButton: { backgroundColor: '#F0965B' },
  quickAddText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyState: { padding: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#3E2E63', marginBottom: 16, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6DFF2',
    fontSize: 16,
  },
  button: { backgroundColor: '#7B61C7', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
