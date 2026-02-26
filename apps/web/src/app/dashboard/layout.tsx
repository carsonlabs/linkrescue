import Link from 'next/link';
import { ExternalLink, LayoutDashboard, Globe, Mail, Settings, LogOut, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl hidden lg:block">
        <div className="p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
              <ExternalLink className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">LinkRescue</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavLink href="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/sites" icon={Globe} active>
              Sites
            </NavLink>
            <NavLink href="/dashboard/alerts" icon={Mail}>
              Alerts
            </NavLink>
            <NavLink href="/dashboard/settings" icon={Settings}>
              Settings
            </NavLink>
          </nav>
        </div>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Account</p>
              <p className="text-xs text-slate-500 truncate">Free plan</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
            </div>
            <span className="font-display font-bold">LinkRescue</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard/sites" className="text-slate-400 hover:text-white">
              Sites
            </Link>
            <Link href="/dashboard/settings" className="text-slate-400 hover:text-white">
              Settings
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
}
