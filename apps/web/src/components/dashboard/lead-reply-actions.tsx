'use client';

import { useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';

type LeadReplyActionsProps = {
  email: string;
  siteUrl: string | null;
  source: string | null;
};

function siteName(siteUrl: string | null) {
  if (!siteUrl) return 'your site';

  try {
    const candidate = /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
    return new URL(candidate).hostname.replace(/^www\./, '');
  } catch {
    return 'your site';
  }
}

function buildReply({ email, siteUrl, source }: LeadReplyActionsProps) {
  const monitoring = source === 'pricing-monitoring-desk';
  const site = siteName(siteUrl);
  const request = monitoring ? 'managed monitoring readiness review' : 'Recovery Sprint review';
  const subject = `${request} for ${site}`;
  const body = [
    'Hello,',
    '',
    `Thanks for requesting a ${request} for ${site}.`,
    '',
    'Before I recommend any paid work, I review the technical evidence personally and confirm whether the site is a good fit.',
    '',
    'Could you reply with:',
    '1. The affiliate programs or merchants that matter most to you',
    '2. Any pages or link problems you already suspect',
    '3. The country or audience your site primarily serves',
    '',
    monitoring
      ? 'I will then let you know whether a human-reviewed monitoring desk is appropriate and what it would cover.'
      : 'I will then send a short recommendation on whether a fixed-scope Recovery Sprint makes sense.',
    '',
    'There is no obligation and no payment has been requested at this stage.',
    '',
    'Best,',
    'LinkRescue',
  ].join('\n');

  return { email, subject, body };
}

export function LeadReplyActions(props: LeadReplyActionsProps) {
  const [copied, setCopied] = useState(false);
  const reply = buildReply(props);
  const mailto = `mailto:${encodeURIComponent(reply.email)}?subject=${encodeURIComponent(reply.subject)}&body=${encodeURIComponent(reply.body)}`;

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(`Subject: ${reply.subject}\n\n${reply.body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={mailto} className="btn-primary text-sm">
        <Mail className="h-4 w-4" /> Draft personal reply
      </a>
      <button type="button" onClick={copyReply} className="btn-secondary text-sm" title="Copy a personal reply template">
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy reply'}
      </button>
    </div>
  );
}
