import { cn } from '@/src/lib/utils';

export function Card({ children, className, title, subtitle, headerAction, ...props }) {
  return (
    <div 
      className={cn(
        "bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  isLoading, 
  className, 
  ...props 
}) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/20",
    secondary: "bg-brand-light text-brand hover:bg-brand/10",
    outline: "bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-2xl",
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      )}
      {!isLoading && icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

export function Input({ label, error, helperText, icon, className, ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors">
            {icon}
          </div>
        )}
        <input 
          className={cn(
            "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all text-sm placeholder:text-gray-400 font-mono",
            icon && "pl-10",
            error && "border-red-500 focus:ring-red-500/10 focus:border-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500 ml-1">{helperText}</p>}
    </div>
  );
}

export function Badge({ children, variant = 'gray' }) {
  const variants = {
    brand: "bg-brand-light text-brand border-brand/10",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider",
      variants[variant]
    )}>
      {children}
    </span>
  );
}
