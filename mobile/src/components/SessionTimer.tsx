import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

export interface SessionResult {
  startedAt: string;
  durationMin: number;
}

export default function SessionTimer({ onFinish }: { onFinish: (result: SessionResult) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (startedAtRef.current) {
      const durationMin = Math.max(1, Math.round(elapsedSec / 60));
      onFinish({ startedAt: new Date(startedAtRef.current).toISOString(), durationMin });
    }
  };

  const reset = () => {
    startedAtRef.current = null;
    setElapsedSec(0);
    setRunning(false);
  };

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <View style={[styles.container, running && styles.containerRunning]}>
      <Text style={styles.clock}>
        {mm}:{ss}
      </Text>
      <View style={styles.buttonRow}>
        {!running && elapsedSec === 0 && (
          <TouchableOpacity style={styles.startButton} onPress={start}>
            <Ionicons name="play" size={16} color={colors.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start timer</Text>
          </TouchableOpacity>
        )}
        {running && (
          <TouchableOpacity style={styles.stopButton} onPress={stop}>
            <Ionicons name="stop" size={16} color={colors.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}
        {!running && elapsedSec > 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={reset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerRunning: { borderColor: colors.feeding },
  clock: {
    fontSize: 36,
    fontWeight: font.weight.black,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.md,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.feeding,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
  },
  buttonIcon: { marginRight: 6 },
  buttonText: { color: colors.white, fontWeight: font.weight.bold },
  resetButton: { paddingVertical: 10, paddingHorizontal: spacing.md },
  resetText: { color: colors.textSecondary, fontWeight: font.weight.medium },
});
