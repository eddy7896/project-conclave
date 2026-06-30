'use client';

/**
 * JointAnglesDisplay — Compact real-time readout with circular gauges.
 */

import { useArmStore } from '@/store/arm-store';

export function JointAnglesDisplay() {
  const config = useArmStore((s) => s.config);
  const jointAngles = useArmStore((s) => s.jointAngles);

  return (
    <div className="telemetry-grid">
      {config.axes.map((axis, i) => {
        const angle = jointAngles[i] ?? axis.homeAngle;
        const range = axis.limits.max - axis.limits.min;
        const percent = ((angle - axis.limits.min) / range) * 100;
        const circumference = 2 * Math.PI * 18;
        const dashOffset = circumference - (circumference * percent) / 100;

        return (
          <div key={axis.id} className="telemetry-item">
            <div className="gauge">
              <svg viewBox="0 0 48 48">
                <circle
                  className="gauge-bg"
                  cx="24"
                  cy="24"
                  r="18"
                />
                <circle
                  className="gauge-fill"
                  cx="24"
                  cy="24"
                  r="18"
                  stroke={axis.color}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="gauge-value">{angle.toFixed(0)}°</div>
            </div>
            <div className="telemetry-label">J{i + 1}</div>
          </div>
        );
      })}
    </div>
  );
}
