"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "@/services/auth.service";

type AuthContextValue = {
  user: User | null;
  role: string | null;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
    setUser(nextUser);
    if (!nextUser) {
      setRole(null);
      setLoading(false);
      return;
    }
    try {
      setRole(((await nextUser.getIdTokenResult()).claims.role as string | undefined) ?? null);
    } catch {
      setRole(null);
    }
    setLoading(false);
  }), []);

  return (
    <AuthContext.Provider value={{ user, role, loading, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
