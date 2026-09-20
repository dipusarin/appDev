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
  View,
} from 'react-native';
import { api, ApiError } from '../api/client';
import ChipPicker from '../components/ChipPicker';
import DeleteEntryButton from '../components/DeleteEntryButton';
import TimeAgoPicker from '../components/TimeAgoPicker';
import { useAuth } from '../context/AuthContext';
import type { Diaper, DiaperColor, DiaperTexture, DiaperType } from '../api/types';
import { DIAPER_ICONS } from '../icons';
import { cancelReminder, scheduleReminder } from '../notifications';
import { colors, font, radius, shadow, spacing } from '../theme';
import { minutesAgoToIso } from '../utils/time';

const TYPES: { value: DiaperType; label: string; icon: (color: string) => React.ReactNode }[] = [
  { value: 'wet', label: 'Wet', icon: (c) => <MaterialCommunityIcons name={DIAPER_ICONS.wet} size={16} color={c} /> },
  { value: 'dirty', label: 'Dirty', icon: (c) => <MaterialCommunityIcons name={DIAPER_ICONS.dirty} size={16} color={c} /> },
  { value: 'dry', label: 'Dry', icon: (c) => <MaterialCommunityIcons name={DIAPER_ICONS.dry} size={16} color={c} /> },
];

const TEXTURES: { value: DiaperTexture; label: string }[] = [
  { value: 'runny', label: 'Runny' },
  { value: 'mucosy', label: 'Mucosy' },
  { value: 'mushy', label: 'Mushy' },
  { value: 'solid', label: 'Solid' },
  { value: 'pebbles', label: 'Pebbles' },
];

const COLOR_SWATCHES: Record<DiaperColor, string> = {
  black: '#2B2B2B',
  green: '#4C9A5B',
  yellow: '#E7C34C',
  brown: '#8B5E34',
  red: '#D8515F',
  gray: '#9AA0A6',
};

const swatchStyle = { width: 12, height: 12, borderRadius: 6 };

const COLORS: { value: DiaperColor; label: string; icon: (color: string) => React.ReactNode }[] = (
  Object.keys(COLOR_SWATCHES) as DiaperColor[]
).map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  icon: () => <View style={[swatchStyle, { backgroundColor: COLOR_SWATCHES[value] }]} />,
}));

export default function AddDiaperScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId, entry } = route.params as {
    babyId: string;
    entry?: Pick<Diaper, 'id' | 'type' | 'texture' | 'color' | 'loggedAt' | 'notes'>;
  };
  const isEditing = !!entry;
  const { token, babies } = useAuth();
  const babyName = babies.find((b) => b.id === babyId)?.name ?? 'Baby';

  const [type, setType] = useState<DiaperType>(entry?.type ?? 'wet');
  const [texture, setTexture] = useState<DiaperTexture | null>(entry?.texture ?? null);
  const [color, setColor] = useState<DiaperColor | null>(entry?.color ?? null);
  const [minutesAgo, setMinutesAgo] = useState(
    entry ? Math.max(0, Math.round((Date.now() - new Date(entry.loggedAt).getTime()) / 60000)) : 0
  );
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        type,
        texture: type === 'dirty' && texture ? texture : undefined,
        color: type === 'dirty' && color ? color : undefined,
        loggedAt: minutesAgoToIso(minutesAgo),
        notes: notes.trim() || undefined,
      };
      if (isEditing) {
        await api.updateDiaper(token, babyId, entry.id, body);
      } else {
        await api.logDiaper(token, babyId, body);
      }
      scheduleReminder('diaper', babyId, babyName, body.loggedAt).catch(() => {});
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!token || !entry) return;
    await api.deleteDiaper(token, babyId, entry.id);
    cancelReminder('diaper', babyId).catch(() => {});
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Type</Text>
        <ChipPicker options={TYPES} value={type} onChange={setType} activeColor={colors.diaper} />

        {type === 'dirty' && (
          <>
            <Text style={styles.sectionLabel}>Texture</Text>
            <ChipPicker options={TEXTURES} value={texture} onChange={setTexture} activeColor={colors.diaper} />

            <Text style={styles.sectionLabel}>Color</Text>
            <ChipPicker options={COLORS} value={color} onChange={setColor} activeColor={colors.diaper} />
          </>
        )}

        <Text style={styles.sectionLabel}>When</Text>
        <TimeAgoPicker minutesAgo={minutesAgo} onChange={setMinutesAgo} />

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Anything worth remembering?"
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
            <Text style={styles.buttonText}>{isEditing ? 'Save changes' : 'Save diaper change'}</Text>
          )}
        </TouchableOpacity>

        {isEditing && <DeleteEntryButton label="Diaper change" onDelete={onDelete} />}
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
    backgroundColor: colors.diaper,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadow.card,
  },
  buttonText: { color: colors.white, fontSize: font.size.base, fontWeight: font.weight.bold },
});
