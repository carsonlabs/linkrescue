import * as React from 'react';
import Link from 'next/link';

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  active?: boolean;
  variant?: 'default' | 'sidebar';
}

export function NavLink({ 
  className, 
  href, 
  active = false,
  variant = 'default',
  children, 
  ...props 
}: NavLinkProps) {
  const baseClasses = 'transition-colors';
  
  const variantClasses = {
    default: 'text-sm font-medium text-muted-foreground hover:text-foreground',
    sidebar: 'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
  };
  
  const activeClasses = variant === 'sidebar' 
    ? 'bg-accent text-accent-foreground font-medium' 
    : 'text-foreground font-semibold';

  const classes = `${baseClasses} ${variantClasses[variant]} ${active ? activeClasses : ''} ${className}`;

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}