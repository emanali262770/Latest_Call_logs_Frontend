import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { cn } from '@/src/lib/utils';

const tabs = [
  { label: 'Groups', path: '/groups' },
  { label: 'Users', path: '/users' },
  { label: 'Permissions', path: '/permissions' },
];

export function AccessControlShell({ title, subtitle, children }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[32px] font-black tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 text-[15px] text-gray-500">{subtitle}</p>
      </div>

      <div className="rounded-[1.75rem] border border-gray-200 bg-white px-4 py-3.5 shadow-xl shadow-gray-200/50">
        <div className="flex flex-wrap items-center gap-2.5">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  'rounded-2xl border px-5 py-2.5 text-[14px] font-medium transition-all',
                  isActive
                    ? 'border-brand/30 bg-brand-light text-brand shadow-sm'
                    : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  widthClass = 'max-w-lg',
  titleClassName = '',
  descriptionClassName = '',
  bodyClassName = '',
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/48"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className={cn('relative z-10 w-full rounded-[2rem] bg-white shadow-2xl', widthClass)}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className={cn('text-2xl font-bold tracking-tight text-gray-900', titleClassName)}>{title}</h2>
            {description ? (
              <p className={cn('mt-1 text-base text-gray-500', descriptionClassName)}>{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-2xl leading-none text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className={cn('px-6 py-5', bodyClassName)}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
