"use client";

import { create } from "zustand";
import { initialChanges, type Change } from "@/components/dashboard/workspace";

type WorkspaceState = {
  paused: boolean;
  setPaused: (paused: boolean) => void;
  changes: Change[];
  setChanges: (updater: (items: Change[]) => Change[]) => void;
};

export const useWorkspace = create<WorkspaceState>((set) => ({
  paused: false,
  setPaused: (paused) => set({ paused }),
  changes: initialChanges,
  setChanges: (updater) =>
    set((state) => ({ changes: updater(state.changes) })),
}));
