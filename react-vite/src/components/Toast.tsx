import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useToastStore, ToastType } from '../store/toastStore';

const icons: Record<ToastType, any> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: 'border-success text-success bg-success/10',
  error: 'border-danger text-danger bg-danger/10',
  warning: 'border-warning text-warning bg-warning/10',
  info: 'border-primary text-primary bg-primary/10',
};

const ToastComponent = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`glass px-4 py-3 rounded-lg border-l-4 flex items-center shadow-lg pointer-events-auto min-w-[300px] ${colors[toast.type]}`}
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-gray-100 font-medium flex-1 text-sm">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastComponent;
