import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/48"
        onClick={onCancel}
        aria-label="Close dialog"
      ></button>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-l-[6px] border-rose-500 bg-white shadow-2xl">
        <div className="p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-lg shadow-rose-100/80 disabled:opacity-60"
            >
              {isLoading ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
