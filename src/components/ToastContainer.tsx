"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { _registerToastListener, type ToastLevel } from "@/lib/toast";

interface ToastItem {
  id: number;
  message: string;
  level: ToastLevel;
}

let _nextId = 0;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    _registerToastListener((message, level) => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, level }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold pointer-events-auto ${
            t.level === "success"
              ? "bg-green-600 text-white"
              : t.level === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-900 text-white"
          }`}
        >
          {t.level === "success" && (
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
          )}
          {t.level === "error" && (
            <XCircle size={18} className="shrink-0 mt-0.5" />
          )}
          {t.level === "info" && (
            <Info size={18} className="shrink-0 mt-0.5" />
          )}
          <p className="flex-1 leading-snug">{t.message}</p>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
            className="text-white/70 hover:text-white transition ml-1 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
