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
import { useAuth } from '../context/AuthContext';
import type { Diaper, DiaperColor, DiaperTexture, DiaperType } from '../api/types';
import { minutesAgoToIso } from '../utils/time';

const TYPES: { value: DiaperType; label: string }[] = [
  { value: 'wet', label: 'Wet' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'dry', label: 'Dry' },
];

const TEXTURES: { value: DiaperTexture; label: string }[] = [
  { value: 'runny', label: 'Runny' },
  { value: 'mucosy', label: 'Mucosy' },
  { value: 'mushy', label: 'Mushy' },
  { value: 'solid', label: 'Solid' },
  { value: 'pebbles', label: 'Pebbles' },
];

const COLORS: { value: DiaperColor; label: string }[] = [
  { value: 'black', label: 'Black' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'brown', label: 'Brown' },
  { value: 'red', label: 'Red' },
  { value: 'gray', label: 'Gray' },
];

export default function AddDiaperScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { babyId, entry } = route.params as {
    babyId: string;
    entry?: Pick<Diaper, 'id' | 'type' | 'texture' | 'color' | 'loggedAt' | 'notes'>;
  };
  const isEditing = !!entry;
  const { token } = useAuth();

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
        <Text style={styles.title}>{isEditing ? 'Edit diaper change' : 'Log a diaper change'}</Text>

        <Text style={styles.label}>Type</Text>
        <ChipPicker options={TYPES} value={type} onChange={setType} activeColor="#F0965B" />

        {type === 'dirty' && (
          <>
            <Text style={styles.label}>Texture</Text>
            <ChipPicker options={TEXTURES} value={texture} onChange={setTexture} activeColor="#F0965B" />

            <Text style={styles.label}>Color</Text>
            <ChipPicker options={COLORS} value={color} onChange={setColor} activeColor="#F0965B" />
          </>
        )}

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
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isEditing ? 'Save changes' : 'Save diaper change'}</Text>
          )}
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
  button: { backgroundColor: '#F0965B', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
