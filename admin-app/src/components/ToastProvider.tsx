"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

type ToastType = "success" | "warn" | "danger";
type Toast = { id: number; type: ToastType; message: string };

const ToastContext = createContext<(type: ToastType, message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Guarantees a unique id per toast even when two fire within the same
  // millisecond - Date.now() alone can collide, producing a duplicate React
  // key. A ref-backed counter persists across renders without triggering one.
  const nextIdRef = useRef(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const borderColor = {
    success: "border-moss",
    warn: "border-ochre",
    danger: "border-brick",
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[260px] max-w-[320px] bg-ink text-paper-raised text-[13.5px] leading-snug rounded-md px-4 py-3 shadow-lg border-l-4 ${borderColor[t.type]} animate-[slidein_0.35s_ease-out]`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}