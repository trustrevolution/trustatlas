.PHONY: up down migrate seed api web etl-cpi etl-wgi etl-oecd etl-wvs etl-ess etl-reuters etl-eurobarometer etl-media etl-all etl-gov clean logs install test lint sweep etl-prod-evs etl-prod-reuters etl-prod-eurobarometer etl-prod-media aggregate-pillars aggregate-pillars-prod aggregate-media aggregate-interpersonal aggregate-institutional sync-from-prod sync-verify deploy-api deploy-web deploy deploy-api-prod deploy-web-prod deploy-prod

# Default year for ETL jobs
YEAR ?= 2024

# Load environment variables
include .env
export

up:
	docker compose up -d --wait
	@echo "Waiting for services to be ready..."
	@sleep 5
	$(MAKE) migrate
	$(MAKE) seed

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v
	docker system prune -f

migrate:
	@echo "Running database migrations..."
	@for f in $$(ls db/migrations/*.sql | sort); do \
		echo "Applying $$f..."; \
		PGPASSWORD=$(POSTGRES_PASSWORD) psql -h $(POSTGRES_HOST) -p $(POSTGRES_PORT) -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f $$f; \
	done

seed:
	@echo "Seeding database..."
	@cd scripts && python3 dev_seed.py

api:
	@echo "Starting API server..."
	@cd api && npm install && npm run dev

web:
	@echo "Starting web server..."
	@cd web && npm install && npm run dev

# ETL Jobs - Individual Sources
etl-cpi:
	@echo "Running CPI ETL job for $(YEAR)..."
	@cd etl && python jobs/cpi.py --year $(YEAR)

etl-wgi:
	@echo "Running WGI ETL job for $(YEAR)..."
	@cd etl && python jobs/wgi.py --year $(YEAR)

etl-oecd:
	@echo "Running OECD ETL job for $(YEAR)..."
	@cd etl && python jobs/oecd.py --year $(YEAR)

etl-wvs:
	@echo "Running WVS ETL job (manual download required)..."
	@cd etl && python jobs/wvs.py --year $(YEAR)

etl-ess:
	@echo "Running ESS ETL job (manual download required)..."
	@cd etl && python jobs/ess.py --year $(YEAR)

# Media Pillar ETL Jobs
etl-reuters:
	@echo "Running Reuters DNR ETL job..."
	python -m etl.jobs.reuters_dnr --all-years

etl-eurobarometer:
	@echo "Running Eurobarometer ETL job..."
	python -m etl.jobs.eurobarometer

etl-media: etl-reuters etl-eurobarometer
	@echo "Media pillar ETL complete."

# ETL - Governance Pillar (CPI + WGI)
etl-gov:
	@echo "Running governance pillar ETL (CPI + WGI) for $(YEAR)..."
	$(MAKE) etl-cpi YEAR=$(YEAR)
	$(MAKE) etl-wgi YEAR=$(YEAR)

# ETL - All Sources (governance + surveys + media)
etl-all:
	@echo "Running all ETL jobs for $(YEAR)..."
	$(MAKE) etl-cpi YEAR=$(YEAR)
	$(MAKE) etl-wgi YEAR=$(YEAR)
	$(MAKE) etl-oecd YEAR=$(YEAR)
	-$(MAKE) etl-wvs YEAR=$(YEAR)
	-$(MAKE) etl-ess YEAR=$(YEAR)
	-$(MAKE) etl-media

install:
	@echo "Installing dependencies..."
	@cd api && npm install
	@cd web && npm install
	@cd etl && pip install -r requirements.txt

test:
	@echo "Running tests..."
	@cd api && npm run test || true
	@cd etl && pytest || true

lint:
	@echo "Running linters..."
	@cd api && npm run lint && npm run typecheck || true
	@cd web && npm run lint && npm run typecheck || true
	@cd etl && black . && ruff check . && mypy . || true

# Data Quality Sweep
sweep:
	@echo "Running data quality sweep..."
	python -m etl.data_quality.sweep --output-csv reports/quality_sweep.csv

sweep-dry:
	@echo "Running data quality sweep (dry run)..."
	python -m etl.data_quality.sweep --dry-run

# Production ETL (run jobs directly against Neon)
etl-prod-evs:
	@echo "Running EVS ETL against PRODUCTION..."
	POSTGRES_HOST=$(NEON_HOST) POSTGRES_DB=$(NEON_DB) POSTGRES_USER=$(NEON_USER) POSTGRES_PASSWORD=$(NEON_PASSWORD) \
		python -m etl.jobs.evs

etl-prod-reuters:
	@echo "Running Reuters DNR ETL against PRODUCTION..."
	POSTGRES_HOST=$(NEON_HOST) POSTGRES_DB=$(NEON_DB) POSTGRES_USER=$(NEON_USER) POSTGRES_PASSWORD=$(NEON_PASSWORD) \
		python -m etl.jobs.reuters_dnr --all-years

etl-prod-eurobarometer:
	@echo "Running Eurobarometer ETL against PRODUCTION..."
	POSTGRES_HOST=$(NEON_HOST) POSTGRES_DB=$(NEON_DB) POSTGRES_USER=$(NEON_USER) POSTGRES_PASSWORD=$(NEON_PASSWORD) \
		python -m etl.jobs.eurobarometer

etl-prod-media: etl-prod-reuters etl-prod-eurobarometer
	@echo "Production media pillar ETL complete."

# Pillar Aggregation (interpersonal, institutional, media)
aggregate-pillars:
	@echo "Aggregating all pillar scores..."
	python -m etl.pipelines.aggregate_pillars

aggregate-pillars-prod:
	@echo "Aggregating all pillar scores (PRODUCTION)..."
	POSTGRES_HOST=$(NEON_HOST) POSTGRES_DB=$(NEON_DB) POSTGRES_USER=$(NEON_USER) POSTGRES_PASSWORD=$(NEON_PASSWORD) \
		python -m etl.pipelines.aggregate_pillars

# Single pillar aggregation
aggregate-media:
	python -m etl.pipelines.aggregate_pillars --pillar media

aggregate-interpersonal:
	python -m etl.pipelines.aggregate_pillars --pillar interpersonal

aggregate-institutional:
	python -m etl.pipelines.aggregate_pillars --pillar institutional

# Sync production data to local (safe - only affects local dev)
# Includes all data tables: countries, observations, country_year, data_quality_flags, source_metadata
sync-from-prod:
	@echo "=== Syncing Neon production to local database ==="
	@echo "Prod:  $(NEON_HOST)/$(NEON_DB)"
	@echo "Local: $(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB)"
	@echo ""
	@echo "Truncating local tables..."
	@PGPASSWORD=$(POSTGRES_PASSWORD) psql -h $(POSTGRES_HOST) -p $(POSTGRES_PORT) -U $(POSTGRES_USER) -d $(POSTGRES_DB) \
		-c "TRUNCATE countries, observations, country_year, data_quality_flags, source_metadata RESTART IDENTITY CASCADE;"
	@echo "Dumping production and loading to local..."
	@PGPASSWORD=$(NEON_PASSWORD) pg_dump "postgresql://$(NEON_USER)@$(NEON_HOST)/$(NEON_DB)?sslmode=require" \
		--data-only --disable-triggers -t observations -t country_year -t countries -t data_quality_flags -t source_metadata | \
		PGPASSWORD=$(POSTGRES_PASSWORD) psql -h $(POSTGRES_HOST) -p $(POSTGRES_PORT) -U $(POSTGRES_USER) -d $(POSTGRES_DB)
	@echo "Sync complete."
	@$(MAKE) sync-verify

# Production Database Verification - checks ALL synced tables
sync-verify:
	@echo "=== Full Database Verification ==="
	@echo ""
	@echo "TABLE                LOCAL    PROD   MATCH"
	@echo "-------------------------------------------"
	@for table in countries country_year data_quality_flags observations source_metadata schema_migrations; do \
		local=$$(PGPASSWORD=$(POSTGRES_PASSWORD) psql -h $(POSTGRES_HOST) -p $(POSTGRES_PORT) -U $(POSTGRES_USER) -d $(POSTGRES_DB) -t -c "SELECT COUNT(*) FROM $$table" 2>/dev/null | tr -d ' ' || echo "N/A"); \
		prod=$$(PGPASSWORD=$(NEON_PASSWORD) psql "postgresql://$(NEON_USER)@$(NEON_HOST)/$(NEON_DB)?sslmode=require" -t -c "SELECT COUNT(*) FROM $$table" 2>/dev/null | tr -d ' ' || echo "N/A"); \
		if [ "$$local" = "$$prod" ]; then match="✓"; else match="✗"; fi; \
		printf "%-20s %6s  %6s    %s\n" "$$table" "$$local" "$$prod" "$$match"; \
	done
	@echo "-------------------------------------------"

# Help target
help:
	@echo "Trust Atlas Makefile targets:"
	@echo ""
	@echo "  Infrastructure:"
	@echo "    make up        - Start Docker services, migrate, and seed"
	@echo "    make down      - Stop Docker services"
	@echo "    make migrate   - Run database migrations"
	@echo "    make seed      - Seed database with demo data"
	@echo ""
	@echo "  Development:"
	@echo "    make api       - Start API server (port 3001)"
	@echo "    make web       - Start web server (port 3000)"
	@echo "    make install   - Install all dependencies"
	@echo ""
	@echo "  ETL Jobs (use YEAR=2024 to specify year):"
	@echo "    make etl-cpi          - Run CPI job (Transparency International)"
	@echo "    make etl-wgi          - Run WGI job (World Bank API)"
	@echo "    make etl-oecd         - Run OECD job (trust in government)"
	@echo "    make etl-wvs          - Run WVS job (requires manual download)"
	@echo "    make etl-ess          - Run ESS job (requires manual download)"
	@echo "    make etl-reuters      - Run Reuters DNR job (media trust)"
	@echo "    make etl-eurobarometer - Run Eurobarometer job (media trust)"
	@echo "    make etl-media        - Run media pillar (Reuters + Eurobarometer)"
	@echo "    make etl-gov          - Run governance pillar (CPI + WGI)"
	@echo "    make etl-all          - Run all ETL jobs"
	@echo "    make aggregate-pillars - Aggregate all pillars to country_year"
	@echo ""
	@echo "  Testing & Quality:"
	@echo "    make test      - Run all tests"
	@echo "    make lint      - Run linters"
	@echo "    make sweep     - Run data quality sweep (saves flags + CSV report)"
	@echo "    make sweep-dry - Run data quality sweep (report only, no DB writes)"
	@echo ""
	@echo "  Production ETL (runs against Neon):"
	@echo "    make etl-prod-evs          - Load EVS data to production"
	@echo "    make etl-prod-reuters      - Load Reuters DNR to production"
	@echo "    make etl-prod-eurobarometer - Load Eurobarometer to production"
	@echo "    make etl-prod-media        - Load all media sources to production"
	@echo "    make aggregate-pillars-prod - Aggregate all pillars (production)"
	@echo "    make sync-from-prod        - Pull production data to local dev"
	@echo "    make sync-verify           - Compare row counts local vs production"
	@echo ""
	@echo "  Deployment (Preview):"
	@echo "    make deploy-api  - Deploy API to Vercel (preview)"
	@echo "    make deploy-web  - Deploy web to Vercel (preview)"
	@echo "    make deploy      - Deploy both (preview)"
	@echo ""
	@echo "  Deployment (Production):"
	@echo "    make deploy-api-prod  - Deploy API to Vercel (PRODUCTION)"
	@echo "    make deploy-web-prod  - Deploy web to Vercel (PRODUCTION)"
	@echo "    make deploy-prod      - Deploy both (PRODUCTION)"

# Vercel Deployment
# Preview deploys (default) - creates preview URL for testing
# Production deploys - use deploy-api-prod / deploy-web-prod

# Preview deployments (dev)
deploy-api:
	@echo "Deploying API to Vercel (preview)..."
	@test -f api/.vercel/project.json || (echo "Error: api/.vercel/project.json not found" && exit 1)
	@cp api/.vercel/project.json .vercel/project.json
	@vercel
	@git checkout .vercel/project.json 2>/dev/null || true

deploy-web:
	@echo "Deploying web to Vercel (preview)..."
	@test -f web/.vercel/project.json || (echo "Error: web/.vercel/project.json not found" && exit 1)
	@cp web/.vercel/project.json .vercel/project.json 2>/dev/null || mkdir -p .vercel && cp web/.vercel/project.json .vercel/
	@vercel
	@rm -rf .vercel

deploy: deploy-api deploy-web
	@echo "Preview deployment complete. Test URLs above before promoting to production."

# Production deployments
deploy-api-prod:
	@echo "Deploying API to Vercel (PRODUCTION)..."
	@test -f api/.vercel/project.json || (echo "Error: api/.vercel/project.json not found" && exit 1)
	@cp api/.vercel/project.json .vercel/project.json
	@vercel --prod
	@git checkout .vercel/project.json 2>/dev/null || true

deploy-web-prod:
	@echo "Deploying web to Vercel (PRODUCTION)..."
	@test -f web/.vercel/project.json || (echo "Error: web/.vercel/project.json not found" && exit 1)
	@cp web/.vercel/project.json .vercel/project.json 2>/dev/null || mkdir -p .vercel && cp web/.vercel/project.json .vercel/
	@vercel --prod
	@rm -rf .vercel

deploy-prod: deploy-api-prod deploy-web-prod
	@echo "Production deployment complete."
