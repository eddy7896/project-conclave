/**
 * Default arm configuration for a 4-axis desktop robotic arm.
 * 
 * Joint layout:
 *   J1 (Pan Joint)     — MG995 360° servo — horizontal rotation
 *   J2 (Shoulder Joint) — MG996R servo — lifts arm up/down
 *   J3 (Extended Arm)   — MG996R servo — extends/retracts forearm
 *   J4 (Gripper Joint)  — MG996R servo — proportional grip
 * 
 * Total reach: ~265mm (base to gripper tip)
 */

import type { ArmConfig, AxisConfig } from '@/types/arm';

/** Default 6-axis configuration */
export const DEFAULT_ARM_CONFIG: ArmConfig = {
  name: 'Conclave Arm v1',
  baseHeight: 30,
  baseRadius: 40,
  defaultSpeed: 45,
  maxAcceleration: 90,
  axes: [
    {
      id: 0,
      name: 'Pan Joint',
      jointType: 'revolute',
      type: 'servo',
      motorModel: 'MG995',
      dhParams: { a: 0, d: 25, alpha: -90, thetaOffset: 0 },
      limits: { min: 0, max: 180 },
      linkLength: 0,
      linkRadius: 14,
      jointRadius: 16,
      color: '#3B82F6', // Blue
      homeAngle: 90,
      defaultSpeed: 45,
    },
    {
      id: 1,
      name: 'Shoulder Joint',
      jointType: 'revolute',
      type: 'servo',
      motorModel: 'MG996R',
      dhParams: { a: 0, d: 0, alpha: 90, thetaOffset: -90 },
      limits: { min: 0, max: 180 },
      linkLength: 0,
      linkRadius: 12,
      jointRadius: 14,
      color: '#8B5CF6', // Violet
      homeAngle: 90,
      defaultSpeed: 30,
    },
    {
      id: 2,
      name: 'Extended Arm',
      jointType: 'prismatic',
      type: 'servo',
      motorModel: 'MG996R',
      dhParams: { a: 0, d: 0, alpha: 0, thetaOffset: 0 },
      limits: { min: 0, max: 150 }, // 0 to 150mm extension
      linkLength: 100,
      linkRadius: 10,
      jointRadius: 12,
      color: '#EC4899', // Pink
      homeAngle: 50, // 50mm extended by default
      defaultSpeed: 20, // mm/s
    },
    {
      id: 3,
      name: 'Gripper Joint',
      jointType: 'prismatic',
      type: 'servo',
      motorModel: 'MG996R',
      dhParams: { a: 0, d: 40, alpha: 0, thetaOffset: 0 },
      limits: { min: 0, max: 50 }, // 0 to 50mm
      linkLength: 0,
      linkRadius: 6,
      jointRadius: 8,
      color: '#EF4444', // Red
      homeAngle: 10,
      defaultSpeed: 30,
    },
  ],
};

/** Get home angles for all joints */
export function getHomeAngles(config: ArmConfig): number[] {
  return config.axes.map((axis) => axis.homeAngle);
}

/** Get joint limits as [min, max] tuples */
export function getJointLimits(config: ArmConfig): [number, number][] {
  return config.axes.map((axis) => [axis.limits.min, axis.limits.max]);
}

/** Clamp angle to joint limits */
export function clampAngle(angle: number, axis: AxisConfig): number {
  return Math.max(axis.limits.min, Math.min(axis.limits.max, angle));
}

/** Create a new axis configuration (for extensibility) */
export function createAxisConfig(
  id: number,
  name: string,
  overrides: Partial<AxisConfig> = {}
): AxisConfig {
  return {
    id,
    name,
    type: 'servo',
    motorModel: 'MG996R',
    dhParams: { a: 0, d: 0, alpha: 0, thetaOffset: 0 },
    limits: { min: 0, max: 180 },
    linkLength: 50,
    linkRadius: 10,
    jointRadius: 12,
    color: '#6B7280',
    homeAngle: 90,
    defaultSpeed: 45,
    ...overrides,
  };
}
