<!--
UPDATE WHEN:
- Adding new entry points or key files
- Introducing new patterns
- Discovering non-obvious behavior

Helps quickly navigate the codebase when resuming work.
-->

# Code Landmarks

Quick reference to important parts of the codebase.

## Entry Points
| Location | Purpose |
|----------|---------|
| api/src/server.ts | API entry point (Fastify) |
| web/app/ | Next.js app router pages |
| etl/jobs/ | ETL job scripts |
| etl/pipelines/ | Data pipelines |

## Core Business Logic
| Location | Purpose |
|----------|---------|
| api/src/ | API routes and handlers |
| web/components/ | React components |
| web/lib/ | Shared utilities and chart builders |
| etl/data_quality/ | Data quality sweep system |

## Configuration
| Location | Purpose |
|----------|---------|
| .env / .env.local | Environment variables |
| api/vercel.json | API deployment config |
| web/next.config.js | Next.js configuration |
| etl/pyproject.toml | Python project config |

## Database
| Location | Purpose |
|----------|---------|
| db/migrations/ | SQL migration files |
| db/seed/ | Seed data |

## Key Patterns
| Pattern | Example Location | Notes |
|---------|------------------|-------|
| Chart builders | web/lib/charts/ | Use builder functions, not raw ECharts |
| Global CSS | web/app/globals.css | Use classes before Tailwind |
| API routes | api/src/ | Fastify with Zod validation |

## Testing
| Location | Purpose |
|----------|---------|
| api/src/**/*.test.ts | API tests (Vitest) |
| etl/tests/ | ETL tests (pytest) |

## CI/CD
| Location | Purpose |
|----------|---------|
| .github/workflows/ci.yml | Main CI pipeline |
| .github/workflows/claude-code-review.yml | Claude code review |
| .github/workflows/claude.yml | Claude workflow |

## Gotchas & Non-Obvious Behavior
| Location | Issue | Notes |
|----------|-------|-------|
| CLAUDE.md | Pillar methodology | v0.7.0 - WVS-family sources take precedence |
| CLAUDE.md | Confidence tiers | A/B/C based on data recency |
| etl/pyproject.toml | In etl/ directory | Not at root |
