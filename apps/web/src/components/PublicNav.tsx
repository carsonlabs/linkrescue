'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/link-checker', label: 'Link Checker' },
  { href: '/affiliate-link-revenue-calculator', label: 'Calculator' },
  { href: '/blog', label: 'Blog' },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
            <ExternalLink className="w-4 h-4 text-slate-900" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">LinkRescue</span>
        </Link>

        <div className="hidden lg:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href="/login"
            className="hidden sm:block text-sm whitespace-nowrap text-slate-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link href="/signup" className="hidden sm:inline-flex btn-primary text-sm whitespace-nowrap">
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-slate-400 hover:text-white transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/5" />
            <Link href="/login" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white transition-colors py-2">
              Sign in
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary text-sm justify-center">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
