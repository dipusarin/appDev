import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import DeleteEntryButton from '../components/DeleteEntryButton';
import TimeAgoPicker from '../components/TimeAgoPicker';
import TimedField, { TimedValue } from '../components/TimedField';
import { useAuth } from '../context/AuthContext';
import type { Feeding, FeedingType } from '../api/types';
import { FEEDING_ICONS } from '../icons';
import { cancelReminder, scheduleReminder } from '../notifications';
import { colors, font, radius, shadow, spacing } from '../theme';
import { minutesAgoToIso } from '../utils/time';

const TYPES: { value: FeedingType; label: string; icon: (color: string) => React.ReactNode }[] = [
  { value: 'breastfeed', label: 'Breastfeed', icon: (c) => <MaterialCommunityIcons name={FEEDING_ICONS.breastfeed} size={16} color={c} /> },
  { value: 'bottle', label: 'Bottle feed', icon: (c) => <MaterialCommunityIcons name={FEEDING_ICONS.bottle} size={16} color={c} /> },
  { value: 'solids', label: 'Solids', icon: (c) => <MaterialCommunityIcons name={FEEDING_ICONS.solids} size={16} color={c} /> },
  { value: 'combo', label: 'Combo feed', icon: (c) => <MaterialCommunityIcons name={FEEDING_ICONS.combo} size={16} color={c} /> },
];

const USES_TIMER: FeedingType[] = ['breastfeed', 'combo'];
const SHOWS_AMOUNT: FeedingType[] = ['bottle', 'combo'];

export default function AddFeedingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId, entry } = route.params as {
    babyId: string;
    entry?: Pick<Feeding, 'id' | 'type' | 'amountMl' | 'durationMin' | 'startedAt' | 'notes'>;
  };
  const isEditing = !!entry;
  const { token, babies } = useAuth();
  const babyName = babies.find((b) => b.id === babyId)?.name ?? 'Baby';

  const [type, setType] = useState<FeedingType>(entry?.type ?? 'bottle');
  const [amountMl, setAmountMl] = useState(entry?.amountMl != null ? String(entry.amountMl) : '');
  const [timed, setTimed] = useState<TimedValue>({
    startedAt: entry?.startedAt ?? new Date().toISOString(),
    durationMin: entry?.durationMin ?? null,
  });
  const [minutesAgo, setMinutesAgo] = useState(
    entry ? Math.max(0, Math.round((Date.now() - new Date(entry.startedAt).getTime()) / 60000)) : 0
  );
  const [manualDurationMin, setManualDurationMin] = useState(
    entry?.durationMin != null ? String(entry.durationMin) : ''
  );
  const [notes, setNotes] = useState(entry?.notes ?? '');
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

      const body = {
        type,
        amountMl: showsAmount && amountMl ? Number(amountMl) : undefined,
        durationMin,
        startedAt,
        notes: notes.trim() || undefined,
      };

      if (isEditing) {
        await api.updateFeeding(token, babyId, entry.id, body);
      } else {
        await api.logFeeding(token, babyId, body);
      }
      scheduleReminder('feeding', babyId, babyName, startedAt).catch(() => {});
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!token || !entry) return;
    await api.deleteFeeding(token, babyId, entry.id);
    cancelReminder('feeding', babyId).catch(() => {});
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Type</Text>
        <ChipPicker options={TYPES} value={type} onChange={setType} />

        {showsAmount && (
          <>
            <Text style={styles.sectionLabel}>Amount (ml)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g. 120"
              placeholderTextColor={colors.textMuted}
              value={amountMl}
              onChangeText={setAmountMl}
            />
          </>
        )}

        {usesTimer ? (
          <TimedField
            label={type === 'combo' ? 'Breastfeeding time' : 'When & how long'}
            onChange={setTimed}
            initialValue={entry ? timed : undefined}
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>When</Text>
            <TimeAgoPicker minutesAgo={minutesAgo} onChange={setMinutesAgo} />

            {type === 'bottle' && (
              <>
                <Text style={styles.sectionLabel}>Duration (minutes, optional)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="e.g. 15"
                  placeholderTextColor={colors.textMuted}
                  value={manualDurationMin}
                  onChangeText={setManualDurationMin}
                />
              </>
            )}
          </>
        )}

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder={type === 'solids' ? 'What did they eat?' : 'Anything worth remembering?'}
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
            <Text style={styles.buttonText}>{isEditing ? 'Save changes' : 'Save feeding'}</Text>
          )}
        </TouchableOpacity>

        {isEditing && <DeleteEntryButton label="Feeding" onDelete={onDelete} />}
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
    backgroundColor: colors.feeding,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadow.card,
  },
  buttonText: { color: colors.white, fontSize: font.size.base, fontWeight: font.weight.bold },
});
