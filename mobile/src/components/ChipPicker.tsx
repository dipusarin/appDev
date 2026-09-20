import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

export default function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  activeColor = '#7B61C7',
}: {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  activeColor?: string;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isActive && { backgroundColor: activeColor, borderColor: activeColor }]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6DFF2',
  },
  chipText: { color: '#5B4B8A', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});
