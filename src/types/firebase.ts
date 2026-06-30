/**
 * Firebase Realtime Database schema types.
 * Mirrors the RTDB JSON structure.
 */

/** Root database schema */
export interface RTDBSchema {
  arms: Record<string, ArmDocument>;
}

/** Single arm document in the database */
export interface ArmDocument {
  config: ArmConfigDB;
  commands: CommandsDB;
  telemetry: TelemetryDB;
  waypoints: Record<string, WaypointDB>;
}

/** Arm configuration stored in Firebase */
export interface ArmConfigDB {
  name: string;
  axisCount: number;
  axes: AxisConfigDB[];
}

/** Simplified axis config for Firebase storage */
export interface AxisConfigDB {
  id: number;
  name: string;
  type: 'servo' | 'stepper';
  motorModel: string;
  minAngle: number;
  maxAngle: number;
  homeAngle: number;
  linkLength: number;
  linkOffset: number;
  color: string;
}

/** Commands node — written by dashboard, read by ESP32 */
export interface CommandsDB {
  joints: {
    angles: number[];
    speed: number;
    timestamp: number;
  };
  action: 'MOVE' | 'HOME' | 'STOP' | 'IDLE';
  emergency_stop: boolean;
}

/** Telemetry node — written by ESP32, read by dashboard */
export interface TelemetryDB {
  currentAngles: number[];
  endEffector: {
    x: number;
    y: number;
    z: number;
  };
  motorStatus: MotorStatusDB[];
  online: boolean;
  lastSeen: number;
  latency: number;
}

/** Per-motor status in telemetry */
export interface MotorStatusDB {
  current: number;
  temp: number;
  stalled: boolean;
}

/** Waypoint stored in Firebase */
export interface WaypointDB {
  name: string;
  angles: number[];
  speed: number;
  dwellTime: number;
  createdAt: number;
}

/** Firebase connection state */
export type FirebaseConnectionState = 
  | 'connecting'
  | 'connected' 
  | 'disconnected'
  | 'error'
  | 'simulated';

/** ESP32 device online state */
export type DeviceState = 'online' | 'offline' | 'unknown';
