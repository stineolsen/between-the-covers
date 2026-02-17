import { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981, #14b8a6)',
          icon: '✅'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          icon: '❌'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          icon: '⚠️'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          icon: 'ℹ️'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          icon: '📌'
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold animate-slideIn min-w-[300px] max-w-md"
      style={{ background: style.background }}
    >
      <span className="text-2xl">{style.icon}</span>
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 text-2xl font-bold leading-none transition-colors"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
