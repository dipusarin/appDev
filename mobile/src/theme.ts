export const colors = {
  bg: '#FBF7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F0FC',
  border: '#EAE2F7',
  borderStrong: '#D9CCEF',

  textPrimary: '#241B3A',
  textSecondary: '#6F6489',
  textMuted: '#A79BC4',

  feeding: '#7C5CFC',
  feedingSoft: '#EFE9FE',
  pump: '#12B886',
  pumpSoft: '#E3F9F1',
  diaper: '#FF9F43',
  diaperSoft: '#FFF1E1',

  good: '#12B886',
  warn: '#F5A623',
  overdue: '#F0455C',

  danger: '#F0455C',
  dangerSoft: '#FDE7EA',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const font = {
  size: {
    xs: 11,
    sm: 13,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 32,
  },
  weight: {
    regular: '400' as const,
    medium: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
};

export const shadow = {
  card: {
    shadowColor: '#3E2E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#3E2E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
};

// Rough "time since" comfort thresholds in minutes, used to color dashboard cards.
export const URGENCY_THRESHOLDS = {
  feeding: { warn: 150, overdue: 210 }, // ~2.5h / 3.5h
  pump: { warn: 180, overdue: 240 }, // ~3h / 4h
  diaper: { warn: 150, overdue: 210 },
};

export function getUrgencyColor(minutesSince: number | null, kind: keyof typeof URGENCY_THRESHOLDS): string {
  if (minutesSince == null) return colors.textMuted;
  const { warn, overdue } = URGENCY_THRESHOLDS[kind];
  if (minutesSince >= overdue) return colors.overdue;
  if (minutesSince >= warn) return colors.warn;
  return colors.good;
}
