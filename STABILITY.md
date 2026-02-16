# HyperZ: API Stability Guarantees & Versioning Policy

This document outlines the stability guarantees and versioning commitment for the HyperZ framework.

## Semantic Versioning (SemVer)

HyperZ follows [Semantic Versioning 2.0.0](https://semver.org/).

- **MAJOR** version (v2.x.x → v3.x.x): Breaking changes that require developer action.
- **MINOR** version (v2.0.x → v2.1.x): New features and improvements, fully backward compatible.
- **PATCH** version (v2.0.0 → v2.0.1): Bug fixes and security patches only.

## Deprecation Policy

When an API or feature is scheduled for removal:
1. It will be marked as `@deprecated` in a **MINOR** version.
2. It will remain functional for at least one full **MINOR** release cycle.
3. It will be removed in the next **MAJOR** version.

## Long-Term Support (LTS)

HyperZ identifies specific versions for Long-Term Support:
- **v2.5 (Current Goal)**: Designated as the first LTS candidate.
- **LTS Duration**: 18 months of maintenance (security fixes and critical bug fixes).

## Experimental Features

Features marked with **[EXPERIMENTAL]** or placed in internal `_` namespaces (e.g., `/api/_admin`) do not follow the strict SemVer guarantees and may change in minor releases.
