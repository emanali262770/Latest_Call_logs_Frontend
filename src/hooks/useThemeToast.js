import { useCallback, useMemo, useState } from 'react';

export function useThemeToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((type, title, description = '', duration = 3200) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, description }]);

    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (title, description) => push('success', title, description),
    error: (title, description) => push('error', title, description, 4200),
    info: (title, description) => push('info', title, description),
  }), [push]);

  return { toasts, toast, removeToast };
}
