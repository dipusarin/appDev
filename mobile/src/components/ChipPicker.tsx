import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: (color: string) => React.ReactNode;
}

export default function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  activeColor = colors.feeding,
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
            {option.icon ? (
              <View style={styles.chipIcon}>{option.icon(isActive ? colors.white : activeColor)}</View>
            ) : null}
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipIcon: { marginRight: 6 },
  chipText: { color: colors.textSecondary, fontWeight: font.weight.bold },
  chipTextActive: { color: colors.white },
});
