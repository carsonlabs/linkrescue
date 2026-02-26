import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md',
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-400 to-green-500 text-slate-900 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5',
    secondary: 'bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700/80 hover:border-green-500/30',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
