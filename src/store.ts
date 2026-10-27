import { create } from "zustand";
import type { SecurityEvent, Status } from "./types";
import { makeEvent, seedEvents } from "./data";

interface State {
  events: SecurityEvent[];
  selectedId: number | null;
  live: boolean;
  dark: boolean;
  addEvent: () => void;
  updateStatus: (id: number, status: Status) => void;
  select: (id: number | null) => void;
  toggleLive: () => void;
  toggleDark: () => void;
}

export const useStore = create<State>((set) => ({
  events: seedEvents(),
  selectedId: null,
  live: true,
  dark: typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches,

  addEvent: () => set((s) => ({ events: [makeEvent(Date.now()), ...s.events] })),
  updateStatus: (id, status) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, status } : e)) })),
  select: (id) => set({ selectedId: id }),
  toggleLive: () => set((s) => ({ live: !s.live })),
  toggleDark: () => set((s) => ({ dark: !s.dark })),
}));