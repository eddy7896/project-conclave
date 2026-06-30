/**
 * Application configuration types.
 */

/** Dashboard app configuration */
export interface AppConfig {
  /** Firebase project configuration */
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  /** Arm ID in the database */
  armId: string;
  /** Whether to use mock Firebase (for development) */
  useMockFirebase: boolean;
  /** Telemetry update throttle (ms) */
  telemetryThrottleMs: number;
  /** Command debounce delay (ms) */
  commandDebounceMs: number;
  /** ESP32 offline detection timeout (ms) */
  deviceOfflineTimeoutMs: number;
}

/** Theme mode */
export type ThemeMode = 'dark' | 'light';

/** Panel visibility configuration */
export interface PanelConfig {
  sidebar: boolean;
  controlPanel: boolean;
  telemetry: boolean;
  statusBar: boolean;
}

/** Camera preset for the 3D viewport */
export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}
