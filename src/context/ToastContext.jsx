import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type: "info", ...toast };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message, title = "Success") => {
      addToast({ type: "success", title, message });
    },
    [addToast]
  );

  const error = useCallback(
    (message, title = "Error") => {
      addToast({ type: "error", title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (message, title = "Information") => {
      addToast({ type: "info", title, message });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, title = "Warning") => {
      addToast({ type: "warning", title, message });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast floating container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-fade-in ${
              toast.type === "success"
                ? "bg-white/95 border-emerald-200 text-slate-800 shadow-emerald-900/5"
                : toast.type === "error"
                ? "bg-white/95 border-rose-200 text-slate-800 shadow-rose-900/5"
                : toast.type === "warning"
                ? "bg-white/95 border-amber-200 text-slate-800 shadow-amber-900/5"
                : "bg-white/95 border-indigo-200 text-slate-800 shadow-indigo-900/5"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              {toast.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                  {toast.title}
                </h4>
              )}
              <p className="text-sm text-slate-600 mt-0.5 leading-snug break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
