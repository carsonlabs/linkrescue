import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/sites" className="text-xl font-bold">
            LinkRescue
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/sites" className="text-sm hover:underline">
              Sites
            </Link>
            <Link href="/settings" className="text-sm hover:underline">
              Settings
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
