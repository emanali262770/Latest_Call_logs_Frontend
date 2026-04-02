import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const TOAST_THEME = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    borderClass: 'border-emerald-100',
    glowClass: 'shadow-emerald-100/60',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-600',
    borderClass: 'border-rose-100',
    glowClass: 'shadow-rose-100/60',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand',
    borderClass: 'border-brand/20',
    glowClass: 'shadow-brand/20',
  },
};

export default function ThemeToastViewport({ toasts, onClose }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-[95] w-[min(92vw,24rem)] space-y-3">
      {toasts.map((item) => {
        const theme = TOAST_THEME[item.type] || TOAST_THEME.info;
        const Icon = theme.icon;

        return (
          <div
            key={item.id}
            className={`rounded-2xl border bg-white p-4 shadow-xl ${theme.borderClass} ${theme.glowClass}`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 ${theme.iconClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
              </div>
              <button
                onClick={() => onClose(item.id)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
