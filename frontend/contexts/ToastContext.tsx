
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, action }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
      switch(type) {
          case 'success': return <CheckCircle size={20} className="text-green-600" />;
          case 'error': return <AlertCircle size={20} className="text-red-600" />;
          default: return <Info size={20} className="text-blue-600" />;
      }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 left-4 right-4 z-[3000] flex flex-col gap-2 pointer-events-none items-center sm:items-end sm:right-8 sm:bottom-8 sm:w-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full sm:w-96 p-4 rounded-xl shadow-xl border flex items-center justify-between transition-all animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              toast.type === 'error' ? 'bg-white border-red-100' :
              toast.type === 'success' ? 'bg-white border-green-100' :
              'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0">{getIcon(toast.type)}</div>
                <div className={`text-sm font-medium truncate ${
                    toast.type === 'error' ? 'text-red-900' : 
                    toast.type === 'success' ? 'text-green-900' : 'text-gray-900'
                }`}>
                    {toast.message}
                </div>
            </div>
            
            <div className="flex items-center gap-3 ml-3 shrink-0">
                {toast.action && (
                    <button 
                        onClick={() => { toast.action?.onClick(); removeToast(toast.id); }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm ${
                             toast.type === 'error' ? 'bg-red-600 text-white hover:bg-red-700' :
                             'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                        {toast.action.label}
                    </button>
                )}
                <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 transition">
                    <X size={18} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
