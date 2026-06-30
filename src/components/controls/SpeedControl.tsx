'use client';

/**
 * SpeedControl — Global speed multiplier and profile selector.
 */

import { useArmStore } from '@/store/arm-store';
import type { SpeedProfile } from '@/types/arm';

export function SpeedControl() {
  const speedPercent = useArmStore((s) => s.speedPercent);
  const speedProfile = useArmStore((s) => s.speedProfile);
  const setSpeedPercent = useArmStore((s) => s.setSpeedPercent);
  const setSpeedProfile = useArmStore((s) => s.setSpeedProfile);

  const fillPercent = speedPercent;

  return (
    <div className="panel-section">
      <div className="panel-title">Speed & Motion</div>

      {/* Speed slider */}
      <div className="slider-container" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="slider-header">
          <span className="slider-label">Speed</span>
          <span className="slider-value">{speedPercent}%</span>
        </div>
        <input
          className="slider-input"
          type="range"
          min={1}
          max={100}
          value={speedPercent}
          onChange={(e) => setSpeedPercent(parseInt(e.target.value))}
          style={{
            background: `linear-gradient(to right, var(--accent-emerald) 0%, var(--accent-emerald) ${fillPercent}%, var(--slider-track) ${fillPercent}%, var(--slider-track) 100%)`,
          }}
        />
      </div>

      {/* Speed profile selector */}
      <div>
        <div className="slider-label" style={{ marginBottom: 'var(--space-2)' }}>
          Motion Profile
        </div>
        <div className="flex gap-2">
          {(['linear', 'trapezoidal', 's-curve'] as SpeedProfile[]).map((profile) => (
            <button
              key={profile}
              className={`btn btn--sm ${speedProfile === profile ? 'btn--primary' : ''}`}
              onClick={() => setSpeedProfile(profile)}
              style={{ flex: 1, textTransform: 'capitalize' }}
            >
              {profile === 's-curve' ? 'S-Curve' : profile.charAt(0).toUpperCase() + profile.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
