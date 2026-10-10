"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client-app";

type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    return onIdTokenChanged(auth, async (next) => {
      setUser(next);
      setLoading(false);

      if (next) {
        const token = await next.getIdToken();

        await fetch("/api/login", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await fetch("/api/logout");
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
