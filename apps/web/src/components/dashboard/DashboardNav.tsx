'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  BarChart2,
  FileText,
  Settings,
  Shield,
  Tag,
  GitBranch,
  Activity,
} from 'lucide-react';

const primaryNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/sites', label: 'Sites', icon: Globe },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
];

const powerNav = [
  { href: '/dashboard/guardian', label: 'Guardian Links', icon: Shield },
  { href: '/dashboard/offers', label: 'Offers', icon: Tag },
  { href: '/dashboard/redirect-rules', label: 'Redirect Rules', icon: GitBranch },
  { href: '/dashboard/monitoring', label: 'Monitoring', icon: Activity },
];

const bottomNav = [{ href: '/dashboard/settings', label: 'Settings', icon: Settings }];

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {label}
    </Link>
  );
}

export function DashboardNav() {
  return (
    <nav className="space-y-1">
      {primaryNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}

      <div className="pt-4 pb-1">
        <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
          Advanced
        </p>
      </div>

      {powerNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}

      <div className="pt-4 pb-1">
        <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
          Account
        </p>
      </div>

      {bottomNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </nav>
  );
}
