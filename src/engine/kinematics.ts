/**
 * Forward and Inverse Kinematics solver for N-axis robotic arm.
 * 
 * FK: Joint angles → End-effector pose (position + orientation)
 * IK: Target pose → Joint angles (numerical Jacobian-based solver)
 */

import type { ArmConfig, Pose, Position, TransformMatrix } from '@/types/arm';
import {
  dhTransformMatrix,
  multiplyMatrices,
  identityMatrix,
  extractPosition,
  extractEulerAngles,
  degToRad,
  radToDeg,
} from './dh-params';

/**
 * Compute Forward Kinematics for the arm.
 * 
 * @param config - Arm configuration
 * @param jointAngles - Array of joint angles in degrees
 * @returns End-effector pose (position in mm, orientation in degrees)
 */
export function forwardKinematics(config: ArmConfig, jointAngles: number[]): Pose {
  const transform = getEndEffectorTransform(config, jointAngles);
  const position = extractPosition(transform);
  const orientation = extractEulerAngles(transform);

  return { position, orientation };
}

/**
 * Compute the full transformation chain and return the end-effector transform.
 */
export function getEndEffectorTransform(
  config: ArmConfig,
  jointAngles: number[]
): TransformMatrix {
  let transform = identityMatrix();

  // Apply base height offset
  const baseTransform: TransformMatrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, config.baseHeight],
    [0, 0, 0, 1],
  ];
  transform = multiplyMatrices(transform, baseTransform);

  // Chain DH transforms for each joint
  const numJoints = Math.min(config.axes.length, jointAngles.length);
  for (let i = 0; i < numJoints; i++) {
    const axis = config.axes[i];
    const jointTransform = dhTransformMatrix(axis.dhParams, jointAngles[i], axis.jointType);
    transform = multiplyMatrices(transform, jointTransform);
  }

  return transform;
}

/**
 * Compute intermediate transforms for each joint (for 3D visualization).
 * Returns an array of transforms from base to each joint.
 */
export function getJointTransforms(
  config: ArmConfig,
  jointAngles: number[]
): TransformMatrix[] {
  const transforms: TransformMatrix[] = [];
  let current = identityMatrix();

  // Base transform
  const baseTransform: TransformMatrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, config.baseHeight],
    [0, 0, 0, 1],
  ];
  current = multiplyMatrices(current, baseTransform);
  transforms.push(current.map((row) => [...row]) as TransformMatrix);

  // Each joint
  const numJoints = Math.min(config.axes.length, jointAngles.length);
  for (let i = 0; i < numJoints; i++) {
    const axis = config.axes[i];
    const jointTransform = dhTransformMatrix(axis.dhParams, jointAngles[i], axis.jointType);
    current = multiplyMatrices(current, jointTransform);
    transforms.push(current.map((row) => [...row]) as TransformMatrix);
  }

  return transforms;
}

/**
 * Numerical Inverse Kinematics using Jacobian pseudo-inverse method.
 * Works for any number of joints (6+ axes).
 * 
 * @param config - Arm configuration
 * @param targetPose - Desired end-effector pose
 * @param initialAngles - Starting joint angles for the solver
 * @param maxIterations - Maximum solver iterations
 * @param tolerance - Position tolerance in mm
 * @returns Joint angles in degrees, or null if no solution found
 */
export function inverseKinematics(
  config: ArmConfig,
  targetPose: Pose,
  initialAngles?: number[],
  maxIterations: number = 100,
  tolerance: number = 0.5
): number[] | null {
  const numJoints = config.axes.length;
  const angles = initialAngles
    ? [...initialAngles]
    : config.axes.map((a) => a.homeAngle);

  const targetPos = targetPose.position;
  const targetOri = targetPose.orientation;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Current end-effector pose
    const currentPose = forwardKinematics(config, angles);
    const currentPos = currentPose.position;
    const currentOri = currentPose.orientation;

    // Position error
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    const dz = targetPos.z - currentPos.z;

    // Orientation error (simplified — just use degree differences)
    const dRoll = normalizeAngle(targetOri.roll - currentOri.roll);
    const dPitch = normalizeAngle(targetOri.pitch - currentOri.pitch);
    const dYaw = normalizeAngle(targetOri.yaw - currentOri.yaw);

    // Error vector [dx, dy, dz, dRoll, dPitch, dYaw]
    const error = [dx, dy, dz, dRoll * 0.1, dPitch * 0.1, dYaw * 0.1];
    
    // Check convergence (position only for now)
    const posError = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (posError < tolerance) {
      // Clamp to joint limits
      for (let i = 0; i < numJoints; i++) {
        const axis = config.axes[i];
        angles[i] = Math.max(axis.limits.min, Math.min(axis.limits.max, angles[i]));
      }
      return angles;
    }

    // Compute numerical Jacobian
    const jacobian = computeJacobian(config, angles);

    // Compute pseudo-inverse: J^T * (J * J^T + λI)^{-1}
    // Using damped least squares (Levenberg-Marquardt)
    const lambda = 0.5; // Damping factor
    const deltaAngles = dampedLeastSquares(jacobian, error, lambda, numJoints);

    // Update angles
    const stepSize = 0.5;
    for (let i = 0; i < numJoints; i++) {
      angles[i] += radToDeg(deltaAngles[i]) * stepSize;
      // Clamp to limits
      const axis = config.axes[i];
      angles[i] = Math.max(axis.limits.min, Math.min(axis.limits.max, angles[i]));
    }
  }

  // Failed to converge
  return null;
}

/**
 * Compute the numerical Jacobian matrix.
 * Each column is the partial derivative of end-effector pose w.r.t. joint angle.
 */
function computeJacobian(config: ArmConfig, angles: number[]): number[][] {
  const numJoints = config.axes.length;
  const jacobian: number[][] = [];

  // Current pose
  const currentPose = forwardKinematics(config, angles);

  for (let j = 0; j < numJoints; j++) {
    const isPrismatic = config.axes[j]?.jointType === 'prismatic';
    const delta = isPrismatic ? 0.1 : 0.01; // mm for prismatic, degrees for revolute
    const denom = isPrismatic ? delta : degToRad(delta);

    const perturbedAngles = [...angles];
    perturbedAngles[j] += delta;

    const perturbedPose = forwardKinematics(config, perturbedAngles);

    // Numerical derivatives
    const col = [
      (perturbedPose.position.x - currentPose.position.x) / denom,
      (perturbedPose.position.y - currentPose.position.y) / denom,
      (perturbedPose.position.z - currentPose.position.z) / denom,
      (normalizeAngle(perturbedPose.orientation.roll - currentPose.orientation.roll) * 0.1) / denom,
      (normalizeAngle(perturbedPose.orientation.pitch - currentPose.orientation.pitch) * 0.1) / denom,
      (normalizeAngle(perturbedPose.orientation.yaw - currentPose.orientation.yaw) * 0.1) / denom,
    ];

    jacobian.push(col);
  }

  return jacobian;
}

/**
 * Damped Least Squares (Levenberg-Marquardt) solver.
 * Computes: dθ = J^T * (J * J^T + λ²I)^{-1} * e
 */
function dampedLeastSquares(
  jacobian: number[][],
  error: number[],
  lambda: number,
  numJoints: number
): number[] {
  const m = error.length; // Task space dimension (6)
  const n = numJoints;    // Joint space dimension

  // J * J^T (m x m)
  const jjt: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < n; k++) {
        jjt[i][j] += jacobian[k][i] * jacobian[k][j];
      }
    }
    // Add damping: λ²I
    jjt[i][i] += lambda * lambda;
  }

  // Solve (J*J^T + λ²I) * y = e using simple Gauss elimination
  const y = solveLinearSystem(jjt, error);

  // dθ = J^T * y
  const deltaAngles: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      deltaAngles[i] += jacobian[i][j] * y[j];
    }
  }

  return deltaAngles;
}

/**
 * Simple Gaussian elimination to solve Ax = b.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Augmented matrix
  const aug = A.map((row, i) => [...row, b[i]]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    // Swap rows
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) continue;

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x: number[] = Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= aug[row][col] * x[col];
    }
    const divisor = aug[row][row];
    x[row] = Math.abs(divisor) > 1e-10 ? sum / divisor : 0;
  }

  return x;
}

/**
 * Check if a target position is within the arm's reachable workspace.
 */
export function isReachable(config: ArmConfig, target: Position): boolean {
  // Compute approximate max reach
  let maxReach = 0;
  for (const axis of config.axes) {
    maxReach += axis.dhParams.a + axis.dhParams.d;
  }
  maxReach += config.baseHeight;

  const distance = Math.sqrt(
    target.x * target.x + target.y * target.y + target.z * target.z
  );

  // Very rough check — actual workspace is more complex
  return distance <= maxReach && target.z >= -config.baseHeight;
}

/**
 * Compute workspace envelope radius (approximate).
 */
export function getWorkspaceRadius(config: ArmConfig): number {
  let maxReach = 0;
  for (const axis of config.axes) {
    maxReach += Math.abs(axis.dhParams.a) + Math.abs(axis.dhParams.d);
  }
  return maxReach;
}

/** Helper to normalize degree differences to [-180, 180] */
function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}
