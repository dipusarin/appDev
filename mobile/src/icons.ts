import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DiaperType, FeedingType } from './api/types';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const FEEDING_ICONS: Record<FeedingType, MCIName> = {
  breastfeed: 'mother-nurse',
  bottle: 'baby-bottle-outline',
  solids: 'food-apple-outline',
  combo: 'food-variant',
};

export const DIAPER_ICONS: Record<DiaperType, MCIName> = {
  wet: 'water-outline',
  dirty: 'emoticon-poop-outline',
  dry: 'weather-sunny',
};

export const PUMP_ICON: MCIName = 'water-pump';
export const FEEDING_TAB_ICON: MCIName = 'baby-bottle-outline';
export const DIAPER_TAB_ICON: MCIName = 'diaper-outline';
