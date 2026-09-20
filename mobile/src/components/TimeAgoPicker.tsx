import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
          <Text style={styles.clockChipText}>
            🕐 {formatTimeOfDay(new Date(Date.now() - minutesAgo * 60000).toISOString())}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.customRow}>
        <Text style={styles.customLabel}>Or minutes ago:</Text>
        <TextInput
          style={styles.customInput}
          keyboardType="number-pad"
          placeholder="e.g. 45"
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
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6DFF2',
  },
  chipActive: { backgroundColor: '#7B61C7', borderColor: '#7B61C7' },
  chipText: { color: '#5B4B8A', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  clockChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FBF8FF',
    borderWidth: 1,
    borderColor: '#7B61C7',
  },
  clockChipText: { color: '#7B61C7', fontWeight: '700' },
  customRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  customLabel: { color: '#8A7CA8', fontSize: 14 },
  customInput: {
    borderWidth: 1,
    borderColor: '#E6DFF2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    backgroundColor: '#fff',
  },
  pickerWrap: { marginTop: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E6DFF2', padding: 8 },
  doneButton: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  doneButtonText: { color: '#7B61C7', fontWeight: '700' },
});
