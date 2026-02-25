import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const baseClasses = 'bg-card border border-border rounded-xl';
  const variantClasses = variant === 'elevated' 
    ? 'shadow-lg hover:shadow-xl transition-shadow duration-200' 
    : 'shadow-sm';

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 border-b border-border ${className}`} {...props}>
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
    <div className={`p-6 border-t border-border ${className}`} {...props}>
      {children}
    </div>
  );
}