/**
 * Joint constraints: limit enforcement, singularity detection.
 */

import type { ArmConfig, Position } from '@/types/arm';
import { forwardKinematics, getWorkspaceRadius } from './kinematics';

/**
 * Validate and clamp joint angles to their limits.
 * Returns clamped angles and a list of which joints were clamped.
 */
export function enforceJointLimits(
  config: ArmConfig,
  angles: number[]
): { angles: number[]; clamped: number[] } {
  const clamped: number[] = [];
  const result = angles.map((angle, i) => {
    if (i >= config.axes.length) return angle;
    const axis = config.axes[i];
    if (angle < axis.limits.min) {
      clamped.push(i);
      return axis.limits.min;
    }
    if (angle > axis.limits.max) {
      clamped.push(i);
      return axis.limits.max;
    }
    return angle;
  });

  return { angles: result, clamped };
}

/**
 * Check if a target position is within the arm's approximate workspace.
 */
export function checkReachability(
  config: ArmConfig,
  target: Position
): { reachable: boolean; distance: number; maxReach: number } {
  const maxReach = getWorkspaceRadius(config);
  const distance = Math.sqrt(
    target.x * target.x + target.y * target.y + target.z * target.z
  );

  return {
    reachable: distance <= maxReach && target.z >= -config.baseHeight * 0.5,
    distance,
    maxReach,
  };
}

/**
 * Simple singularity detection.
 * Checks if the arm is near a singular configuration (fully extended or folded).
 */
export function detectSingularity(
  config: ArmConfig,
  angles: number[]
): { isSingular: boolean; type: string | null } {
  // Check if elbow is fully extended (angles near 0° or 180°)
  for (let i = 1; i < config.axes.length - 1; i++) {
    const axis = config.axes[i];
    const angle = angles[i];
    const nearMin = Math.abs(angle - axis.limits.min) < 2;
    const nearMax = Math.abs(angle - axis.limits.max) < 2;

    if (nearMin || nearMax) {
      return {
        isSingular: true,
        type: `Joint ${axis.name} at ${nearMin ? 'minimum' : 'maximum'} limit`,
      };
    }
  }

  // Check if shoulder + elbow create full extension
  if (config.axes.length >= 3) {
    const shoulderAngle = angles[1] ?? 90;
    const elbowAngle = angles[2] ?? 90;
    if (Math.abs(shoulderAngle + elbowAngle - 180) < 5) {
      return {
        isSingular: true,
        type: 'Arm fully extended (shoulder + elbow singularity)',
      };
    }
  }

  return { isSingular: false, type: null };
}

/**
 * Validate a set of angles before sending to hardware.
 * Returns validation result with any issues found.
 */
export function validateAngles(
  config: ArmConfig,
  angles: number[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check array length
  if (angles.length !== config.axes.length) {
    issues.push(
      `Expected ${config.axes.length} joint angles, got ${angles.length}`
    );
  }

  // Check limits
  for (let i = 0; i < Math.min(angles.length, config.axes.length); i++) {
    const axis = config.axes[i];
    const angle = angles[i];

    if (isNaN(angle)) {
      issues.push(`Joint ${axis.name} (J${i + 1}): angle is NaN`);
      continue;
    }

    if (angle < axis.limits.min) {
      issues.push(
        `Joint ${axis.name} (J${i + 1}): ${angle.toFixed(1)}° below min ${axis.limits.min}°`
      );
    }

    if (angle > axis.limits.max) {
      issues.push(
        `Joint ${axis.name} (J${i + 1}): ${angle.toFixed(1)}° above max ${axis.limits.max}°`
      );
    }
  }

  // Check for singularities
  const singularity = detectSingularity(config, angles);
  if (singularity.isSingular) {
    issues.push(`Near singularity: ${singularity.type}`);
  }

  return { valid: issues.length === 0, issues };
}
