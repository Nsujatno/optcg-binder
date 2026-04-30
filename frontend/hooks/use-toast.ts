"use client";

import { useCallback, useState } from "react";

export type ToastVariant = "error" | "warning" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const TOAST_DURATION_MS = 4000;

function createToastId() {
  return `toast-${Math.random().toString(36).slice(2, 10)}`;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "error") => {
      if (!message.trim()) {
        return;
      }

      const id = createToastId();
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  return {
    toasts,
    showToast,
    dismissToast,
  };
}
