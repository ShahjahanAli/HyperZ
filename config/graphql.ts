// ──────────────────────────────────────────────────────────────
// HyperZ Config — GraphQL Integration
// ──────────────────────────────────────────────────────────────

import { envBool, envNumber } from '../src/support/helpers.js';

export default {
    /** Enable/disable GraphQL endpoint */
    enabled: envBool('GRAPHQL_ENABLED', true),

    /** GraphQL endpoint path */
    path: '/graphql',

    /** Enable GraphiQL IDE */
    graphiql: envBool('GRAPHQL_IDE', true),

    /** Query depth limit (prevents abuse) */
    depthLimit: envNumber('GRAPHQL_DEPTH_LIMIT', 10),

    /** Enable introspection (disable in production) */
    introspection: envBool('GRAPHQL_INTROSPECTION', true),

    /** Max query complexity */
    maxComplexity: envNumber('GRAPHQL_MAX_COMPLEXITY', 1000),
};
