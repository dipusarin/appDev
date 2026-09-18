import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FamilyScreen() {
  const { user, family, members, babies, addBaby, joinFamily, logout } = useAuth();
  const [newBabyName, setNewBabyName] = useState('');
  const [addingBaby, setAddingBaby] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{family?.name}</Text>
      <Text style={styles.signedInAs}>Signed in as {user?.name} ({user?.email})</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Invite code</Text>
        <Text style={styles.inviteCode}>{family?.inviteCode}</Text>
        <Text style={styles.cardMeta}>Share this with the other caregivers so they can log entries too.</Text>
        <TouchableOpacity style={styles.shareButton} onPress={onShareInvite}>
          <Text style={styles.shareButtonText}>Share invite code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Caregivers</Text>
        {members.map((m) => (
          <Text key={m.id} style={styles.memberRow}>
            {m.name} {m.id === user?.id ? '(you)' : ''}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Babies</Text>
        {babies.map((b) => (
          <Text key={b.id} style={styles.memberRow}>{b.name}</Text>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Add another baby"
          value={newBabyName}
          onChangeText={setNewBabyName}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={onAddBaby} disabled={addingBaby}>
          {addingBaby ? <ActivityIndicator /> : <Text style={styles.secondaryButtonText}>Add baby</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Join a different family</Text>
        <TextInput
          style={styles.input}
          placeholder="Invite code"
          autoCapitalize="characters"
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.secondaryButton} onPress={onJoinFamily} disabled={joining}>
          {joining ? <ActivityIndicator /> : <Text style={styles.secondaryButtonText}>Join family</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#FFF8F2', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#3E2E63' },
  signedInAs: { fontSize: 13, color: '#8A7CA8', marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0EAF9',
  },
  cardLabel: { fontSize: 13, color: '#8A7CA8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  cardMeta: { fontSize: 13, color: '#8A7CA8', marginTop: 4 },
  inviteCode: { fontSize: 28, fontWeight: '800', color: '#7B61C7', letterSpacing: 4 },
  shareButton: { backgroundColor: '#7B61C7', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  shareButtonText: { color: '#fff', fontWeight: '700' },
  memberRow: { fontSize: 15, color: '#3E2E63', paddingVertical: 4 },
  input: {
    backgroundColor: '#FBF8FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E6DFF2',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#7B61C7',
  },
  secondaryButtonText: { color: '#7B61C7', fontWeight: '700' },
  error: { color: '#D0455B', marginTop: 8, textAlign: 'center' },
  logoutButton: { alignItems: 'center', paddingVertical: 16 },
  logoutText: { color: '#D0455B', fontWeight: '600' },
});
