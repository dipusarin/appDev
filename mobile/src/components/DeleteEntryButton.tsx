import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

export default function DeleteEntryButton({
  label = 'Entry',
  onDelete,
}: {
  label?: string;
  onDelete: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const confirm = () => {
    Alert.alert(`Delete this ${label.toLowerCase()}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await onDelete();
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={confirm} disabled={deleting}>
      {deleting ? (
        <ActivityIndicator color={colors.danger} />
      ) : (
        <>
          <Ionicons name="trash-outline" size={16} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.text}>Delete {label.toLowerCase()}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  text: { color: colors.danger, fontWeight: font.weight.bold },
});
