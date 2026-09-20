import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import IconTextInput from '../components/IconTextInput';
import { useAuth } from '../context/AuthContext';
import { colors, font, radius, shadow, spacing } from '../theme';

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>

        <IconTextInput icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} />
        <IconTextInput
          icon="mail-outline"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <IconTextInput
          icon="lock-closed-outline"
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
            <Ionicons
              name="add-circle-outline"
              size={16}
              color={mode === 'create' ? colors.white : colors.feeding}
              style={styles.modeIcon}
            />
            <Text style={[styles.modeText, mode === 'create' && styles.modeTextActive]}>Start a family</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
            onPress={() => setMode('join')}
          >
            <Ionicons
              name="key-outline"
              size={16}
              color={mode === 'join' ? colors.white : colors.feeding}
              style={styles.modeIcon}
            />
            <Text style={[styles.modeText, mode === 'join' && styles.modeTextActive]}>Join with a code</Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <IconTextInput
            icon="people-outline"
            placeholder="Family name (optional)"
            value={familyName}
            onChangeText={setFamilyName}
          />
        ) : (
          <IconTextInput
            icon="key-outline"
            placeholder="Invite code"
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingTop: 60, flexGrow: 1 },
  title: { fontSize: font.size.xl, fontWeight: font.weight.black, textAlign: 'center', color: colors.textPrimary, marginBottom: spacing.xxl },
  modeSwitch: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  modeButtonActive: { backgroundColor: colors.feeding, borderColor: colors.feeding },
  modeIcon: { marginRight: 6 },
  modeText: { color: colors.feeding, fontWeight: font.weight.bold },
  modeTextActive: { color: colors.white },
  button: {
    backgroundColor: colors.feeding,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadow.card,
  },
  buttonText: { color: colors.white, fontSize: font.size.base, fontWeight: font.weight.bold },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
  linkWrap: { marginTop: spacing.xl, alignItems: 'center' },
  link: { color: colors.feeding, fontSize: font.size.md, fontWeight: font.weight.medium },
});
