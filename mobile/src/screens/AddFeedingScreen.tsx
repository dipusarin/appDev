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
} from 'react-native';
import { api, ApiError } from '../api/client';
import ChipPicker from '../components/ChipPicker';
import TimeAgoPicker from '../components/TimeAgoPicker';
import TimedField, { TimedValue } from '../components/TimedField';
import { useAuth } from '../context/AuthContext';
import type { FeedingType } from '../api/types';
import { minutesAgoToIso } from '../utils/time';

const TYPES: { value: FeedingType; label: string }[] = [
  { value: 'breastfeed', label: 'Breastfeed' },
  { value: 'bottle', label: 'Bottle feed' },
  { value: 'solids', label: 'Solids' },
  { value: 'combo', label: 'Combo feed' },
];

const USES_TIMER: FeedingType[] = ['breastfeed', 'combo'];
const SHOWS_AMOUNT: FeedingType[] = ['bottle', 'combo'];

export default function AddFeedingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId } = route.params as { babyId: string };
  const { token } = useAuth();

  const [type, setType] = useState<FeedingType>('bottle');
  const [amountMl, setAmountMl] = useState('');
  const [timed, setTimed] = useState<TimedValue>({ startedAt: new Date().toISOString(), durationMin: null });
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [manualDurationMin, setManualDurationMin] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usesTimer = USES_TIMER.includes(type);
  const showsAmount = SHOWS_AMOUNT.includes(type);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const startedAt = usesTimer ? timed.startedAt : minutesAgoToIso(minutesAgo);
      const durationMin = usesTimer
        ? timed.durationMin ?? undefined
        : manualDurationMin
          ? Number(manualDurationMin)
          : undefined;

      await api.logFeeding(token, babyId, {
        type,
        amountMl: showsAmount && amountMl ? Number(amountMl) : undefined,
        durationMin,
        startedAt,
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
        <ChipPicker options={TYPES} value={type} onChange={setType} />

        {showsAmount && (
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

        {usesTimer ? (
          <TimedField label={type === 'combo' ? 'Breastfeeding time' : 'When & how long'} onChange={setTimed} />
        ) : (
          <>
            <Text style={styles.label}>When</Text>
            <TimeAgoPicker minutesAgo={minutesAgo} onChange={setMinutesAgo} />

            {type === 'bottle' && (
              <>
                <Text style={styles.label}>Duration (minutes, optional)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="e.g. 15"
                  value={manualDurationMin}
                  onChangeText={setManualDurationMin}
                />
              </>
            )}
          </>
        )}

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder={type === 'solids' ? 'What did they eat?' : 'Anything worth remembering?'}
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
