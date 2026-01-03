---
allowed-tools: Bash(docker compose:*), Bash(make:*), Bash(fuser:*), Bash(kill:*), Bash(lsof:*)
description: Start all dev servers (Docker, API, Web)
---

## Your task

Start the full development environment for Trust Atlas:

1. **Kill any existing servers** on ports 3000, 3001, 3002 (silently, don't fail if none)
2. **Start Docker services** with `docker compose up -d`
3. **Start API server** in background with `make api` (runs on port 3001)
4. **Start Web server** in background with `make web` (runs on port 3000)

Run the servers in the background so the user can continue working. Report which services started successfully.

Working directory: /home/shawn/Work/trustrevolution/trustatlas
