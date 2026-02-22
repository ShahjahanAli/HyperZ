// ──────────────────────────────────────────────────────────────
// HyperZ Config — Feature Flags
// ──────────────────────────────────────────────────────────────
//
// Define feature flags here. Each flag can be:
//   - boolean: `true`/`false`
//   - function: `(context) => boolean` for dynamic evaluation
//
// Flags defined here are loaded at boot time via FeatureFlagsProvider.
// ──────────────────────────────────────────────────────────────

import type { FeatureFlagResolver } from '../src/support/FeatureFlags.js';

const features: Record<string, FeatureFlagResolver> = {
    // Example flags — customize for your application:
    // 'new-dashboard': true,
    // 'beta-ai': (ctx) => ctx.user?.role === 'beta',
    // 'maintenance-mode': false,
};

export default features;
