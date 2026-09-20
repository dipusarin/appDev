import { API_BASE_URL } from '../config';
import type {
  Baby,
  BabySummary,
  Diaper,
  DiaperColor,
  DiaperTexture,
  DiaperType,
  Family,
  Feeding,
  FeedingType,
  Member,
  Pump,
  Sleep,
  SleepType,
  TimelineEntry,
  User,
} from './types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed with status ${res.status}`, res.status);
  }
  return data as T;
}

export interface AuthResponse {
  token: string;
  user: User;
  family: Family;
}

export interface MeResponse {
  user: User;
  family: Family;
  members: Member[];
  babies: Baby[];
}

export const api = {
  register: (body: {
    email: string;
    password: string;
    name: string;
    familyName?: string;
    inviteCode?: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),

  me: (token: string) => request<MeResponse>('/auth/me', { token }),

  joinFamily: (token: string, inviteCode: string) =>
    request<{ family: Family }>('/families/join', { method: 'POST', body: { inviteCode }, token }),

  createBaby: (token: string, body: { name: string; birthDate?: string }) =>
    request<Baby>('/babies', { method: 'POST', body, token }),

  listBabies: (token: string) => request<Baby[]>('/babies', { token }),

  getSummary: (token: string, babyId: string) =>
    request<BabySummary>(`/babies/${babyId}/summary`, { token }),

  getTimeline: (token: string, babyId: string, limit = 50) =>
    request<TimelineEntry[]>(`/babies/${babyId}/timeline?limit=${limit}`, { token }),

  logFeeding: (
    token: string,
    babyId: string,
    body: { type: FeedingType; amountMl?: number; durationMin?: number; startedAt?: string; notes?: string }
  ) => request<Feeding>(`/babies/${babyId}/feedings`, { method: 'POST', body, token }),

  logDiaper: (
    token: string,
    babyId: string,
    body: { type: DiaperType; texture?: DiaperTexture; color?: DiaperColor; loggedAt?: string; notes?: string }
  ) => request<Diaper>(`/babies/${babyId}/diapers`, { method: 'POST', body, token }),

  logPump: (
    token: string,
    babyId: string,
    body: { startedAt?: string; durationMin?: number; notes?: string }
  ) => request<Pump>(`/babies/${babyId}/pumps`, { method: 'POST', body, token }),

  logSleep: (
    token: string,
    babyId: string,
    body: { type: SleepType; startedAt?: string; durationMin?: number; notes?: string }
  ) => request<Sleep>(`/babies/${babyId}/sleep`, { method: 'POST', body, token }),

  updateFeeding: (
    token: string,
    babyId: string,
    id: string,
    body: Partial<{ type: FeedingType; amountMl: number | null; durationMin: number | null; startedAt: string; notes: string | null }>
  ) => request<Feeding>(`/babies/${babyId}/feedings/${id}`, { method: 'PATCH', body, token }),

  updateDiaper: (
    token: string,
    babyId: string,
    id: string,
    body: Partial<{
      type: DiaperType;
      texture: DiaperTexture | null;
      color: DiaperColor | null;
      loggedAt: string;
      notes: string | null;
    }>
  ) => request<Diaper>(`/babies/${babyId}/diapers/${id}`, { method: 'PATCH', body, token }),

  updatePump: (
    token: string,
    babyId: string,
    id: string,
    body: Partial<{ startedAt: string; durationMin: number | null; notes: string | null }>
  ) => request<Pump>(`/babies/${babyId}/pumps/${id}`, { method: 'PATCH', body, token }),

  updateSleep: (
    token: string,
    babyId: string,
    id: string,
    body: Partial<{ type: SleepType; startedAt: string; durationMin: number | null; notes: string | null }>
  ) => request<Sleep>(`/babies/${babyId}/sleep/${id}`, { method: 'PATCH', body, token }),

  deleteFeeding: (token: string, babyId: string, id: string) =>
    request<void>(`/babies/${babyId}/feedings/${id}`, { method: 'DELETE', token }),

  deleteDiaper: (token: string, babyId: string, id: string) =>
    request<void>(`/babies/${babyId}/diapers/${id}`, { method: 'DELETE', token }),

  deletePump: (token: string, babyId: string, id: string) =>
    request<void>(`/babies/${babyId}/pumps/${id}`, { method: 'DELETE', token }),

  deleteSleep: (token: string, babyId: string, id: string) =>
    request<void>(`/babies/${babyId}/sleep/${id}`, { method: 'DELETE', token }),
};
