'use client';

/**
 * CartesianPanel — XYZ position + RPY orientation inputs with IK solving.
 */

import { useState, useCallback, useEffect } from 'react';
import { useArmStore } from '@/store/arm-store';
import type { Pose } from '@/types/arm';
import { isReachable } from '@/engine/kinematics';

export function CartesianPanel() {
  const endEffectorPose = useArmStore((s) => s.endEffectorPose);
  const config = useArmStore((s) => s.config);
  const setTargetPose = useArmStore((s) => s.setTargetPose);
  const ikSolveSuccess = useArmStore((s) => s.ikSolveSuccess);

  const [targetX, setTargetX] = useState(endEffectorPose.position.x.toFixed(1));
  const [targetY, setTargetY] = useState(endEffectorPose.position.y.toFixed(1));
  const [targetZ, setTargetZ] = useState(endEffectorPose.position.z.toFixed(1));
  const [targetRoll, setTargetRoll] = useState(endEffectorPose.orientation.roll.toFixed(1));
  const [targetPitch, setTargetPitch] = useState(endEffectorPose.orientation.pitch.toFixed(1));
  const [targetYaw, setTargetYaw] = useState(endEffectorPose.orientation.yaw.toFixed(1));

  // Sync inputs when end-effector changes from joint control
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetX(endEffectorPose.position.x.toFixed(1));
    setTargetY(endEffectorPose.position.y.toFixed(1));
    setTargetZ(endEffectorPose.position.z.toFixed(1));
    setTargetRoll(endEffectorPose.orientation.roll.toFixed(1));
    setTargetPitch(endEffectorPose.orientation.pitch.toFixed(1));
    setTargetYaw(endEffectorPose.orientation.yaw.toFixed(1));
  }, [endEffectorPose]);

  const reachable = isReachable(config, {
    x: parseFloat(targetX) || 0,
    y: parseFloat(targetY) || 0,
    z: parseFloat(targetZ) || 0,
  });

  const handleGoTo = useCallback(() => {
    const pose: Pose = {
      position: {
        x: parseFloat(targetX) || 0,
        y: parseFloat(targetY) || 0,
        z: parseFloat(targetZ) || 0,
      },
      orientation: {
        roll: parseFloat(targetRoll) || 0,
        pitch: parseFloat(targetPitch) || 0,
        yaw: parseFloat(targetYaw) || 0,
      },
    };
    setTargetPose(pose);
  }, [targetX, targetY, targetZ, targetRoll, targetPitch, targetYaw, setTargetPose]);

  return (
    <div className="panel-section animate-fade-in">
      <div className="panel-title">Cartesian Control</div>

      {/* Position inputs */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div className="text-xs font-semibold text-secondary" style={{ marginBottom: 'var(--space-2)' }}>
          Position (mm)
        </div>
        <div className="cartesian-grid">
          <CartesianField
            label="X"
            labelClass="cartesian-label--x"
            value={targetX}
            onChange={setTargetX}
          />
          <CartesianField
            label="Y"
            labelClass="cartesian-label--y"
            value={targetY}
            onChange={setTargetY}
          />
          <CartesianField
            label="Z"
            labelClass="cartesian-label--z"
            value={targetZ}
            onChange={setTargetZ}
          />
        </div>
      </div>

      {/* Orientation inputs */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div className="text-xs font-semibold text-secondary" style={{ marginBottom: 'var(--space-2)' }}>
          Orientation (deg)
        </div>
        <div className="cartesian-grid">
          <CartesianField
            label="Roll"
            labelClass="cartesian-label--roll"
            value={targetRoll}
            onChange={setTargetRoll}
          />
          <CartesianField
            label="Pitch"
            labelClass="cartesian-label--pitch"
            value={targetPitch}
            onChange={setTargetPitch}
          />
          <CartesianField
            label="Yaw"
            labelClass="cartesian-label--yaw"
            value={targetYaw}
            onChange={setTargetYaw}
          />
        </div>
      </div>

      {/* Reachability indicator */}
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <span
          className={`badge ${reachable ? 'badge--success' : 'badge--danger'}`}
        >
          <span className={`status-dot ${reachable ? 'status-dot--online' : 'status-dot--offline'}`} />
          {reachable ? 'Reachable' : 'Out of range'}
        </span>
        {!ikSolveSuccess && (
          <span className="badge badge--warning">IK failed</span>
        )}
      </div>

      {/* Go To button */}
      <button
        className="btn btn--primary w-full"
        onClick={handleGoTo}
        disabled={!reachable}
        style={{ opacity: reachable ? 1 : 0.5 }}
      >
        Go To Position
      </button>
    </div>
  );
}

function CartesianField({
  label,
  labelClass,
  value,
  onChange,
}: {
  label: string;
  labelClass: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="cartesian-field">
      <label className={`cartesian-label ${labelClass}`}>{label}</label>
      <input
        className="input input--sm"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={1}
        style={{ width: '100%' }}
      />
    </div>
  );
}
