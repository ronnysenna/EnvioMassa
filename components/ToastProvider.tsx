"use client";
import { createContext, useCallback, useContext } from "react";
import { Toaster, toast } from "sonner";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type Toast = {
  type: "success" | "error" | "info" | "warning";
  message: string;
  description?: string;
};

type ToastContextValue = {
  showToast: (t: Toast) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const iconMap = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback(({ type, message, description }: Toast) => {
    const toastProps = {
      icon: iconMap[type],
      description,
    };

    switch (type) {
      case "success":
        toast.success(message, toastProps);
        break;
      case "error":
        toast.error(message, toastProps);
        break;
      case "warning":
        toast.warning(message, toastProps);
        break;
      case "info":
      default:
        toast.info(message, toastProps);
        break;
    }
  }, []);

  const contextValue: ToastContextValue = {
    showToast,
    success: (message, description) => showToast({ type: "success", message, description }),
    error: (message, description) => showToast({ type: "error", message, description }),
    info: (message, description) => showToast({ type: "info", message, description }),
    warning: (message, description) => showToast({ type: "warning", message, description }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toaster
        position="top-right"
        theme="light"
        richColors
        expand
        closeButton
        visibleToasts={3}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback silencioso durante prerender
    return {
      showToast: (_: Toast) => { },
      success: (_: string) => { },
      error: (_: string) => { },
      info: (_: string) => { },
      warning: (_: string) => { },
    } as ToastContextValue;
  }
  return ctx;
}
