import React, { useEffect, useRef } from "react";
import { ConnectionStatusBadge } from "./components/ConnectionStatusBadge.js";
import { initPixiApp } from "./game/PixiApp.js";

export function App(): React.JSX.Element {
  const pixiContainerRef = useRef<HTMLDivElement | null>(null);
  const pixiInitRef = useRef(false);

  useEffect(() => {
    const container = pixiContainerRef.current;
    if (!container || pixiInitRef.current) return;
    pixiInitRef.current = true;

    void initPixiApp(container);
  }, []);

  return (
    <>
      {/* PixiJS mounts into the canvas container via ref */}
      <div
        ref={pixiContainerRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
      {/* React DOM overlay */}
      <ConnectionStatusBadge />
    </>
  );
}
