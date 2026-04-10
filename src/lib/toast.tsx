import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const TOAST_LIMIT = 4;

// Lune brand-aligned config — white card with colored left accent
const toastConfig = {
  success: {
    icon: CheckCircle,
    accent: "#1F4D48", // teal
    accentClass: "bg-teal",
    iconClass: "text-teal",
    iconBgClass: "bg-teal/10",
    label: "Success",
  },
  error: {
    icon: XCircle,
    accent: "#ef4444",
    accentClass: "bg-red-500",
    iconClass: "text-red-500",
    iconBgClass: "bg-red-50",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    accent: "#F26430", // orange
    accentClass: "bg-orange",
    iconClass: "text-orange",
    iconBgClass: "bg-orange/10",
    label: "Warning",
  },
  info: {
    icon: Info,
    accent: "#1F4D48", // teal (same as success, different icon)
    accentClass: "bg-teal/80",
    iconClass: "text-teal",
    iconBgClass: "bg-teal/10",
    label: "Info",
  },
};

/** Lune logo mark — 4-dot 2×2 grid */
const LuneMark: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`w-5 h-5 grid grid-cols-2 gap-[2.5px] ${className}`}>
    <div className="bg-current rounded-full" />
    <div className="bg-current rounded-full" />
    <div className="bg-current rounded-full" />
    <div className="bg-current rounded-full" />
  </div>
);

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({
  toast,
  onRemove,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const duration = toast.duration ?? 4500;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleRemove();
      }
    }, 40);
    return () => clearInterval(interval);
  }, [duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 280);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative overflow-hidden bg-white
        rounded-2xl shadow-lg border border-gray-100
        flex items-stretch
        min-w-[320px] max-w-[400px]
        cursor-pointer select-none
        transition-all duration-280 ease-out
        ${
          isExiting
            ? "opacity-0 translate-x-6 scale-95"
            : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-4 fade-in duration-300"
        }
        hover:shadow-xl hover:-translate-y-0.5
      `}
      onClick={handleRemove}
    >
      {/* Colored left accent bar */}
      <div
        className={`w-1 flex-shrink-0 rounded-l-2xl ${config.accentClass}`}
      />

      {/* Content */}
      <div className="flex items-start gap-3 px-4 py-3.5 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-xl ${config.iconBgClass} flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          <Icon size={18} className={config.iconClass} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Lune brand row */}
          <div className={`flex items-center gap-1.5 mb-1 ${config.iconClass}`}>
            <LuneMark />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              lune
            </span>
          </div>
          <p className="text-slate-800 font-semibold text-sm leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          aria-label="Dismiss notification"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex-shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-1 right-0 h-[2px] bg-gray-100 rounded-br-2xl overflow-hidden`}
      >
        <div
          className={`h-full ${config.accentClass} transition-all duration-75 ease-linear rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) =>
        [...prev, { id, type, message, duration }].slice(-TOAST_LIMIT),
      );
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string) => addToast("success", message),
    [addToast],
  );
  const error = useCallback(
    (message: string) => addToast("error", message),
    [addToast],
  );
  const warning = useCallback(
    (message: string) => addToast("warning", message),
    [addToast],
  );
  const info = useCallback(
    (message: string) => addToast("info", message),
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}

      {/* Toast container — bottom-right, stacked */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2.5 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
