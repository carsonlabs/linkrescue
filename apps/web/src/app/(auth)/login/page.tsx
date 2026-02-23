import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-primary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 mb-auto">
          <div className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">LinkRescue</span>
        </Link>
        <blockquote className="mb-auto">
          <p className="text-xl font-medium leading-relaxed text-white/90">
            &ldquo;LinkRescue caught 14 broken affiliate links on my blog that I had no idea about.
            That&rsquo;s hundreds of dollars in missed commissions, recovered.&rdquo;
          </p>
          <footer className="mt-4 text-white/70 text-sm">— Sarah K., affiliate blogger</footer>
        </blockquote>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">LinkRescue</span>
          </Link>

          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Enter your email to receive a magic sign-in link.
          </p>

          <LoginForm />

          <p className="text-sm text-muted-foreground text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
