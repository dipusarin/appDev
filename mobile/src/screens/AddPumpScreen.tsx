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
import TimedField, { TimedValue } from '../components/TimedField';
import { useAuth } from '../context/AuthContext';

export default function AddPumpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId } = route.params as { babyId: string };
  const { token } = useAuth();

  const [timed, setTimed] = useState<TimedValue>({ startedAt: new Date().toISOString(), durationMin: null });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.logPump(token, babyId, {
        startedAt: timed.startedAt,
        durationMin: timed.durationMin ?? undefined,
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
        <Text style={styles.title}>Log a pumping session</Text>

        <TimedField label="Start time & total time" onChange={setTimed} />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="e.g. amount pumped, which side"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save pump session</Text>}
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
  button: { backgroundColor: '#3E9C7F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
