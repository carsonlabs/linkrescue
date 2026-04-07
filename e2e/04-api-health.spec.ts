import { test, expect } from '@playwright/test';

/**
 * API ENDPOINT HEALTH — hit every public endpoint, verify no 500s.
 */

const BASE = process.env.BASE_URL || 'https://www.linkrescue.io';

const PUBLIC_API_ENDPOINTS = [
  { method: 'GET', path: '/api/health', expectedStatus: 200 },
];

// Endpoints that should reject unauthorized requests gracefully (401/403, not 500)
const AUTH_REQUIRED_ENDPOINTS = [
  { method: 'GET', path: '/api/sites' },
  { method: 'GET', path: '/api/scans' },
  { method: 'GET', path: '/api/offers' },
  { method: 'GET', path: '/api/redirect-rules' },
  { method: 'GET', path: '/api/reports' },
  { method: 'GET', path: '/api/analytics/revenue' },
  { method: 'GET', path: '/api/analytics/roi' },
  { method: 'GET', path: '/api/orgs' },
  { method: 'GET', path: '/api/monitoring/incidents' },
  { method: 'GET', path: '/api/monitoring/sources' },
  { method: 'GET', path: '/api/guardian' },
  { method: 'GET', path: '/api/onboarding/status' },
];

// Endpoints that should reject bad input gracefully (400, not 500)
const BAD_INPUT_ENDPOINTS = [
  { method: 'POST', path: '/api/free-scan', body: {} },
  { method: 'POST', path: '/api/free-scan', body: { url: '' } },
  { method: 'POST', path: '/api/free-scan', body: { url: 'not-a-url' } },
  { method: 'POST', path: '/api/calculator-lead', body: {} },
  { method: 'POST', path: '/api/link-checker-lead', body: {} },
];

for (const endpoint of PUBLIC_API_ENDPOINTS) {
  test(`API ${endpoint.method} ${endpoint.path} → ${endpoint.expectedStatus}`, async ({ request }) => {
    const res = await request.get(`${BASE}${endpoint.path}`);
    expect(res.status()).toBe(endpoint.expectedStatus);
  });
}

for (const endpoint of AUTH_REQUIRED_ENDPOINTS) {
  test(`API ${endpoint.method} ${endpoint.path} rejects unauthenticated (not 500)`, async ({ request }) => {
    const res = await request.get(`${BASE}${endpoint.path}`);
    // Should be 401 or 403 or redirect, NOT 500
    expect(res.status(), `${endpoint.path} returned 500!`).not.toBe(500);
    expect(res.status(), `${endpoint.path} returned 502!`).not.toBe(502);
    expect(res.status(), `${endpoint.path} returned 503!`).not.toBe(503);
  });
}

for (const endpoint of BAD_INPUT_ENDPOINTS) {
  test(`API POST ${endpoint.path} handles bad input: ${JSON.stringify(endpoint.body)}`, async ({ request }) => {
    const res = await request.post(`${BASE}${endpoint.path}`, {
      data: endpoint.body,
      headers: { 'Content-Type': 'application/json' },
    });
    // Should be 400/422, NOT 500
    expect(res.status(), `${endpoint.path} returned ${res.status()} on bad input`).not.toBe(500);
    expect(res.status()).not.toBe(502);
  });
}

test('API v1 endpoints reject without API key', async ({ request }) => {
  const v1Endpoints = [
    '/api/v1/check-links',
    '/api/v1/monitors',
    '/api/v1/scans',
    '/api/v1/suggestions',
    '/api/v1/webhooks',
  ];

  for (const path of v1Endpoints) {
    const res = await request.get(`${BASE}${path}`);
    expect(res.status(), `${path} returned ${res.status()} — should reject without API key`).not.toBe(500);
  }
});
