"use client";

import { useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client-app";
import { onIdTokenChanged } from "firebase/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const auth = getFirebaseAuth();

    return onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();

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

  return <>{children}</>;
}
