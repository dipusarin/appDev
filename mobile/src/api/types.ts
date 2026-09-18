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

export type FeedingType = 'breast' | 'bottle' | 'formula';
export type DiaperType = 'wet' | 'dirty' | 'both';

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

export interface Diaper {
  id: string;
  type: DiaperType;
  loggedAt: string;
  notes: string | null;
  loggedByName: string;
  loggedByUserId: string;
}

export interface TimelineEntry {
  id: string;
  kind: 'feeding' | 'diaper';
  type: FeedingType | DiaperType;
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
}
