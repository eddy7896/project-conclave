/**
 * Connection state store — tracks Firebase and ESP32 connection status.
 */

import { create } from 'zustand';
import type { FirebaseConnectionState, DeviceState } from '@/types/firebase';

interface ConnectionState {
  /** Firebase RTDB connection state */
  firebaseState: FirebaseConnectionState;

  /** ESP32 device online state */
  deviceState: DeviceState;

  /** Last time ESP32 was seen online (timestamp ms) */
  lastDeviceSeen: number | null;

  /** Estimated latency in ms */
  latency: number;

  /** Whether we're in simulated/mock mode */
  isSimulated: boolean;

  /** Error message if any */
  error: string | null;

  // Actions
  setFirebaseState: (state: FirebaseConnectionState) => void;
  setDeviceState: (state: DeviceState) => void;
  setLastDeviceSeen: (timestamp: number) => void;
  setLatency: (ms: number) => void;
  setSimulated: (simulated: boolean) => void;
  setError: (error: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  firebaseState: 'simulated',
  deviceState: 'unknown',
  lastDeviceSeen: null,
  latency: 0,
  isSimulated: true,
  error: null,

  setFirebaseState: (firebaseState) => set({ firebaseState }),
  setDeviceState: (deviceState) => set({ deviceState }),
  setLastDeviceSeen: (timestamp) => set({ lastDeviceSeen: timestamp }),
  setLatency: (latency) => set({ latency }),
  setSimulated: (isSimulated) => set({ isSimulated }),
  setError: (error) => set({ error }),
}));
