import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'purple';
  size?: 'sm' | 'md';
}

export function Badge({ 
  className, 
  variant = 'default',
  size = 'md',
  children, 
  ...props 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-slate-700 text-slate-300 border border-white/10',
    success: 'bg-green-500/15 text-green-400 border border-green-500/25',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    destructive: 'bg-red-500/15 text-red-400 border border-red-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
