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
import DeleteEntryButton from '../components/DeleteEntryButton';
import TimedField, { TimedValue } from '../components/TimedField';
import { useAuth } from '../context/AuthContext';
import type { Pump } from '../api/types';
import { colors, font, radius, shadow, spacing } from '../theme';

export default function AddPumpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId, entry } = route.params as {
    babyId: string;
    entry?: Pick<Pump, 'id' | 'startedAt' | 'durationMin' | 'notes'>;
  };
  const isEditing = !!entry;
  const { token } = useAuth();

  const [timed, setTimed] = useState<TimedValue>({
    startedAt: entry?.startedAt ?? new Date().toISOString(),
    durationMin: entry?.durationMin ?? null,
  });
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        startedAt: timed.startedAt,
        durationMin: timed.durationMin ?? undefined,
        notes: notes.trim() || undefined,
      };
      if (isEditing) {
        await api.updatePump(token, babyId, entry.id, body);
      } else {
        await api.logPump(token, babyId, body);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!token || !entry) return;
    await api.deletePump(token, babyId, entry.id);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TimedField label="Start time & total time" onChange={setTimed} initialValue={entry ? timed : undefined} />

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="e.g. amount pumped, which side"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{isEditing ? 'Save changes' : 'Save pump session'}</Text>
          )}
        </TouchableOpacity>

        {isEditing && <DeleteEntryButton label="Pump session" onDelete={onDelete} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl },
  sectionLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: font.size.base,
    color: colors.textPrimary,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: colors.danger, marginTop: spacing.lg, textAlign: 'center' },
  button: {
    backgroundColor: colors.pump,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadow.card,
  },
  buttonText: { color: colors.white, fontSize: font.size.base, fontWeight: font.weight.bold },
});
