"use client";

/**
 * Einheitliche Handy-Breite: am PC zentrierter Rahmen,
 * am Handy randlos — gleiche UI wie auf dem Gerät.
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="device-frame">
      <div className="device-shell">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
