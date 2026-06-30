/**
 * Waypoint and sequence state management.
 */

import { create } from 'zustand';
import type { Waypoint, Sequence, PlaybackState } from '@/types/arm';

interface WaypointState {
  /** All saved waypoints */
  waypoints: Waypoint[];

  /** All saved sequences */
  sequences: Sequence[];

  /** Current playback state */
  playbackState: PlaybackState;

  /** Currently playing sequence ID */
  activeSequenceId: string | null;

  /** Current waypoint index in active sequence */
  currentWaypointIndex: number;

  // Actions
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  reorderWaypoints: (ids: string[]) => void;
  clearWaypoints: () => void;

  addSequence: (sequence: Sequence) => void;
  removeSequence: (id: string) => void;

  setPlaybackState: (state: PlaybackState) => void;
  setActiveSequence: (id: string | null) => void;
  setCurrentWaypointIndex: (index: number) => void;

  /** Export waypoints as JSON string */
  exportWaypoints: () => string;
  /** Import waypoints from JSON string */
  importWaypoints: (json: string) => void;
}

export const useWaypointStore = create<WaypointState>((set, get) => ({
  waypoints: [],
  sequences: [],
  playbackState: 'stopped',
  activeSequenceId: null,
  currentWaypointIndex: 0,

  addWaypoint: (waypoint) =>
    set((state) => ({ waypoints: [...state.waypoints, waypoint] })),

  removeWaypoint: (id) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== id),
    })),

  updateWaypoint: (id, updates) =>
    set((state) => ({
      waypoints: state.waypoints.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  reorderWaypoints: (ids) =>
    set((state) => {
      const waypointMap = new Map(state.waypoints.map((w) => [w.id, w]));
      const reordered = ids
        .map((id) => waypointMap.get(id))
        .filter(Boolean) as Waypoint[];
      return { waypoints: reordered };
    }),

  clearWaypoints: () => set({ waypoints: [] }),

  addSequence: (sequence) =>
    set((state) => ({ sequences: [...state.sequences, sequence] })),

  removeSequence: (id) =>
    set((state) => ({
      sequences: state.sequences.filter((s) => s.id !== id),
    })),

  setPlaybackState: (playbackState) => set({ playbackState }),
  setActiveSequence: (activeSequenceId) => set({ activeSequenceId }),
  setCurrentWaypointIndex: (currentWaypointIndex) =>
    set({ currentWaypointIndex }),

  exportWaypoints: () => {
    const state = get();
    return JSON.stringify(
      { waypoints: state.waypoints, sequences: state.sequences },
      null,
      2
    );
  },

  importWaypoints: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.waypoints && Array.isArray(data.waypoints)) {
        set({
          waypoints: data.waypoints,
          sequences: data.sequences || [],
        });
      }
    } catch {
      console.error('Failed to import waypoints: invalid JSON');
    }
  },
}));
