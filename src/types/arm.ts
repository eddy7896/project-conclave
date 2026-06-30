/**
 * Core type definitions for the 6+ axis robotic arm system.
 * All angles are in degrees unless otherwise noted.
 * All distances are in millimeters.
 */

/** Denavit-Hartenberg parameters for a single joint */
export interface DHParams {
  /** Link length (a) — distance along x_i from z_{i-1} to z_i (mm) */
  a: number;
  /** Link offset (d) — distance along z_{i-1} from x_{i-1} to x_i (mm) */
  d: number;
  /** Link twist (alpha) — angle from z_{i-1} to z_i about x_i (degrees) */
  alpha: number;
  /** Joint angle offset (theta_offset) — added to joint variable (degrees) */
  thetaOffset: number;
}

/** Motor type used for a joint */
export type MotorType = 'servo' | 'stepper';

/** Configuration for a single axis/joint */
export interface AxisConfig {
  /** Unique axis identifier */
  id: number;
  /** Human-readable name (e.g., "Base", "Shoulder") */
  name: string;
  /** Joint type (revolute = rotates, prismatic = slides). Defaults to revolute. */
  jointType?: 'revolute' | 'prismatic';
  /** Motor type */
  type: MotorType;
  /** Motor model (e.g., "MG995", "MG996R") */
  motorModel: string;
  /** DH parameters for this joint */
  dhParams: DHParams;
  /** Joint angle limits in degrees */
  limits: {
    min: number;
    max: number;
  };
  /** Link length for 3D visualization (mm) */
  linkLength: number;
  /** Link radius for 3D visualization (mm) */
  linkRadius: number;
  /** Joint sphere radius for 3D visualization (mm) */
  jointRadius: number;
  /** Display color (hex) */
  color: string;
  /** Home/rest angle (degrees) */
  homeAngle: number;
  /** Default speed (degrees/second) */
  defaultSpeed: number;
}

/** Full arm configuration */
export interface ArmConfig {
  /** Arm name */
  name: string;
  /** Dynamic array of axis configurations */
  axes: AxisConfig[];
  /** Base pedestal height (mm) */
  baseHeight: number;
  /** Base radius for 3D visualization (mm) */
  baseRadius: number;
  /** Default movement speed (degrees/second) */
  defaultSpeed: number;
  /** Maximum acceleration (degrees/second²) */
  maxAcceleration: number;
}

/** 3D position in Cartesian space */
export interface Position {
  x: number; // mm
  y: number; // mm
  z: number; // mm
}

/** Orientation as Roll-Pitch-Yaw (degrees) */
export interface Orientation {
  roll: number;
  pitch: number;
  yaw: number;
}

/** Full 6-DOF pose (position + orientation) */
export interface Pose {
  position: Position;
  orientation: Orientation;
}

/** 4x4 homogeneous transformation matrix (row-major) */
export type TransformMatrix = number[][];

/** Joint state for a single axis */
export interface JointState {
  /** Current angle (degrees) */
  currentAngle: number;
  /** Target angle (degrees) */
  targetAngle: number;
  /** Whether this joint is currently moving */
  isMoving: boolean;
}

/** Motor telemetry data */
export interface MotorTelemetry {
  /** Joint ID */
  jointId: number;
  /** Current draw (amps) */
  current: number;
  /** Temperature (°C) */
  temperature: number;
  /** Is motor stalled */
  isStalled: boolean;
}

/** Control mode for the dashboard */
export type ControlMode = 'joint' | 'cartesian';

/** Speed profile type */
export type SpeedProfile = 'linear' | 'trapezoidal' | 's-curve';

/** Waypoint — a saved arm position */
export interface Waypoint {
  /** Unique ID */
  id: string;
  /** User-defined name */
  name: string;
  /** Joint angles for this position */
  angles: number[];
  /** Movement speed (degrees/second) */
  speed: number;
  /** Dwell time at this position (ms) */
  dwellTime: number;
  /** When this waypoint was created */
  createdAt: number;
}

/** Sequence — ordered list of waypoints for playback */
export interface Sequence {
  /** Unique ID */
  id: string;
  /** Sequence name */
  name: string;
  /** Ordered waypoint IDs */
  waypointIds: string[];
  /** Whether to loop */
  loop: boolean;
  /** Created timestamp */
  createdAt: number;
}

/** Playback state for sequence execution */
export type PlaybackState = 'stopped' | 'playing' | 'paused';
