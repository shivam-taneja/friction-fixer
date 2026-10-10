"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client-app";

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
