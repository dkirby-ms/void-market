import React from "react";
import { Toaster } from "sonner";

/**
 * Game-themed toast container.
 * Wraps sonner's <Toaster> with Void Market dark-theme styling.
 */
export function GameToaster(): React.JSX.Element {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors
      toastOptions={{
        style: {
          fontFamily: "var(--vm-font-family-mono)",
          fontSize: "var(--vm-font-sm)",
          background: "var(--vm-surface-raised)",
          border: "1px solid var(--vm-glass-border)",
          color: "var(--vm-neutral-200)",
        },
      }}
    />
  );
}
