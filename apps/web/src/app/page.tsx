import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">LinkRescue</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Automatically find and fix broken affiliate links on your website. Stop losing revenue to
          404s and redirects.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
