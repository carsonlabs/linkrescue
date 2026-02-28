'use client';

import { useState } from 'react';

interface CheckoutButtonProps {
  plan?: 'pro' | 'agency';
  interval?: 'monthly' | 'annual';
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({
  plan = 'pro',
  interval = 'monthly',
  className = '',
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Get Rewardful referral ID if available
      const referral = typeof window !== 'undefined' && (window as any).Rewardful?.referral;
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval, ...(referral ? { referral } : {}) }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const isPro = plan === 'pro';
  const defaultLabel = isPro ? 'Start Pro Trial' : 'Start Agency Trial';

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
        isPro
          ? 'btn-primary'
          : 'btn-secondary border-green-500/30 hover:border-green-500/50'
      } ${className}`}
    >
      {loading ? 'Loading...' : children || defaultLabel}
    </button>
  );
}

// Convenience exports for pricing page
export function ProCheckoutButton({ interval = 'monthly' as const }) {
  return <CheckoutButton plan="pro" interval={interval} />;
}

export function AgencyCheckoutButton({ interval = 'monthly' as const }) {
  return <CheckoutButton plan="agency" interval={interval} />;
}
