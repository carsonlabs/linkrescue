import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = [
  '/sites',
  '/settings',
  '/guardian',
  '/offers',
  '/redirect-rules',
  '/script',
  '/analytics',
  '/reports',
  '/monitoring',
  '/orgs',
  '/scans',
  '/dashboard',
];
const authPaths = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  // Check if env vars are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars in middleware');
    // Continue without auth check if env vars are missing
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Redirect to dashboard if logged in user visits root
    if (path === '/' && user) {
      return NextResponse.redirect(new URL('/sites', request.url));
    }

    // Redirect /dashboard to /dashboard/sites
    if (path === '/dashboard' && user) {
      return NextResponse.redirect(new URL('/dashboard/sites', request.url));
    }

    // Protect dashboard routes
    const isProtected = protectedPaths.some((p) => path.startsWith(p));
    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect authenticated users away from auth pages
    const isAuth = authPaths.some((p) => path.startsWith(p));
    if (isAuth && user) {
      return NextResponse.redirect(new URL('/sites', request.url));
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue on error to avoid breaking the app
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
