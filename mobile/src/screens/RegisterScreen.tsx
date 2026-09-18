import { useNavigation } from '@react-navigation/native';
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
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Fill in your name, email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (mode === 'join' && !inviteCode) {
      setError('Enter the invite code your caregiver shared with you');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        familyName: mode === 'create' ? familyName.trim() || undefined : undefined,
        inviteCode: mode === 'join' ? inviteCode.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>

        <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.modeButtonActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.modeText, mode === 'create' && styles.modeTextActive]}>Start a family</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
            onPress={() => setMode('join')}
          >
            <Text style={[styles.modeText, mode === 'join' && styles.modeTextActive]}>Join with a code</Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <TextInput
            style={styles.input}
            placeholder="Family name (optional)"
            value={familyName}
            onChangeText={setFamilyName}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Invite code"
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F2' },
  scroll: { padding: 24, paddingTop: 60, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: '#5B4B8A', marginBottom: 28 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6DFF2',
    fontSize: 16,
  },
  modeSwitch: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6DFF2',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeButtonActive: { backgroundColor: '#7B61C7', borderColor: '#7B61C7' },
  modeText: { color: '#5B4B8A', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#7B61C7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#D0455B', marginBottom: 8, textAlign: 'center' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: '#7B61C7', fontSize: 14 },
});
