import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.container}>
      <Text style={styles.clock}>
        {mm}:{ss}
      </Text>
      <View style={styles.buttonRow}>
        {!running && elapsedSec === 0 && (
          <TouchableOpacity style={styles.startButton} onPress={start}>
            <Text style={styles.buttonText}>▶ Start timer</Text>
          </TouchableOpacity>
        )}
        {running && (
          <TouchableOpacity style={styles.stopButton} onPress={stop}>
            <Text style={styles.buttonText}>⏹ Stop</Text>
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
  container: { alignItems: 'center', backgroundColor: '#FBF8FF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E6DFF2' },
  clock: { fontSize: 36, fontWeight: '800', color: '#3E2E63', fontVariant: ['tabular-nums'], marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  startButton: { backgroundColor: '#7B61C7', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  stopButton: { backgroundColor: '#D0455B', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  buttonText: { color: '#fff', fontWeight: '700' },
  resetButton: { paddingVertical: 10, paddingHorizontal: 12 },
  resetText: { color: '#8A7CA8', fontWeight: '600' },
});
