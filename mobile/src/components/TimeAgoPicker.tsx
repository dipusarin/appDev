import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { formatTimeOfDay } from '../utils/time';

const PRESETS = [0, 15, 30, 60];

export default function TimeAgoPicker({
  minutesAgo,
  onChange,
}: {
  minutesAgo: number;
  onChange: (minutes: number) => void;
}) {
  const [customText, setCustomText] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const isPreset = PRESETS.includes(minutesAgo);

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
    }
    if (event.type === 'dismissed' || !selected) return;
    const minutes = Math.max(0, Math.round((Date.now() - selected.getTime()) / 60000));
    setCustomText('');
    onChange(minutes);
  };

  return (
    <View>
      <View style={styles.row}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.chip, minutesAgo === preset && styles.chipActive]}
            onPress={() => {
              setCustomText('');
              onChange(preset);
            }}
          >
            <Text style={[styles.chipText, minutesAgo === preset && styles.chipTextActive]}>
              {preset === 0 ? 'Now' : `${preset}m ago`}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.clockChip} onPress={() => setPickerVisible(true)}>
          <Ionicons name="time-outline" size={15} color={colors.feeding} style={styles.clockIcon} />
          <Text style={styles.clockChipText}>{formatTimeOfDay(new Date(Date.now() - minutesAgo * 60000).toISOString())}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.customRow}>
        <Text style={styles.customLabel}>Or minutes ago:</Text>
        <TextInput
          style={styles.customInput}
          keyboardType="number-pad"
          placeholder="e.g. 45"
          placeholderTextColor={colors.textMuted}
          value={isPreset ? customText : String(minutesAgo)}
          onChangeText={(text) => {
            setCustomText(text);
            const parsed = parseInt(text, 10);
            if (!Number.isNaN(parsed) && parsed >= 0) {
              onChange(parsed);
            }
          }}
        />
      </View>

      {pickerVisible && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            mode="time"
            value={new Date(Date.now() - minutesAgo * 60000)}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={() => setPickerVisible(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.feeding, borderColor: colors.feeding },
  chipText: { color: colors.textSecondary, fontWeight: font.weight.bold },
  chipTextActive: { color: colors.white },
  clockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.feedingSoft,
    borderWidth: 1,
    borderColor: colors.feeding,
  },
  clockIcon: { marginRight: 4 },
  clockChipText: { color: colors.feeding, fontWeight: font.weight.bold },
  customRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  customLabel: { color: colors.textSecondary, fontSize: font.size.md },
  customInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    width: 80,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  pickerWrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  doneButton: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  doneButtonText: { color: colors.feeding, fontWeight: font.weight.bold },
});
