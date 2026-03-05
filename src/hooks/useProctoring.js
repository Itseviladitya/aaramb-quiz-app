"use client";

import { useEffect, useRef, useState } from "react";

export function useProctoring({ onViolation }) {
  const [warnings, setWarnings] = useState(0);
  const lastWarningTime = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const registerWarning = (reason) => {
      if (!mountedRef.current) {
        return;
      }
      const now = Date.now();
      if (now - lastWarningTime.current < 1500) {
        // Prevent duplicate warnings for the same user action (e.g. blur + visibilitychange)
        return;
      }
      lastWarningTime.current = now;

      setWarnings((current) => current + 1);
      onViolation?.(reason);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        registerWarning("Tab switch detected");
      }
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      registerWarning("Right click blocked");
    };

    const onCopyPaste = (event) => {
      event.preventDefault();
      registerWarning("Copy or paste blocked");
    };

    const onBlur = () => registerWarning("Window focus lost");

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopyPaste);
    document.addEventListener("paste", onCopyPaste);
    window.addEventListener("blur", onBlur);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopyPaste);
      document.removeEventListener("paste", onCopyPaste);
      window.removeEventListener("blur", onBlur);
    };
  }, [onViolation]);

  return { warnings };
}