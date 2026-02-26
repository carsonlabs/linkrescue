import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
}

export function Input({ 
  className, 
  variant = 'default', 
  inputSize = 'md',
  ...props 
}: InputProps) {
  const baseClasses = 'w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors';
  
  const variantClasses = {
    default: 'bg-input hover:bg-input/90',
    ghost: 'bg-transparent border-border/50 hover:border-border/70'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <input
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[inputSize]} ${className}`}
      {...props}
    />
  );
}
