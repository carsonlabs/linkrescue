'use client';

import { useState } from 'react';

export function TestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch('/api/email/test', { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      setMessage('Test email sent! Check your inbox.');
    } else {
      setMessage(data.error || 'Failed to send test email');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Test Email'}
      </button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
