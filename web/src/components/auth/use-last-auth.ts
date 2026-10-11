"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthProviderName = "google" | "github";

type LastAuthState = {
  provider: AuthProviderName | null;
  setProvider: (provider: AuthProviderName) => void;
};

export const useLastAuth = create<LastAuthState>()(
  persist(
    (set) => ({
      provider: null,
      setProvider: (provider) => set({ provider }),
    }),
    {
      name: "friction-fixer:last-auth-provider",
      skipHydration: true,
      partialize: (state) => ({ provider: state.provider }),
    },
  ),
);
