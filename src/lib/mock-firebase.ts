/**
 * Mock Firebase — simulates RTDB behavior for development.
 * No actual Firebase connection needed.
 */

import { useArmStore } from '@/store/arm-store';
import { useConnectionStore } from '@/store/connection-store';

/** Simulated telemetry data */
interface MockTelemetry {
  currentAngles: number[];
  motorStatus: { current: number; temp: number; stalled: boolean }[];
}

/**
 * Generate simulated motor telemetry.
 */
export function generateMockTelemetry(jointAngles: number[]): MockTelemetry {
  return {
    currentAngles: jointAngles,
    motorStatus: jointAngles.map(() => ({
      current: 0.2 + Math.random() * 0.6,
      temp: 28 + Math.random() * 15,
      stalled: false,
    })),
  };
}

/**
 * Initialize mock Firebase mode.
 * Sets the connection store to simulated state.
 */
export function initMockFirebase() {
  const connStore = useConnectionStore.getState();
  connStore.setSimulated(true);
  connStore.setFirebaseState('simulated');
  connStore.setDeviceState('unknown');

  // Log mock mode
  console.log(
    '%c[Conclave] Running in simulated mode — no Firebase connection',
    'color: #3b82f6; font-weight: bold'
  );
}

/**
 * Simulate sending a command (echoes back as telemetry after delay).
 */
export async function mockSendCommand(angles: number[], speed: number): Promise<void> {
  // Simulate network delay
  const delay = 50 + Math.random() * 100;
  await new Promise((r) => setTimeout(r, delay));

  // Update latency
  useConnectionStore.getState().setLatency(Math.round(delay));

  // Echo back as telemetry
  const armStore = useArmStore.getState();
  armStore.setAllJointAngles(angles);

  console.log(
    `%c[Mock] Command sent: [${angles.map((a) => a.toFixed(1)).join(', ')}] @ ${speed}%`,
    'color: #10b981'
  );
}
