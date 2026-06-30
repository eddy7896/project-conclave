'use client';

/**
 * ConnectionBadge — Firebase + ESP32 connection status indicator.
 */

import { useConnectionStore } from '@/store/connection-store';

export function ConnectionBadge() {
  const firebaseState = useConnectionStore((s) => s.firebaseState);
  const deviceState = useConnectionStore((s) => s.deviceState);
  const latency = useConnectionStore((s) => s.latency);
  const isSimulated = useConnectionStore((s) => s.isSimulated);

  const getFirebaseBadge = () => {
    if (isSimulated) {
      return { className: 'badge badge--info', dot: 'status-dot--simulated', label: 'Simulated' };
    }
    switch (firebaseState) {
      case 'connected':
        return { className: 'badge badge--success', dot: 'status-dot--online', label: 'Firebase' };
      case 'connecting':
        return { className: 'badge badge--warning', dot: 'status-dot--warning', label: 'Connecting' };
      case 'disconnected':
        return { className: 'badge badge--danger', dot: 'status-dot--offline', label: 'Disconnected' };
      case 'error':
        return { className: 'badge badge--danger', dot: 'status-dot--offline', label: 'Error' };
      default:
        return { className: 'badge badge--neutral', dot: 'status-dot--offline', label: 'Unknown' };
    }
  };

  const getDeviceBadge = () => {
    switch (deviceState) {
      case 'online':
        return { className: 'badge badge--success', dot: 'status-dot--online', label: 'ESP32' };
      case 'offline':
        return { className: 'badge badge--danger', dot: 'status-dot--offline', label: 'ESP32 Offline' };
      default:
        return { className: 'badge badge--neutral', dot: 'status-dot--offline', label: 'ESP32 N/A' };
    }
  };

  const fb = getFirebaseBadge();
  const dev = getDeviceBadge();

  return (
    <div className="flex items-center gap-2">
      <span className={fb.className}>
        <span className={`status-dot ${fb.dot}`} />
        {fb.label}
      </span>
      {!isSimulated && (
        <span className={dev.className}>
          <span className={`status-dot ${dev.dot}`} />
          {dev.label}
        </span>
      )}
      {latency > 0 && (
        <span className="badge badge--neutral">
          {latency}ms
        </span>
      )}
    </div>
  );
}
