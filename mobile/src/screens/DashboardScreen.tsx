import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import IconTextInput from '../components/IconTextInput';
import { useAuth } from '../context/AuthContext';
import type { BabySummary } from '../api/types';
import { DIAPER_ICONS, FEEDING_ICONS, PUMP_ICON } from '../icons';
import { colors, font, getUrgencyColor, radius, shadow, spacing } from '../theme';
import { formatClockTime, formatRelativeTime } from '../utils/time';

const FEEDING_LABELS: Record<string, string> = {
  breastfeed: 'Breastfed',
  bottle: 'Bottle',
  solids: 'Solids',
  combo: 'Combo feed',
};
const DIAPER_LABELS: Record<string, string> = { wet: 'Wet', dirty: 'Dirty', dry: 'Dry' };

function minutesSince(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function AddBabyForm() {
  const { addBaby } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addBaby(name.trim());
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBadge}>
        <Ionicons name="happy-outline" size={34} color={colors.feeding} />
      </View>
      <Text style={styles.emptyTitle}>Add your baby to get started</Text>
      <IconTextInput icon="person-outline" placeholder="Baby's name" value={name} onChangeText={setName} />
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Add baby</Text>}
      </TouchableOpacity>
    </View>
  );
}

function StatusCard({
  icon,
  iconColor,
  iconSoft,
  label,
  lastIso,
  urgencyKind,
  meta,
  emptyText,
  onPress,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconSoft: string;
  label: string;
  lastIso: string | null;
  urgencyKind: 'feeding' | 'pump' | 'diaper';
  meta: string;
  emptyText: string;
  onPress: () => void;
}) {
  const urgencyColor = getUrgencyColor(minutesSince(lastIso), urgencyKind);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBadge, { backgroundColor: iconSoft }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>{label}</Text>
          {lastIso ? (
            <>
              <Text style={[styles.cardValue, { color: urgencyColor }]}>{formatRelativeTime(lastIso)}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {meta}
              </Text>
            </>
          ) : (
            <Text style={styles.cardEmpty}>{emptyText}</Text>
          )}
        </View>
        <View style={[styles.addButton, { backgroundColor: iconColor }]}>
          <Ionicons name="add" size={20} color={colors.white} />
        </View>
      </View>
      {lastIso ? <Text style={styles.cardTime}>Last logged at {formatClockTime(lastIso)}</Text> : null}
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, babies, selectedBabyId, setSelectedBabyId } = useAuth();
  const { token } = useAuth();
  const [summary, setSummary] = useState<BabySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(
    async (isRefresh = false) => {
      if (!token || !selectedBabyId) {
        setSummary(null);
        return;
      }
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const data = await api.getSummary(token, selectedBabyId);
        setSummary(data);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, selectedBabyId]
  );

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const selectedBaby = babies.find((b) => b.id === selectedBabyId);
  const firstName = user?.name?.split(' ')[0] ?? '';

  if (babies.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <AddBabyForm />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSummary(true)} />}
    >
      <Text style={styles.greeting}>Hi {firstName} 👋</Text>
      <Text style={styles.babyHeading}>{selectedBaby?.name ?? 'Your baby'}</Text>

      {babies.length > 1 && (
        <View style={styles.babyChips}>
          {babies.map((baby) => (
            <TouchableOpacity
              key={baby.id}
              style={[styles.chip, selectedBabyId === baby.id && styles.chipActive]}
              onPress={() => setSelectedBabyId(baby.id)}
            >
              <Text style={[styles.chipText, selectedBabyId === baby.id && styles.chipTextActive]}>
                {baby.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.feeding} />
      ) : (
        <View style={styles.cardStack}>
          <StatusCard
            icon={
              <MaterialCommunityIcons
                name={summary?.lastFeeding ? FEEDING_ICONS[summary.lastFeeding.type] : 'baby-bottle-outline'}
                size={22}
                color={colors.feeding}
              />
            }
            iconColor={colors.feeding}
            iconSoft={colors.feedingSoft}
            label="Feeding"
            urgencyKind="feeding"
            lastIso={summary?.lastFeeding?.startedAt ?? null}
            meta={
              summary?.lastFeeding
                ? [
                    FEEDING_LABELS[summary.lastFeeding.type],
                    summary.lastFeeding.amountMl ? `${summary.lastFeeding.amountMl} ml` : null,
                    summary.lastFeeding.durationMin ? `${summary.lastFeeding.durationMin} min` : null,
                    `by ${summary.lastFeeding.loggedByName}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : ''
            }
            emptyText="No feedings logged yet"
            onPress={() => navigation.navigate('AddFeeding', { babyId: selectedBabyId })}
          />

          <StatusCard
            icon={<MaterialCommunityIcons name={PUMP_ICON} size={22} color={colors.pump} />}
            iconColor={colors.pump}
            iconSoft={colors.pumpSoft}
            label="Pump session"
            urgencyKind="pump"
            lastIso={summary?.lastPump?.startedAt ?? null}
            meta={
              summary?.lastPump
                ? [summary.lastPump.durationMin ? `${summary.lastPump.durationMin} min` : 'Logged', `by ${summary.lastPump.loggedByName}`]
                    .filter(Boolean)
                    .join(' · ')
                : ''
            }
            emptyText="No pump sessions logged yet"
            onPress={() => navigation.navigate('AddPump', { babyId: selectedBabyId })}
          />

          <StatusCard
            icon={
              <MaterialCommunityIcons
                name={summary?.lastDiaper ? DIAPER_ICONS[summary.lastDiaper.type] : 'diaper-outline'}
                size={22}
                color={colors.diaper}
              />
            }
            iconColor={colors.diaper}
            iconSoft={colors.diaperSoft}
            label="Diaper change"
            urgencyKind="diaper"
            lastIso={summary?.lastDiaper?.loggedAt ?? null}
            meta={
              summary?.lastDiaper
                ? [
                    DIAPER_LABELS[summary.lastDiaper.type],
                    summary.lastDiaper.texture,
                    summary.lastDiaper.color,
                    `by ${summary.lastDiaper.loggedByName}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : ''
            }
            emptyText="No diaper changes logged yet"
            onPress={() => navigation.navigate('AddDiaper', { babyId: selectedBabyId })}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, flexGrow: 1, backgroundColor: colors.bg },
  greeting: { fontSize: font.size.md, color: colors.textSecondary, fontWeight: font.weight.medium },
  babyHeading: { fontSize: font.size.xxl, color: colors.textPrimary, fontWeight: font.weight.black, marginTop: 2, marginBottom: spacing.lg },
  babyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.feeding, borderColor: colors.feeding },
  chipText: { color: colors.textSecondary, fontWeight: font.weight.bold },
  chipTextActive: { color: colors.white },
  cardStack: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  addButton: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: font.size.sm, color: colors.textSecondary, fontWeight: font.weight.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardValue: { fontSize: font.size.xl, fontWeight: font.weight.black, marginTop: 2 },
  cardMeta: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: 2 },
  cardEmpty: { fontSize: font.size.md, color: colors.textMuted, marginTop: 4 },
  cardTime: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.sm },
  emptyState: { padding: spacing.sm, alignItems: 'stretch' },
  emptyIconBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.feedingSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
  button: { backgroundColor: colors.feeding, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', ...shadow.card },
  buttonText: { color: colors.white, fontSize: font.size.base, fontWeight: font.weight.bold },
});
