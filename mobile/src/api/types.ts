export interface User {
  id: string;
  email: string;
  name: string;
  familyId: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface Baby {
  id: string;
  name: string;
  birthDate: string | null;
}

export type FeedingType = 'breastfeed' | 'bottle' | 'solids' | 'combo';
export type DiaperType = 'wet' | 'dirty' | 'dry';
export type DiaperTexture = 'runny' | 'mucosy' | 'mushy' | 'solid' | 'pebbles';
export type DiaperColor = 'black' | 'green' | 'yellow' | 'brown' | 'red' | 'gray';
export type SleepType = 'nap' | 'night';

export interface Feeding {
  id: string;
  type: FeedingType;
  amountMl: number | null;
  durationMin: number | null;
  startedAt: string;
  notes: string | null;
  loggedByName: string;
  loggedByUserId: string;
}

export interface Pump {
  id: string;
  startedAt: string;
  durationMin: number | null;
  notes: string | null;
  loggedByName: string;
  loggedByUserId: string;
}

export interface Sleep {
  id: string;
  type: SleepType;
  startedAt: string;
  durationMin: number | null;
  notes: string | null;
  loggedByName: string;
  loggedByUserId: string;
}

export interface Diaper {
  id: string;
  type: DiaperType;
  texture: DiaperTexture | null;
  color: DiaperColor | null;
  loggedAt: string;
  notes: string | null;
  loggedByName: string;
  loggedByUserId: string;
}

export interface TimelineEntry {
  id: string;
  kind: 'feeding' | 'diaper' | 'pump' | 'sleep';
  type?: FeedingType | DiaperType | SleepType;
  texture?: DiaperTexture | null;
  color?: DiaperColor | null;
  timestamp: string;
  amountMl?: number | null;
  durationMin?: number | null;
  notes: string | null;
  loggedByName: string;
}

export interface BabySummary {
  baby: Baby;
  lastFeeding: (Omit<Feeding, 'loggedByUserId'> & { startedAt: string }) | null;
  lastDiaper: (Omit<Diaper, 'loggedByUserId'> & { loggedAt: string }) | null;
  lastPump: (Omit<Pump, 'loggedByUserId'> & { startedAt: string }) | null;
  lastSleep: (Omit<Sleep, 'loggedByUserId'> & { startedAt: string }) | null;
}
