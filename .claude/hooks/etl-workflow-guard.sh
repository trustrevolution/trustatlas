#!/bin/bash
# Enforces local-first ETL workflow
# Blocks direct ETL commands targeting production database

set -e

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Only intercept ETL commands
if [[ "$command" != *"python -m etl.jobs"* ]] && \
   [[ "$command" != *"python -m etl.pipelines"* ]]; then
  exit 0
fi

# Block if command sets NEON/production env vars inline
if [[ "$command" =~ NEON_ ]] || \
   [[ "$command" =~ "neon" ]] || \
   [[ "$command" =~ "ep-dark-truth" ]]; then
  cat >&2 << 'EOF'

ETL WORKFLOW VIOLATION
======================
Direct ETL to production is blocked.

Follow the documented workflow:
  1. Run ETL locally:     python -m etl.jobs.<source>
  2. Verify data:         make sweep-dry
  3. Sync to production:  make sync-to-prod

See: docs/DATA_WORKFLOW.md
EOF
  exit 2
fi

# Check current POSTGRES_HOST env var
if [[ "${POSTGRES_HOST:-localhost}" == *"neon"* ]] || \
   [[ "${POSTGRES_HOST:-localhost}" == *"aws"* ]]; then
  cat >&2 << 'EOF'

ETL WORKFLOW VIOLATION
======================
POSTGRES_HOST is set to production!

Reset to local before running ETL:
  export POSTGRES_HOST=localhost

Or follow the full workflow:
  1. Run ETL locally:     python -m etl.jobs.<source>
  2. Verify data:         make sweep-dry
  3. Sync to production:  make sync-to-prod

See: docs/DATA_WORKFLOW.md
EOF
  exit 2
fi

# Allowed - remind about workflow
echo "ETL targeting LOCAL database. Remember: make sync-to-prod after verification." >&2
exit 0
