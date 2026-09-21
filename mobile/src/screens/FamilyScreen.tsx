import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../api/client';
import { getApiBaseUrl, setApiBaseUrl } from '../config';
import IconTextInput from '../components/IconTextInput';
import { useAuth } from '../context/AuthContext';
import { colors, font, radius, shadow, spacing } from '../theme';

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const { user, family, members, babies, addBaby, joinFamily, logout } = useAuth();
  const [newBabyName, setNewBabyName] = useState('');
  const [addingBaby, setAddingBaby] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [savingServer, setSavingServer] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setServerUrlInput);
  }, []);

  const onSaveServerUrl = () => {
    if (!serverUrlInput.trim()) return;
    Alert.alert(
      'Change server?',
      "You'll be logged out and need to log in again against the new server.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change & log out',
          style: 'destructive',
          onPress: async () => {
            setSavingServer(true);
            try {
              await setApiBaseUrl(serverUrlInput);
              await logout();
            } finally {
              setSavingServer(false);
            }
          },
        },
      ]
    );
  };

  const onShareInvite = () => {
    if (!family) return;
    Share.share({
      message: `Join our family on Nara Baby to help track feedings and diaper changes! Use invite code: ${family.inviteCode}`,
    });
  };

  const onAddBaby = async () => {
    if (!newBabyName.trim()) return;
    setAddingBaby(true);
    try {
      await addBaby(newBabyName.trim());
      setNewBabyName('');
    } finally {
      setAddingBaby(false);
    }
  };

  const onJoinFamily = async () => {
    if (!inviteCodeInput.trim()) return;
    setError(null);
    setJoining(true);
    try {
      await joinFamily(inviteCodeInput.trim());
      setInviteCodeInput('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not join that family');
    } finally {
      setJoining(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.screenTitle}>{family?.name}</Text>
      <Text style={styles.signedInAs}>
        Signed in as {user?.name} ({user?.email})
      </Text>

      <View style={[styles.card, styles.inviteCard]}>
        <View style={styles.cardHeader}>
          <Ionicons name="key-outline" size={16} color={colors.feeding} />
          <Text style={styles.cardLabel}>Invite code</Text>
        </View>
        <Text style={styles.inviteCode}>{family?.inviteCode}</Text>
        <Text style={styles.cardMeta}>Share this with the other caregivers so they can log entries too.</Text>
        <TouchableOpacity style={styles.shareButton} onPress={onShareInvite}>
          <Ionicons name="share-social-outline" size={17} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.shareButtonText}>Share invite code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.cardLabel}>Caregivers</Text>
        </View>
        {members.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <Avatar name={m.name} />
            <Text style={styles.memberName}>
              {m.name} {m.id === user?.id ? '(you)' : ''}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="happy-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.cardLabel}>Babies</Text>
        </View>
        {babies.map((b) => (
          <Text key={b.id} style={styles.babyRow}>
            {b.name}
          </Text>
        ))}
        <IconTextInput
          icon="add-circle-outline"
          placeholder="Add another baby"
          value={newBabyName}
          onChangeText={setNewBabyName}
          style={styles.compactInput}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={onAddBaby} disabled={addingBaby}>
          {addingBaby ? <ActivityIndicator color={colors.feeding} /> : <Text style={styles.secondaryButtonText}>Add baby</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.cardLabel}>Join a different family</Text>
        </View>
        <IconTextInput
          icon="key-outline"
          placeholder="Invite code"
          autoCapitalize="characters"
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
          style={styles.compactInput}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.secondaryButton} onPress={onJoinFamily} disabled={joining}>
          {joining ? <ActivityIndicator color={colors.feeding} /> : <Text style={styles.secondaryButtonText}>Join family</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.cardLabel}>Server (advanced)</Text>
        </View>
        <Text style={styles.cardMeta}>
          The address of your backend. Only change this if you're self-hosting and the address has moved.
        </Text>
        <IconTextInput
          icon="link-outline"
          placeholder="http://100.x.x.x:4000/api"
          autoCapitalize="none"
          autoCorrect={false}
          value={serverUrlInput}
          onChangeText={setServerUrlInput}
          style={styles.compactInput}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={onSaveServerUrl} disabled={savingServer}>
          {savingServer ? <ActivityIndicator color={colors.feeding} /> : <Text style={styles.secondaryButtonText}>Save server address</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, backgroundColor: colors.bg, flexGrow: 1 },
  screenTitle: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.textPrimary },
  signedInAs: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  inviteCard: { borderWidth: 1.5, borderColor: colors.feeding, borderStyle: 'dashed' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardLabel: {
    fontSize: font.size.sm,
    color: colors.textSecondary,
    fontWeight: font.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardMeta: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: spacing.xs },
  inviteCode: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.feeding, letterSpacing: 4 },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: colors.feeding,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  shareButtonText: { color: colors.white, fontWeight: font.weight.bold },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, gap: spacing.sm },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.feedingSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.feeding, fontWeight: font.weight.black, fontSize: font.size.sm },
  memberName: { fontSize: font.size.base, color: colors.textPrimary },
  babyRow: { fontSize: font.size.base, color: colors.textPrimary, paddingVertical: spacing.xs },
  compactInput: { marginTop: spacing.sm, marginBottom: 0 },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.feeding,
  },
  secondaryButtonText: { color: colors.feeding, fontWeight: font.weight.bold },
  error: { color: colors.danger, marginTop: spacing.sm, textAlign: 'center' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  logoutText: { color: colors.danger, fontWeight: font.weight.bold },
});
