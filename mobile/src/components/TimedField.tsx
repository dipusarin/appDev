import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SessionTimer from './SessionTimer';
import TimeAgoPicker from './TimeAgoPicker';
import { minutesAgoToIso } from '../utils/time';

export interface TimedValue {
  startedAt: string;
  durationMin: number | null;
}

export default function TimedField({
  label,
  onChange,
}: {
  label: string;
  onChange: (value: TimedValue) => void;
}) {
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [manualDuration, setManualDuration] = useState('');

  const emitManual = (newMinutesAgo: number, newDuration: string) => {
    onChange({
      startedAt: minutesAgoToIso(newMinutesAgo),
      durationMin: newDuration ? Number(newDuration) : null,
    });
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {mode === 'timer' ? (
        <>
          <SessionTimer onFinish={(result) => onChange(result)} />
          <TouchableOpacity onPress={() => setMode('manual')} style={styles.switchLinkWrap}>
            <Text style={styles.switchLink}>Prefer to enter the time manually?</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TimeAgoPicker
            minutesAgo={minutesAgo}
            onChange={(m) => {
              setMinutesAgo(m);
              emitManual(m, manualDuration);
            }}
          />
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Total minutes"
            value={manualDuration}
            onChangeText={(t) => {
              setManualDuration(t);
              emitManual(minutesAgo, t);
            }}
          />
          <TouchableOpacity onPress={() => setMode('timer')} style={styles.switchLinkWrap}>
            <Text style={styles.switchLink}>Use a live timer instead</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: '#8A7CA8', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E6DFF2',
    fontSize: 16,
    marginTop: 10,
  },
  switchLinkWrap: { marginTop: 10, alignItems: 'center' },
  switchLink: { color: '#7B61C7', fontSize: 13, fontWeight: '600' },
});
