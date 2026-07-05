import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'tactical' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-sans font-medium rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/20 border border-red-700/50',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
      outline: 'bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-900/50 hover:text-white',
      danger: 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30',
      success: 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30',
      tactical: 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-x-2 border-y border-slate-700 hover:border-red-500/50 font-mono tracking-wider text-xs',
      ghost: 'bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...(props as any)}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
