import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Load test for the *read-heavy* public storefront traffic — search, product detail, category
// browsing. This is deliberately scoped to unauthenticated endpoints: exercising the checkout
// flow under load needs a way to mint test sessions without going through real SMS OTP delivery
// (MSG91 isn't wired up with a load-test bypass, and adding an OTP-skip backdoor for this purpose
// would itself be a security liability not worth taking). The inventory engine's correctness under
// concurrency (the "never oversell" guarantee) is proven separately and more precisely by the Jest
// test `tests/inventory.test.ts` — 25 parallel reservation attempts against 10 units of stock,
// asserting exactly 10 succeed. This script's job is throughput/latency, not correctness.
//
// Install k6: https://k6.io/docs/get-started/installation/ (not an npm package — a standalone binary)
// Run:        k6 run apps/api/loadtest/browse.k6.js
// Against a deployed env: k6 run -e BASE_URL=https://api.medicaremedicalstore.com/api/v1 apps/api/loadtest/browse.k6.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const searchLatency = new Trend('search_latency_ms');
const productLatency = new Trend('product_detail_latency_ms');

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // ramp up
        { duration: '1m', target: 200 }, // sustained load
        { duration: '30s', target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    search_latency_ms: ['p(95)<500'],
    product_detail_latency_ms: ['p(95)<600'],
  },
};

const SEARCH_TERMS = ['paracetamol', 'vitamin', 'syrup', 'cough', 'pain relief', ''];

export default function () {
  const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];

  const searchRes = http.get(`${BASE_URL}/medicines?q=${encodeURIComponent(term)}&page=1&limit=20`);
  searchLatency.add(searchRes.timings.duration);
  check(searchRes, { 'search status is 200': (r) => r.status === 200 });

  const body = searchRes.json();
  const items = body && body.data ? body.data : [];

  if (items.length > 0) {
    const pick = items[Math.floor(Math.random() * items.length)];
    const detailRes = http.get(`${BASE_URL}/medicines/slug/${pick.slug}`);
    productLatency.add(detailRes.timings.duration);
    check(detailRes, { 'product detail status is 200': (r) => r.status === 200 });
  }

  const catRes = http.get(`${BASE_URL}/catalog/categories`);
  check(catRes, { 'categories status is 200': (r) => r.status === 200 });

  sleep(Math.random() * 2);
}
