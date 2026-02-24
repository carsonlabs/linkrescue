import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">LinkRescue</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
