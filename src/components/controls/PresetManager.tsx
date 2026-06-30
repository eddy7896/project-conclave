'use client';

/**
 * PresetManager — Save/load/play waypoints and sequences.
 */

import { useCallback, useState } from 'react';
import { useArmStore } from '@/store/arm-store';
import { useWaypointStore } from '@/store/waypoint-store';

export function PresetManager() {
  const jointAngles = useArmStore((s) => s.jointAngles);
  const speedPercent = useArmStore((s) => s.speedPercent);
  const setAllJointAngles = useArmStore((s) => s.setAllJointAngles);

  const waypoints = useWaypointStore((s) => s.waypoints);
  const addWaypoint = useWaypointStore((s) => s.addWaypoint);
  const removeWaypoint = useWaypointStore((s) => s.removeWaypoint);
  const clearWaypoints = useWaypointStore((s) => s.clearWaypoints);
  const exportWaypoints = useWaypointStore((s) => s.exportWaypoints);
  const importWaypoints = useWaypointStore((s) => s.importWaypoints);

  const [newName, setNewName] = useState('');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handleSave = useCallback(() => {
    const name = newName.trim() || `Waypoint ${waypoints.length + 1}`;
    addWaypoint({
      id: `wp-${Date.now()}`,
      name,
      angles: [...jointAngles],
      speed: speedPercent,
      dwellTime: 500,
      createdAt: Date.now(),
    });
    setNewName('');
  }, [newName, jointAngles, speedPercent, waypoints.length, addWaypoint]);

  const handleGoTo = useCallback(
    (index: number) => {
      const wp = waypoints[index];
      if (wp) {
        setAllJointAngles(wp.angles);
        setPlayingIndex(index);
        setTimeout(() => setPlayingIndex(null), 500);
      }
    },
    [waypoints, setAllJointAngles]
  );

  const handleExport = useCallback(() => {
    const json = exportWaypoints();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conclave-waypoints.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportWaypoints]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          importWaypoints(reader.result as string);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [importWaypoints]);

  const handlePlayAll = useCallback(async () => {
    for (let i = 0; i < waypoints.length; i++) {
      setPlayingIndex(i);
      setAllJointAngles(waypoints[i].angles);
      await new Promise((r) => setTimeout(r, waypoints[i].dwellTime + 800));
    }
    setPlayingIndex(null);
  }, [waypoints, setAllJointAngles]);

  return (
    <div className="panel-section animate-fade-in">
      <div className="panel-title">Waypoints</div>

      {/* Save current position */}
      <div className="flex gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <input
          className="input flex-1"
          type="text"
          placeholder="Waypoint name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button className="btn btn--primary btn--sm" onClick={handleSave}>
          + Save
        </button>
      </div>

      {/* Waypoint list */}
      {waypoints.length === 0 ? (
        <div className="text-xs text-tertiary" style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          No waypoints saved yet.<br />
          Position the arm and click Save.
        </div>
      ) : (
        <div className="flex flex-col gap-2" style={{ marginBottom: 'var(--space-3)' }}>
          {waypoints.map((wp, i) => (
            <div
              key={wp.id}
              className={`waypoint-item ${playingIndex === i ? 'waypoint-item--active' : ''}`}
            >
              <span className="waypoint-index">{i + 1}</span>
              <div className="waypoint-info">
                <div className="waypoint-name">{wp.name}</div>
                <div className="waypoint-angles">
                  [{wp.angles.map((a) => a.toFixed(0)).join(', ')}]
                </div>
              </div>
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => handleGoTo(i)}
                title="Go to this position"
              >
                ▶
              </button>
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => removeWaypoint(wp.id)}
                title="Delete waypoint"
                style={{ color: 'var(--accent-red)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {waypoints.length > 0 && (
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn--sm" onClick={handlePlayAll}>
            ▶ Play All
          </button>
          <button className="btn btn--sm" onClick={handleExport}>
            ↓ Export
          </button>
          <button className="btn btn--sm" onClick={handleImport}>
            ↑ Import
          </button>
          <button
            className="btn btn--sm"
            onClick={clearWaypoints}
            style={{ color: 'var(--accent-red)' }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
