'use client';

/**
 * useKeyboardJog — Keyboard shortcuts for jogging the selected joint.
 * Arrow keys: ±1° for selected joint
 * Shift+Arrow: ±5° for selected joint
 * Home key: Go to home position
 */

import { useEffect } from 'react';
import { useArmStore } from '@/store/arm-store';

export function useKeyboardJog() {
  const selectedJoint = useArmStore((s) => s.selectedJoint);
  const jointAngles = useArmStore((s) => s.jointAngles);
  const config = useArmStore((s) => s.config);
  const setJointAngle = useArmStore((s) => s.setJointAngle);
  const goHome = useArmStore((s) => s.goHome);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Home key
      if (e.key === 'Home') {
        e.preventDefault();
        goHome();
        return;
      }

      // Arrow keys for jogging
      if (selectedJoint === null) return;

      const axis = config.axes[selectedJoint];
      if (!axis) return;

      const currentAngle = jointAngles[selectedJoint] ?? axis.homeAngle;
      const delta = e.shiftKey ? 5 : 1;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          setJointAngle(
            selectedJoint,
            Math.min(axis.limits.max, currentAngle + delta)
          );
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          setJointAngle(
            selectedJoint,
            Math.max(axis.limits.min, currentAngle - delta)
          );
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedJoint, jointAngles, config, setJointAngle, goHome]);
}
