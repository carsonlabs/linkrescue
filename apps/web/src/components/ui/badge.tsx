import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md';
}

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'md',
  children, 
  ...props 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1 font-medium border';
  
  const variantClasses = {
    default: 'bg-muted/50 text-foreground border-border',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    destructive: 'bg-red-50 text-red-700 border-red-200'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-full',
    md: 'px-2.5 py-0.5 text-sm rounded-full'
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