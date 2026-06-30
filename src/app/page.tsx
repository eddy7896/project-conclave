'use client';

/**
 * Main dashboard page — assembles viewport, controls, and telemetry.
 */

import dynamic from 'next/dynamic';
import { useUIStore } from '@/store/ui-store';
import { useArmStore } from '@/store/arm-store';
import { ConnectionBadge } from '@/components/telemetry/ConnectionBadge';
import { JointControlPanel } from '@/components/controls/JointControlPanel';
import { CartesianPanel } from '@/components/controls/CartesianPanel';
import { SpeedControl } from '@/components/controls/SpeedControl';
import { PresetManager } from '@/components/controls/PresetManager';
import { JointAnglesDisplay } from '@/components/telemetry/JointAnglesDisplay';
import { EndEffectorPos } from '@/components/telemetry/EndEffectorPos';
import { useKeyboardJog } from '@/hooks/useKeyboardJog';

// Dynamic import for R3F (needs client-side only)
const Scene = dynamic(
  () => import('@/components/viewport/Scene').then((mod) => ({ default: mod.Scene })),
  { ssr: false }
);

export default function DashboardPage() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const config = useArmStore((s) => s.config);
  const endEffectorPose = useArmStore((s) => s.endEffectorPose);
  const jointAngles = useArmStore((s) => s.jointAngles);
  const goHome = useArmStore((s) => s.goHome);

  // Activate keyboard shortcuts
  useKeyboardJog();

  return (
    <div className="dashboard" data-theme={theme}>
      {/* ═══ Header ═══ */}
      <header className="dashboard-header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <div>
            <div className="logo-text">Project Conclave</div>
            <div className="logo-subtitle">{config.name}</div>
          </div>
        </div>

        <div className="header-center">
          <ConnectionBadge />
        </div>

        <div className="header-actions">
          <button className="estop-btn" onClick={goHome} title="Emergency Stop / Home">
            E-STOP
          </button>
          <button
            className="btn btn--icon btn--ghost"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ═══ Sidebar ═══ */}
      <nav className="dashboard-sidebar">
        <SidebarButton
          icon="🎮"
          label="Joint"
          isActive={activeTab === 'joint'}
          onClick={() => setActiveTab('joint')}
        />
        <SidebarButton
          icon="📐"
          label="XYZ"
          isActive={activeTab === 'cartesian'}
          onClick={() => setActiveTab('cartesian')}
        />
        <SidebarButton
          icon="📍"
          label="Points"
          isActive={activeTab === 'waypoints'}
          onClick={() => setActiveTab('waypoints')}
        />
        <SidebarButton
          icon="⚙️"
          label="Settings"
          isActive={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>

      {/* ═══ 3D Viewport ═══ */}
      <main className="dashboard-viewport">
        <Scene />

        {/* Overlay: Joint angles gauges */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            left: 'var(--space-3)',
            zIndex: 10,
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: 'var(--space-3)',
          }}
        >
          <JointAnglesDisplay />
        </div>
      </main>

      {/* ═══ Control Panel ═══ */}
      <aside className="dashboard-controls">
        {/* Tab bar */}
        <div className="tab-bar">
          <button
            className={`tab-item ${activeTab === 'joint' ? 'tab-item--active' : ''}`}
            onClick={() => setActiveTab('joint')}
          >
            Joint
          </button>
          <button
            className={`tab-item ${activeTab === 'cartesian' ? 'tab-item--active' : ''}`}
            onClick={() => setActiveTab('cartesian')}
          >
            Cartesian
          </button>
          <button
            className={`tab-item ${activeTab === 'waypoints' ? 'tab-item--active' : ''}`}
            onClick={() => setActiveTab('waypoints')}
          >
            Waypoints
          </button>
        </div>

        {/* Active panel */}
        {activeTab === 'joint' && <JointControlPanel />}
        {activeTab === 'cartesian' && <CartesianPanel />}
        {activeTab === 'waypoints' && <PresetManager />}

        {/* Speed control (always visible) */}
        <SpeedControl />

        {/* End effector readout */}
        <EndEffectorPos />
      </aside>

      {/* ═══ Status Bar ═══ */}
      <footer className="dashboard-status">
        <span>
          {config.axes.map((axis, i) => (
            <span key={axis.id} style={{ marginRight: 'var(--space-4)' }}>
              <span style={{ color: axis.color }}>J{i + 1}</span>:{' '}
              {(jointAngles[i] ?? axis.homeAngle).toFixed(1)}°
            </span>
          ))}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          EE: X={endEffectorPose.position.x.toFixed(1)} Y=
          {endEffectorPose.position.y.toFixed(1)} Z=
          {endEffectorPose.position.z.toFixed(1)} mm
        </span>
        <span>
          Axes: {config.axes.length} | Profile: Servo
        </span>
      </footer>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`sidebar-btn ${isActive ? 'sidebar-btn--active' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
    </button>
  );
}
