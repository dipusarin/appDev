import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Baby, Family, Member, User } from '../api/types';

const TOKEN_KEY = 'nara-baby.token';

interface AuthContextValue {
  loading: boolean;
  token: string | null;
  user: User | null;
  family: Family | null;
  members: Member[];
  babies: Baby[];
  selectedBabyId: string | null;
  setSelectedBabyId: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    name: string;
    familyName?: string;
    inviteCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  joinFamily: (inviteCode: string) => Promise<void>;
  addBaby: (name: string, birthDate?: string) => Promise<Baby>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  const applyMe = useCallback((me: { user: User; family: Family; members: Member[]; babies: Baby[] }) => {
    setUser(me.user);
    setFamily(me.family);
    setMembers(me.members);
    setBabies(me.babies);
    setSelectedBabyId((prev) => prev ?? me.babies[0]?.id ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          const me = await api.me(stored);
          setToken(stored);
          applyMe(me);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, [applyMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    const me = await api.me(res.token);
    applyMe(me);
  }, [applyMe]);

  const register = useCallback(
    async (params: { email: string; password: string; name: string; familyName?: string; inviteCode?: string }) => {
      const res = await api.register(params);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      const me = await api.me(res.token);
      applyMe(me);
    },
    [applyMe]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setFamily(null);
    setMembers([]);
    setBabies([]);
    setSelectedBabyId(null);
  }, []);

  const joinFamily = useCallback(
    async (inviteCode: string) => {
      if (!token) return;
      await api.joinFamily(token, inviteCode);
      const me = await api.me(token);
      setSelectedBabyId(null);
      applyMe(me);
    },
    [token, applyMe]
  );

  const addBaby = useCallback(
    async (name: string, birthDate?: string) => {
      if (!token) throw new Error('Not authenticated');
      const baby = await api.createBaby(token, { name, birthDate });
      setBabies((prev) => [...prev, baby]);
      setSelectedBabyId((prev) => prev ?? baby.id);
      return baby;
    },
    [token]
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    const me = await api.me(token);
    applyMe(me);
  }, [token, applyMe]);

  const value = useMemo(
    () => ({
      loading,
      token,
      user,
      family,
      members,
      babies,
      selectedBabyId,
      setSelectedBabyId,
      login,
      register,
      logout,
      joinFamily,
      addBaby,
      refresh,
    }),
    [loading, token, user, family, members, babies, selectedBabyId, login, register, logout, joinFamily, addBaby, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
