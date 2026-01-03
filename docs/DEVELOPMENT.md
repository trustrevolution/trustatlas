# Development Workflows

This document describes how to set up, run, and develop Trust Atlas locally.

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Docker & Docker Compose | Latest | PostgreSQL, Redis, MinIO |
| Node.js | 22+ | API and web servers |
| Python | 3.9+ | ETL jobs |
| Make | Any | Build automation |
| psql | Latest | Database CLI (optional) |

### Recommended Tools

- **mise** - Runtime version manager (Node, Python)
- **VS Code** - IDE with TypeScript and Python extensions
- **Postman/curl** - API testing

## Quick Start

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/org/trustindex.git
cd trustindex

# Copy environment file
cp .env.example .env

# Start everything (Docker services, migrate, seed)
make up
```

This single command:
1. Starts PostgreSQL, Redis, and MinIO via Docker Compose
2. Waits for services to be ready
3. Runs database migrations
4. Seeds demo data (208 countries, sample observations)

### Start Development Servers

Open two terminal windows:

```bash
# Terminal 1: API server (http://localhost:3001)
make api

# Terminal 2: Web server (http://localhost:3000)
make web
```

### Verify Setup

```bash
# Health check
curl http://localhost:3001/health
# → {"status":"ok","version":"0.1.0"}

# Get countries
curl http://localhost:3001/countries | head -20
```

## Environment Configuration

### .env File

```bash
# Database (PostgreSQL 16)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trust
POSTGRES_USER=trust
POSTGRES_PASSWORD=trust
POSTGRES_URL=postgres://trust:trust@localhost:5432/trust

# Cache (Redis 7)
REDIS_URL=redis://localhost:6379

# Storage (MinIO - S3-compatible)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=dev
S3_SECRET_KEY=devpass
S3_BUCKET=trust-artifacts

# API/Web
NODE_ENV=development
API_PORT=3001
WEB_PORT=3002

# Feature flags
FEATURE_USE_NEXT_API=false
```

### Docker Compose Services

| Service | Port | Data Volume |
|---------|------|-------------|
| PostgreSQL 16 | 5432 | db_data |
| Redis 7 | 6379 | redis_data |
| MinIO (S3) | 9000, 9001 | minio_data |

## Makefile Reference

### Infrastructure

```bash
make up          # Start services, migrate, seed
make down        # Stop services (preserves data)
make clean       # Stop services, delete volumes, prune Docker
make logs        # Tail service logs
make migrate     # Apply database migrations
make seed        # Load demo data
```

### Development Servers

```bash
make api         # Start Fastify API (port 3001)
make web         # Start Next.js web (port 3000/3002)
make install     # Install npm + pip dependencies
```

### ETL Jobs

```bash
# Individual sources (default: YEAR=2024)
make etl-cpi                    # Transparency International CPI
make etl-wgi                    # World Bank WGI
make etl-oecd                   # OECD Trust Indicators
make etl-wvs                    # World Values Survey (needs manual download)
make etl-ess                    # European Social Survey (needs manual download)

# Specify year
make etl-cpi YEAR=2023
make etl-wgi YEAR=2022

# Governance pillar combo
make etl-gov YEAR=2024          # CPI + WGI + assemble

# All sources + assemble
make etl-all YEAR=2024

# Assembly only
make assemble YEAR=2024
make assemble YEAR=2024 SOURCES=CPI,WGI
```

### Testing & Quality

```bash
make test        # Run API and ETL tests
make lint        # Run all linters (eslint, black, ruff, mypy)
```

## Common Development Tasks

### Adding a New API Endpoint

1. Create route file in `api/src/routes/`:

```typescript
// api/src/routes/newroute.ts
import { FastifyPluginAsync } from 'fastify'
import db from '../lib/db'

const newRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/newroute', async (request, reply) => {
    const result = await db.query('SELECT * FROM ...')
    reply
      .header('Cache-Control', 's-maxage=86400')
      .header('X-GTI-Version', '0.1.0')
      .send(result.rows)
  })
}

export default newRoute
```

2. Register in `api/src/server.ts`:

```typescript
import newRoute from './routes/newroute'

// Inside register function (no prefix - subdomain is api.trustatlas.org)
await fastify.register(newRoute)
```

3. Add client method in `web/lib/api.ts`:

```typescript
async getNewData() {
  return this.fetch('/newroute')
}
```

### Adding a New ETL Source

See [ETL_PIPELINE.md](./ETL_PIPELINE.md) for detailed instructions.

Quick summary:

1. Create `etl/jobs/newsource.py` extending `BaseProcessor`
2. Implement `download()` and `process()` methods
3. Add Makefile target: `make etl-newsource`
4. Add source metadata to database
5. Update assembly weights if needed

### Modifying the Database Schema

1. Edit `db/migrations/000_init.sql` (or create new migration file)

2. Apply changes:
```bash
make migrate
```

3. If seeding changed, update `scripts/dev_seed.py`

4. Rebuild local environment:
```bash
make clean
make up
```

### Adding a New Web Page

1. Create page file in `web/app/`:

```tsx
// web/app/newpage/page.tsx
export default function NewPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">New Page</h1>
    </div>
  )
}
```

2. Add navigation link in layout or header component

### Running Specific Tests

```bash
# API tests (Vitest)
cd api && npm run test
cd api && npm run test -- --watch

# ETL tests (pytest)
cd etl && pytest
cd etl && pytest tests/test_scaling.py -v
cd etl && pytest -k "test_wgi"
```

## Debugging

### API Issues

```bash
# Check API logs
cd api && npm run dev

# Test endpoint manually
curl -v http://localhost:3001/countries

# Check database connection
psql $POSTGRES_URL -c "SELECT 1"
```

### Database Issues

```bash
# Connect to database
psql $POSTGRES_URL

# Check table counts
SELECT 'countries' as table, COUNT(*) FROM countries
UNION ALL
SELECT 'observations', COUNT(*) FROM observations
UNION ALL
SELECT 'country_year', COUNT(*) FROM country_year;

# View recent observations
SELECT * FROM observations ORDER BY ingested_at DESC LIMIT 10;
```

### ETL Issues

```bash
# Check staging output
head -20 data/staging/cpi_2024.csv

# View raw data
ls -la data/raw/cpi/2024/

# Check observation counts by source
psql $POSTGRES_URL -c "
    SELECT source, year, COUNT(*)
    FROM observations
    GROUP BY source, year
    ORDER BY year DESC, source
"
```

### Docker Issues

```bash
# View service status
docker compose ps

# View logs
docker compose logs postgres
docker compose logs -f  # tail all

# Restart specific service
docker compose restart postgres

# Full reset
make clean
make up
```

## Code Quality

### TypeScript (API & Web)

```bash
# Linting
cd api && npm run lint
cd web && npm run lint

# Type checking
cd api && npm run typecheck
cd web && npm run typecheck

# Format (if prettier configured)
cd api && npx prettier --write src/
```

### Python (ETL)

```bash
# Format
cd etl && black .

# Lint
cd etl && ruff check .
cd etl && ruff check --fix .  # auto-fix

# Type check
cd etl && mypy .
```

## Git Workflow

### Branch Naming

```
feature/add-new-source
fix/api-caching-bug
docs/update-methodology
refactor/etl-base-class
```

### Commit Messages

```
Add ESS data source for European trust data

- Implement ESSProcessor with API download
- Add 0-10 to percent scaling
- Update assembly weights for institutional pillar
```

### Before Pushing

```bash
# Run tests
make test

# Run linters
make lint

# Check for uncommitted changes
git status

# Review diff
git diff
```

## CI/CD Pipeline

The project uses GitHub Actions (`.github/workflows/ci.yml`):

### Jobs

1. **API Tests** (Node 18 + PostgreSQL)
   - `npm ci`
   - `migrate`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`

2. **Web Tests** (Node 18)
   - `npm ci`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`

3. **ETL Tests** (Python 3.11 + PostgreSQL)
   - `pip install -r requirements.txt`
   - `migrate`
   - `black --check .`
   - `ruff check .`
   - `mypy .`
   - `pytest`

### Running CI Locally

```bash
# Simulate CI checks
make lint
make test

# Build web to check for errors
cd web && npm run build
```

## Performance Optimization

### Database

```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM country_year WHERE year = 2024;

# Check index usage
SELECT * FROM pg_stat_user_indexes;

# Vacuum and analyze
VACUUM ANALYZE;
```

### API Caching

All API responses include cache headers:
```
Cache-Control: s-maxage=86400, stale-while-revalidate=604800
```

For development, disable caching:
```bash
curl -H "Cache-Control: no-cache" http://localhost:3001/countries
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :5432

# Kill process
kill -9 <PID>

# Or use different port
API_PORT=3002 make api
```

### Database Connection Refused

```bash
# Check if PostgreSQL is running
docker compose ps

# Restart services
docker compose restart postgres
make migrate
```

### ETL Download Failures

```bash
# Check internet connectivity
curl -I https://www.transparency.org

# Use skip-download with existing data
cd etl && python jobs/cpi.py --year 2024 --skip-download
```

### Node Module Issues

```bash
# Clear and reinstall
rm -rf api/node_modules web/node_modules
make install
```

### Python Environment Issues

```bash
# Recreate virtual environment
cd etl
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [ETL_PIPELINE.md](./ETL_PIPELINE.md) - ETL details
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints
- [DATA_MODEL.md](./DATA_MODEL.md) - Database schema
