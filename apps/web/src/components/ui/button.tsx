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
  asChild,
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0',
    secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0',
    ghost: 'bg-transparent border border-border text-foreground hover:bg-muted/50 hover:border-border/70'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
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