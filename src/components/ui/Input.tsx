import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, rightIcon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 font-sans">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full bg-slate-900 border text-slate-100 rounded px-3 py-2 text-sm transition-all duration-200
              placeholder-slate-600
              focus:outline-none focus:ring-1 focus:ring-slate-500 focus:bg-slate-950
              ${leftIcon ? 'pl-9' : ''}
              ${rightIcon ? 'pr-9' : ''}
              ${error ? 'border-rose-500/50 focus:ring-rose-500 focus:border-rose-500/80' : 'border-slate-800 focus:border-slate-600'}
              disabled:opacity-50 disabled:bg-slate-950 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-500 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-rose-400 font-mono">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-500 font-mono">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// --- Textarea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', label, error, helperText, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 font-sans">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            w-full bg-slate-900 border text-slate-100 rounded px-3 py-2 text-sm transition-all duration-200
            placeholder-slate-600
            focus:outline-none focus:ring-1 focus:ring-slate-500 focus:bg-slate-950
            ${error ? 'border-rose-500/50 focus:ring-rose-500 focus:border-rose-500/80' : 'border-slate-800 focus:border-slate-600'}
            disabled:opacity-50 disabled:bg-slate-950 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-rose-400 font-mono">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-500 font-mono">{helperText}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 font-sans">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-slate-900 border text-slate-100 rounded px-3 py-2 text-sm transition-all duration-200
            focus:outline-none focus:ring-1 focus:ring-slate-500 focus:bg-slate-950
            ${error ? 'border-rose-500/50 focus:ring-rose-500 focus:border-rose-500/80' : 'border-slate-800 focus:border-slate-600'}
            disabled:opacity-50 disabled:bg-slate-950 disabled:cursor-not-allowed
            appearance-none cursor-pointer
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-rose-400 font-mono">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-500 font-mono">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
