'use client';

/**
 * JointControlPanel — Per-joint angle sliders with jog buttons and numeric input.
 */

import { useArmStore } from '@/store/arm-store';
import { useCallback } from 'react';

export function JointControlPanel() {
  const config = useArmStore((s) => s.config);
  const jointAngles = useArmStore((s) => s.jointAngles);
  const selectedJoint = useArmStore((s) => s.selectedJoint);
  const setJointAngle = useArmStore((s) => s.setJointAngle);
  const selectJoint = useArmStore((s) => s.selectJoint);
  const goHome = useArmStore((s) => s.goHome);

  return (
    <div className="panel-section animate-fade-in">
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="panel-title" style={{ marginBottom: 0 }}>Joint Control</div>
        <button className="btn btn--sm btn--ghost" onClick={goHome}>
          ⌂ Home
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {config.axes.map((axis, index) => (
          <JointRow
            key={axis.id}
            name={axis.name}
            label={`J${index + 1}`}
            color={axis.color}
            angle={jointAngles[index] ?? axis.homeAngle}
            min={axis.limits.min}
            max={axis.limits.max}
            isPrismatic={axis.jointType === 'prismatic'}
            isSelected={selectedJoint === index}
            onAngleChange={(angle) => setJointAngle(index, angle)}
            onClick={() => selectJoint(selectedJoint === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

function JointRow({
  name,
  label,
  color,
  angle,
  min,
  max,
  isPrismatic,
  isSelected,
  onAngleChange,
  onClick,
}: {
  name: string;
  label: string;
  color: string;
  angle: number;
  min: number;
  max: number;
  isPrismatic?: boolean;
  isSelected: boolean;
  onAngleChange: (angle: number) => void;
  onClick: () => void;
}) {
  const jog = useCallback(
    (delta: number) => {
      onAngleChange(Math.max(min, Math.min(max, angle + delta)));
    },
    [angle, min, max, onAngleChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        onAngleChange(Math.max(min, Math.min(max, val)));
      }
    },
    [min, max, onAngleChange]
  );

  // Compute slider fill percentage
  const fillPercent = ((angle - min) / (max - min)) * 100;
  
  const unit = isPrismatic ? 'mm' : '°';
  const smallJog = isPrismatic ? 5 : 1;
  const largeJog = isPrismatic ? 20 : 5;

  return (
    <div
      className={`joint-row ${isSelected ? 'joint-row--selected' : ''}`}
      onClick={onClick}
    >
      <div className="joint-row-header">
        <div className="joint-name">
          <span className="joint-color-dot" style={{ background: color }} />
          <span>{label}</span>
          <span className="text-xs text-tertiary">{name}</span>
        </div>
        <div className="joint-controls">
          <button
            className="jog-btn"
            onClick={(e) => { e.stopPropagation(); jog(-largeJog); }}
            title={`-${largeJog}${unit}`}
          >
            ‹‹
          </button>
          <button
            className="jog-btn"
            onClick={(e) => { e.stopPropagation(); jog(-smallJog); }}
            title={`-${smallJog}${unit}`}
          >
            ‹
          </button>
          <input
            className="input input--sm"
            type="number"
            value={angle.toFixed(1)}
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
            min={min}
            max={max}
            step={1}
          />
          <button
            className="jog-btn"
            onClick={(e) => { e.stopPropagation(); jog(smallJog); }}
            title={`+${smallJog}${unit}`}
          >
            ›
          </button>
          <button
            className="jog-btn"
            onClick={(e) => { e.stopPropagation(); jog(largeJog); }}
            title={`+${largeJog}${unit}`}
          >
            ››
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="slider-container">
        <input
          className="slider-input"
          type="range"
          min={min}
          max={max}
          step={0.5}
          value={angle}
          onChange={(e) => onAngleChange(parseFloat(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${fillPercent}%, var(--slider-track) ${fillPercent}%, var(--slider-track) 100%)`,
          }}
        />
        <div className="flex items-center justify-between text-xs text-tertiary text-mono">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}
