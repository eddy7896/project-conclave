/**
 * Central arm state management using Zustand.
 * Manages joint angles, control mode, arm config, and FK/IK computations.
 */

import { create } from 'zustand';
import type { ArmConfig, AxisConfig, ControlMode, Pose, SpeedProfile } from '@/types/arm';
import { DEFAULT_ARM_CONFIG, getHomeAngles, clampAngle } from '@/engine/arm-config';
import { forwardKinematics, inverseKinematics } from '@/engine/kinematics';
import { enforceJointLimits } from '@/engine/constraints';

interface ArmState {
  /** Arm configuration (dynamic — axes can be added/removed) */
  config: ArmConfig;

  /** Current joint angles in degrees (what the arm is at) */
  jointAngles: number[];

  /** Target joint angles in degrees (where we want to go) */
  targetAngles: number[];

  /** Current control mode */
  controlMode: ControlMode;

  /** Whether the arm is currently animating to a target */
  isMoving: boolean;

  /** Current end-effector pose (computed via FK) */
  endEffectorPose: Pose;

  /** Global speed multiplier (0-100) */
  speedPercent: number;

  /** Active speed profile */
  speedProfile: SpeedProfile;

  /** Currently selected joint index (for UI highlighting) */
  selectedJoint: number | null;

  /** IK target pose (for Cartesian mode ghost arm) */
  ikTargetPose: Pose | null;

  /** Whether the last IK solve was successful */
  ikSolveSuccess: boolean;

  // ─── Actions ───────────────────────────────────────────

  /** Set a single joint angle */
  setJointAngle: (index: number, angle: number) => void;

  /** Set all joint angles at once */
  setAllJointAngles: (angles: number[]) => void;

  /** Set target angles (for animation) */
  setTargetAngles: (angles: number[]) => void;

  /** Set target pose in Cartesian space (runs IK) */
  setTargetPose: (pose: Pose) => void;

  /** Move all joints to home position */
  goHome: () => void;

  /** Set control mode */
  setControlMode: (mode: ControlMode) => void;

  /** Set moving state */
  setIsMoving: (moving: boolean) => void;

  /** Set speed multiplier */
  setSpeedPercent: (percent: number) => void;

  /** Set speed profile */
  setSpeedProfile: (profile: SpeedProfile) => void;

  /** Select a joint (for UI) */
  selectJoint: (index: number | null) => void;

  /** Update end-effector pose from current angles */
  updateEndEffector: () => void;

  /** Add a new axis to the arm */
  addAxis: (axis: AxisConfig) => void;

  /** Remove an axis by ID */
  removeAxis: (id: number) => void;

  /** Update arm configuration */
  setConfig: (config: ArmConfig) => void;
}

const initialAngles = getHomeAngles(DEFAULT_ARM_CONFIG);
const initialPose = forwardKinematics(DEFAULT_ARM_CONFIG, initialAngles);

export const useArmStore = create<ArmState>((set, get) => ({
  config: DEFAULT_ARM_CONFIG,
  jointAngles: initialAngles,
  targetAngles: initialAngles,
  controlMode: 'joint',
  isMoving: false,
  endEffectorPose: initialPose,
  speedPercent: 50,
  speedProfile: 'trapezoidal',
  selectedJoint: null,
  ikTargetPose: null,
  ikSolveSuccess: true,

  setJointAngle: (index, angle) => {
    const state = get();
    const axis = state.config.axes[index];
    if (!axis) return;

    const clampedAngle = clampAngle(angle, axis);
    const newAngles = [...state.jointAngles];
    newAngles[index] = clampedAngle;

    const pose = forwardKinematics(state.config, newAngles);

    set({
      jointAngles: newAngles,
      targetAngles: newAngles,
      endEffectorPose: pose,
    });
  },

  setAllJointAngles: (angles) => {
    const state = get();
    const { angles: clamped } = enforceJointLimits(state.config, angles);
    const pose = forwardKinematics(state.config, clamped);

    set({
      jointAngles: clamped,
      targetAngles: clamped,
      endEffectorPose: pose,
    });
  },

  setTargetAngles: (angles) => {
    const state = get();
    const { angles: clamped } = enforceJointLimits(state.config, angles);
    set({ targetAngles: clamped });
  },

  setTargetPose: (pose) => {
    const state = get();
    const solution = inverseKinematics(
      state.config,
      pose,
      state.jointAngles
    );

    if (solution) {
      const newPose = forwardKinematics(state.config, solution);
      set({
        ikTargetPose: pose,
        ikSolveSuccess: true,
        targetAngles: solution,
        jointAngles: solution,
        endEffectorPose: newPose,
      });
    } else {
      set({
        ikTargetPose: pose,
        ikSolveSuccess: false,
      });
    }
  },

  goHome: () => {
    const state = get();
    const homeAngles = getHomeAngles(state.config);
    const pose = forwardKinematics(state.config, homeAngles);

    set({
      jointAngles: homeAngles,
      targetAngles: homeAngles,
      endEffectorPose: pose,
      isMoving: false,
    });
  },

  setControlMode: (mode) => set({ controlMode: mode }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setSpeedPercent: (percent) => set({ speedPercent: Math.max(1, Math.min(100, percent)) }),
  setSpeedProfile: (profile) => set({ speedProfile: profile }),
  selectJoint: (index) => set({ selectedJoint: index }),

  updateEndEffector: () => {
    const state = get();
    const pose = forwardKinematics(state.config, state.jointAngles);
    set({ endEffectorPose: pose });
  },

  addAxis: (axis) => {
    const state = get();
    const newConfig = {
      ...state.config,
      axes: [...state.config.axes, axis],
    };
    const newAngles = [...state.jointAngles, axis.homeAngle];

    set({
      config: newConfig,
      jointAngles: newAngles,
      targetAngles: newAngles,
      endEffectorPose: forwardKinematics(newConfig, newAngles),
    });
  },

  removeAxis: (id) => {
    const state = get();
    const index = state.config.axes.findIndex((a) => a.id === id);
    if (index === -1) return;

    const newAxes = state.config.axes.filter((a) => a.id !== id);
    const newAngles = state.jointAngles.filter((_, i) => i !== index);
    const newConfig = { ...state.config, axes: newAxes };

    set({
      config: newConfig,
      jointAngles: newAngles,
      targetAngles: newAngles,
      endEffectorPose: forwardKinematics(newConfig, newAngles),
    });
  },

  setConfig: (config) => {
    const homeAngles = getHomeAngles(config);
    set({
      config,
      jointAngles: homeAngles,
      targetAngles: homeAngles,
      endEffectorPose: forwardKinematics(config, homeAngles),
    });
  },
}));
