'use client';

import { useState } from 'react';

interface CheckoutButtonProps {
  plan?: 'pro' | 'agency';
  className?: string;
}

export function CheckoutButton({ plan = 'pro', className = '' }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const isPro = plan === 'pro';

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
      {loading ? 'Loading...' : isPro ? 'Start Pro Trial' : 'Start Agency Trial'}
    </button>
  );
}

// Convenience exports for pricing page
export function ProCheckoutButton() {
  return <CheckoutButton plan="pro" />;
}

export function AgencyCheckoutButton() {
  return <CheckoutButton plan="agency" />;
}
