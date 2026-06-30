'use client';

/**
 * EndEffectorPos — End-effector XYZ position and RPY orientation readout.
 */

import { useArmStore } from '@/store/arm-store';

export function EndEffectorPos() {
  const pose = useArmStore((s) => s.endEffectorPose);

  return (
    <div className="panel-section">
      <div className="panel-title">End Effector</div>
      <div className="cartesian-grid" style={{ gap: 'var(--space-2)' }}>
        <ReadoutField label="X" value={pose.position.x} unit="mm" color="var(--accent-red)" />
        <ReadoutField label="Y" value={pose.position.y} unit="mm" color="var(--accent-emerald)" />
        <ReadoutField label="Z" value={pose.position.z} unit="mm" color="var(--accent-blue)" />
        <ReadoutField label="R" value={pose.orientation.roll} unit="°" color="var(--accent-amber)" />
        <ReadoutField label="P" value={pose.orientation.pitch} unit="°" color="var(--accent-violet)" />
        <ReadoutField label="Y" value={pose.orientation.yaw} unit="°" color="var(--accent-cyan)" />
      </div>
    </div>
  );
}

function ReadoutField({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="telemetry-item" style={{ flexDirection: 'row', gap: 'var(--space-2)', justifyContent: 'space-between' }}>
      <span
        className="telemetry-label"
        style={{ color, margin: 0 }}
      >
        {label}
      </span>
      <span className="telemetry-value" style={{ fontSize: '0.75rem' }}>
        {value.toFixed(1)}{unit}
      </span>
    </div>
  );
}
