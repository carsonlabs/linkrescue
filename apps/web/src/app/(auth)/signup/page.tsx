import Link from 'next/link';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Free Account',
  description: 'Start monitoring your affiliate links for free. No credit card required.',
  robots: 'noindex',
};

const perks = [
  'Free forever for 1 site',
  'Daily automated scans',
  'Email alerts when links break',
  'No credit card required',
];

export default function SignupPage() {
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
        <div className="mb-auto">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Start protecting your affiliate income in minutes
          </h2>
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-white/70 flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
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

          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Enter your email to receive a magic sign-up link. No password needed.
          </p>

          <SignupForm />

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
