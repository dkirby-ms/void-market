import React, { useEffect, useState } from "react";
import type { ConnectionStatus } from "../network/client.js";
import { subscribeToStatus } from "../network/client.js";

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; pulse: boolean }> = {
  disconnected: { label: "Disconnected", color: "#ef4444", pulse: false },
  connecting: { label: "Connecting\u2026", color: "#a78bfa", pulse: true },
  connected: { label: "Connected", color: "#22c55e", pulse: false },
  reconnecting: { label: "Reconnecting\u2026", color: "#facc15", pulse: true },
  error: { label: "Connection Error", color: "#ef4444", pulse: false },
};

export function ConnectionStatusBadge(): React.JSX.Element {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMsg, setErrorMsg] = useState<string>();

  useEffect(() => {
    return subscribeToStatus((newStatus, err) => {
      setStatus(newStatus);
      setErrorMsg(err);
    });
  }, []);

  const config = STATUS_CONFIG[status];

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 8,
        background: "rgba(24, 24, 27, 0.8)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(161, 161, 170, 0.2)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 14,
        color: "#fafafa",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: config.color,
          animation: config.pulse ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      />
      <span>{config.label}</span>
      {errorMsg && status === "error" && (
        <span style={{ color: "#a1a1aa", fontSize: 12, marginLeft: 4 }}>({errorMsg})</span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
