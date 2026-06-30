/**
 * Trajectory planning for smooth motion between positions.
 * Supports linear interpolation and trapezoidal velocity profiles.
 */

import type { SpeedProfile } from '@/types/arm';

/**
 * Interpolate between two joint angle arrays.
 * 
 * @param from - Starting angles (degrees)
 * @param to - Target angles (degrees)
 * @param t - Interpolation factor [0, 1]
 * @param profile - Speed profile type
 * @returns Interpolated angles
 */
export function interpolateJoints(
  from: number[],
  to: number[],
  t: number,
  profile: SpeedProfile = 'trapezoidal'
): number[] {
  const easedT = applySpeedProfile(t, profile);
  return from.map((angle, i) => {
    const target = to[i] ?? angle;
    return angle + (target - angle) * easedT;
  });
}

/**
 * Apply speed profile easing to interpolation factor.
 */
function applySpeedProfile(t: number, profile: SpeedProfile): number {
  const clamped = Math.max(0, Math.min(1, t));

  switch (profile) {
    case 'linear':
      return clamped;

    case 'trapezoidal': {
      // Trapezoidal velocity profile (accel - cruise - decel)
      const accelPhase = 0.25;
      const decelStart = 0.75;

      if (clamped < accelPhase) {
        // Acceleration phase (quadratic ease-in)
        const u = clamped / accelPhase;
        return 0.5 * u * u * accelPhase / 0.5;
      } else if (clamped > decelStart) {
        // Deceleration phase (quadratic ease-out)
        const u = (clamped - decelStart) / (1 - decelStart);
        return 1 - 0.5 * (1 - u) * (1 - u) * (1 - decelStart) / 0.5;
      } else {
        // Cruise phase (linear)
        return 0.125 + (clamped - accelPhase) * (0.75 / 0.5);
      }
    }

    case 's-curve': {
      // Smooth S-curve (quintic polynomial)
      const t2 = clamped * clamped;
      const t3 = t2 * clamped;
      return 6 * t3 * t2 - 15 * t2 * t2 + 10 * t3;
    }

    default:
      return clamped;
  }
}

/**
 * Generate a trajectory (array of keyframes) between two positions.
 * 
 * @param from - Starting angles
 * @param to - Target angles
 * @param durationMs - Total duration in milliseconds
 * @param fps - Frames per second (default 60)
 * @param profile - Speed profile
 * @returns Array of { time, angles } keyframes
 */
export function generateTrajectory(
  from: number[],
  to: number[],
  durationMs: number,
  fps: number = 60,
  profile: SpeedProfile = 'trapezoidal'
): { time: number; angles: number[] }[] {
  const frameInterval = 1000 / fps;
  const numFrames = Math.ceil(durationMs / frameInterval);
  const keyframes: { time: number; angles: number[] }[] = [];

  for (let i = 0; i <= numFrames; i++) {
    const t = i / numFrames;
    const time = t * durationMs;
    const angles = interpolateJoints(from, to, t, profile);
    keyframes.push({ time, angles });
  }

  return keyframes;
}

/**
 * Estimate duration for a joint movement based on max angle change and speed.
 * 
 * @param from - Starting angles
 * @param to - Target angles
 * @param speed - Speed in degrees per second
 * @returns Estimated duration in milliseconds
 */
export function estimateDuration(
  from: number[],
  to: number[],
  speed: number
): number {
  let maxDelta = 0;
  for (let i = 0; i < from.length; i++) {
    const delta = Math.abs((to[i] ?? from[i]) - from[i]);
    maxDelta = Math.max(maxDelta, delta);
  }
  return (maxDelta / speed) * 1000;
}

/**
 * Multi-waypoint trajectory generator.
 * Chains individual segments together.
 */
export function generateMultiWaypointTrajectory(
  waypoints: { angles: number[]; speed: number; dwellTime: number }[],
  fps: number = 60
): { time: number; angles: number[] }[] {
  if (waypoints.length < 2) return [];

  const fullTrajectory: { time: number; angles: number[] }[] = [];
  let currentTime = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const duration = estimateDuration(from.angles, to.angles, to.speed);
    const segment = generateTrajectory(from.angles, to.angles, duration, fps, 'trapezoidal');

    for (const frame of segment) {
      fullTrajectory.push({
        time: currentTime + frame.time,
        angles: frame.angles,
      });
    }

    currentTime += duration + from.dwellTime;
  }

  return fullTrajectory;
}
