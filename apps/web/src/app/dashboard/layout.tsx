import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

import {
  ExternalLink,
  Globe,
  Settings,
  LogOut,
  Shield,
  Tag,
  ArrowLeftRight,
  Code2,
  BarChart2,
  FileText,
  Activity,
  Users,
} from 'lucide-react';
import { NavLink } from '@/components/ui';

const navGroups = [
  {
    label: 'Monitoring',
    items: [
      { href: '/sites', label: 'Scanner', icon: Globe },
      { href: '/guardian', label: 'Guardian', icon: Shield },
      { href: '/monitoring', label: 'Monitoring', icon: Activity },
    ],
  },
  {
    label: 'Recovery',
    items: [
      { href: '/offers', label: 'Offers', icon: Tag },
      { href: '/redirect-rules', label: 'Redirect Rules', icon: ArrowLeftRight },
      { href: '/script', label: 'Script', icon: Code2 },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/analytics', label: 'Revenue', icon: BarChart2 },
      { href: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Organization',
    items: [{ href: '/orgs', label: 'Members', icon: Users }],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-background border-r flex flex-col min-h-screen">
        {/* Logo */}
        <div className="px-4 py-4 border-b">
          <Link href="/sites" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base">LinkRescue</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map(({ href, label, icon: Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  variant="sidebar"
                  className="flex items-center gap-2.5"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t px-2 py-3 space-y-0.5">
          <NavLink
            href="/settings"
            variant="sidebar"
            className="flex items-center gap-2.5"
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
