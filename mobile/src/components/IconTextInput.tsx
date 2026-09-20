import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function IconTextInput({
  icon,
  style,
  ...props
}: TextInputProps & { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={19} color={colors.textMuted} style={styles.icon} />
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.textMuted} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.textPrimary },
});
