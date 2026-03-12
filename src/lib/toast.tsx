import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

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
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TOAST_LIMIT = 3;

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    border: 'border-emerald-400',
    iconColor: 'text-white',
  },
  error: {
    icon: XCircle,
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    border: 'border-red-400',
    iconColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    border: 'border-amber-400',
    iconColor: 'text-white',
  },
  info: {
    icon: Info,
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    border: 'border-blue-400',
    iconColor: 'text-white',
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const duration = toast.duration || 4000;

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
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden
        ${config.bg} ${config.border}
        text-white px-5 py-4 rounded-2xl shadow-2xl
        border-2 backdrop-blur-sm
        flex items-center gap-3 min-w-[320px] max-w-[420px]
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'animate-toast-exit opacity-0 translate-x-full scale-95' 
          : 'animate-toast-enter'
        }
        hover:scale-105 hover:shadow-3xl cursor-pointer
        group
      `}
      onClick={handleRemove}
    >
      {/* Animated Icon */}
      <div className="animate-bounce-in">
        <Icon size={24} className={`${config.iconColor} drop-shadow-lg`} />
      </div>
      
      {/* Message */}
      <p className="flex-1 font-semibold text-sm drop-shadow-sm">{toast.message}</p>
      
      {/* Close Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); handleRemove(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded-full"
      >
        <X size={16} />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div 
          className="h-full bg-white/50 transition-all duration-100 ease-linear rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Particle Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -top-1 -right-1 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-75" />
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prev => {
      const newToasts = [...prev, { id, type, message, duration }];
      // Keep only the last TOAST_LIMIT toasts
      return newToasts.slice(-TOAST_LIMIT);
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className="pointer-events-auto"
            style={{ 
              transform: `translateY(${(toasts.length - 1 - index) * -8}px) scale(${1 - (toasts.length - 1 - index) * 0.02})`,
              opacity: 1 - (toasts.length - 1 - index) * 0.1
            }}
          >
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
