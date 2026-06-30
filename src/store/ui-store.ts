/**
 * UI state store — theme, panel visibility, selected elements.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, PanelConfig } from '@/types/config';

interface UIState {
  /** Current theme mode */
  theme: ThemeMode;

  /** Panel visibility */
  panels: PanelConfig;

  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean;

  /** Active control tab */
  activeTab: 'joint' | 'cartesian' | 'waypoints' | 'settings';

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  togglePanel: (panel: keyof PanelConfig) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      panels: {
        sidebar: true,
        controlPanel: true,
        telemetry: true,
        statusBar: true,
      },
      sidebarCollapsed: false,
      activeTab: 'joint',

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setTheme: (theme) => set({ theme }),

      togglePanel: (panel) =>
        set((state) => ({
          panels: { ...state.panels, [panel]: !state.panels[panel] },
        })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'conclave-ui-settings',
    }
  )
);
