import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const baseClasses = 'rounded-xl overflow-hidden';
  const variantClasses = {
    default: 'bg-slate-800/50 border border-white/10',
    elevated: 'bg-slate-800/80 border border-white/10 shadow-xl',
    glass: 'glass-card',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-b border-white/10 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-t border-white/10 ${className}`} {...props}>
      {children}
    </div>
  );
}
