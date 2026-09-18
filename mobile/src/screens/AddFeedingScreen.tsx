import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, ApiError } from '../api/client';
import TimeAgoPicker from '../components/TimeAgoPicker';
import { useAuth } from '../context/AuthContext';
import type { FeedingType } from '../api/types';
import { minutesAgoToIso } from '../utils/time';

const TYPES: { value: FeedingType; label: string }[] = [
  { value: 'breast', label: 'Breast' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'formula', label: 'Formula' },
];

export default function AddFeedingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId } = route.params as { babyId: string };
  const { token } = useAuth();

  const [type, setType] = useState<FeedingType>('bottle');
  const [amountMl, setAmountMl] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.logFeeding(token, babyId, {
        type,
        amountMl: amountMl ? Number(amountMl) : undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        startedAt: minutesAgoToIso(minutesAgo),
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log a feeding</Text>

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, type === t.value && styles.chipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {type !== 'breast' && (
          <>
            <Text style={styles.label}>Amount (ml)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g. 120"
              value={amountMl}
              onChangeText={setAmountMl}
            />
          </>
        )}

        <Text style={styles.label}>Duration (minutes, optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="e.g. 15"
          value={durationMin}
          onChangeText={setDurationMin}
        />

        <Text style={styles.label}>When</Text>
        <TimeAgoPicker minutesAgo={minutesAgo} onChange={setMinutesAgo} />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Anything worth remembering?"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save feeding</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F2' },
  scroll: { padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#3E2E63', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#8A7CA8', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6DFF2',
  },
  chipActive: { backgroundColor: '#7B61C7', borderColor: '#7B61C7' },
  chipText: { color: '#5B4B8A', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E6DFF2',
    fontSize: 16,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: '#D0455B', marginTop: 16, textAlign: 'center' },
  button: { backgroundColor: '#7B61C7', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
