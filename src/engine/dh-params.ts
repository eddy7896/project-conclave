/**
 * Denavit-Hartenberg parameter utilities.
 * 
 * Standard DH convention:
 *   T_i = Rz(θ_i) · Tz(d_i) · Tx(a_i) · Rx(α_i)
 * 
 * Where:
 *   θ = joint angle (variable for revolute joints)
 *   d = link offset along z-axis
 *   a = link length along x-axis
 *   α = link twist about x-axis
 */

import type { DHParams, TransformMatrix } from '@/types/arm';

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert radians to degrees */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Build a 4x4 homogeneous transformation matrix from DH parameters.
 * 
 * @param params - DH parameters for the joint
 * @param jointValue - Current joint angle (degrees) or extension (mm)
 * @param jointType - Type of joint ('revolute' or 'prismatic'), defaults to 'revolute'
 * @returns 4x4 transformation matrix
 */
export function dhTransformMatrix(
  params: DHParams,
  jointValue: number,
  jointType: 'revolute' | 'prismatic' = 'revolute'
): TransformMatrix {
  // For revolute joints, jointValue is added to thetaOffset.
  // For prismatic joints, theta is fixed, jointValue is added to d.
  const thetaDeg = jointType === 'revolute' ? jointValue + params.thetaOffset : params.thetaOffset;
  const dVal = jointType === 'prismatic' ? jointValue + params.d : params.d;

  const theta = degToRad(thetaDeg);
  const alpha = degToRad(params.alpha);
  const a = params.a;
  const d = dVal;

  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca,  st * sa, a * ct],
    [st,  ct * ca, -ct * sa, a * st],
    [0,   sa,       ca,      d     ],
    [0,   0,        0,       1     ],
  ];
}

/**
 * Multiply two 4x4 matrices.
 */
export function multiplyMatrices(a: TransformMatrix, b: TransformMatrix): TransformMatrix {
  const result: TransformMatrix = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

/**
 * Create a 4x4 identity matrix.
 */
export function identityMatrix(): TransformMatrix {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Extract position (x, y, z) from a 4x4 transformation matrix.
 */
export function extractPosition(matrix: TransformMatrix): { x: number; y: number; z: number } {
  return {
    x: matrix[0][3],
    y: matrix[1][3],
    z: matrix[2][3],
  };
}

/**
 * Extract Euler angles (Roll-Pitch-Yaw) from a 4x4 rotation matrix.
 * Uses ZYX convention.
 */
export function extractEulerAngles(matrix: TransformMatrix): { roll: number; pitch: number; yaw: number } {
  const r11 = matrix[0][0];
  const r21 = matrix[1][0];
  const r31 = matrix[2][0];
  const r32 = matrix[2][1];
  const r33 = matrix[2][2];

  // Handle gimbal lock
  const pitch = Math.asin(-clampValue(r31, -1, 1));
  
  let roll: number;
  let yaw: number;

  if (Math.abs(r31) < 0.99999) {
    roll = Math.atan2(r32, r33);
    yaw = Math.atan2(r21, r11);
  } else {
    // Gimbal lock
    roll = Math.atan2(-matrix[1][2], matrix[1][1]);
    yaw = 0;
  }

  return {
    roll: radToDeg(roll),
    pitch: radToDeg(pitch),
    yaw: radToDeg(yaw),
  };
}

/**
 * Clamp a value between min and max.
 */
function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Invert a 4x4 homogeneous transformation matrix.
 * Uses the special structure of transform matrices for efficiency:
 *   R^T | -R^T * p
 *   0   |    1
 */
export function invertTransform(m: TransformMatrix): TransformMatrix {
  // Extract rotation (3x3) and translation
  const rt: TransformMatrix = [
    [m[0][0], m[1][0], m[2][0], 0],
    [m[0][1], m[1][1], m[2][1], 0],
    [m[0][2], m[1][2], m[2][2], 0],
    [0, 0, 0, 1],
  ];

  // -R^T * p
  const px = -(rt[0][0] * m[0][3] + rt[0][1] * m[1][3] + rt[0][2] * m[2][3]);
  const py = -(rt[1][0] * m[0][3] + rt[1][1] * m[1][3] + rt[1][2] * m[2][3]);
  const pz = -(rt[2][0] * m[0][3] + rt[2][1] * m[1][3] + rt[2][2] * m[2][3]);

  rt[0][3] = px;
  rt[1][3] = py;
  rt[2][3] = pz;

  return rt;
}
