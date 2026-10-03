#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const checks = [
  {
    files: ['server/app.ts', 'server/routes/billingRoutes.ts', 'src/utils/billing.ts'],
    pattern: /x-fish-customer-id|localStorage\.setItem\(['"]fishai\.customerId/i,
    message: 'Stripe customer IDs must not be authorization credentials.'
  },
  {
    files: ['server/app.ts', 'src/utils/apiAuth.ts'],
    pattern: /x-fish-app-secret|localStorage\.setItem\(['"]fishai\.appSecret/i,
    message: 'The owner password must not be persisted/replayed by the browser.'
  },
  {
    files: ['server/app.ts', 'server/routes/billingRoutes.ts'],
    pattern: /\/api\/mail\/test|mailRouter/,
    message: 'A public arbitrary email relay must not exist.'
  },
  {
    files: ['server/routes/aiRoutes.ts'],
    pattern: /dailyBagLimit|minLegalLength|HARVEST_ALLOWED|isCatchLegalForEstimatedSize/,
    message: 'AI vision must not fabricate harvest/regulation decisions.'
  }
];

let failed = false;
for (const check of checks) {
  for (const file of check.files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    if (check.pattern.test(source)) {
      console.error(`[integrity] ${check.message} Found in ${file}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log('[integrity] security/truthfulness regression checks passed');
