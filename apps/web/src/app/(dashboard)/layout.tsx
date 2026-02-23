import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Globe, Settings, LogOut } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/sites" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base">LinkRescue</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/sites"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Globe className="w-4 h-4" />
              Sites
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <form action="/api/auth/signout" method="POST" className="ml-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
