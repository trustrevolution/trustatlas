<!--
LOG DECISIONS WHEN:
- Choosing between architectural approaches
- Selecting libraries or tools
- Making security-related choices
- Deviating from standard patterns

This is append-only. Never delete entries.
-->

# Decision Log

Track key architectural and implementation decisions.

## Format
```
## [YYYY-MM-DD] Decision Title

**Decision**: What was decided
**Context**: Why this decision was needed
**Options Considered**: What alternatives existed
**Choice**: Which option was chosen
**Reasoning**: Why this choice was made
**Trade-offs**: What we gave up
**References**: Related code/docs
```

---

## [2025-01-29] Claude Skills Installation

**Decision**: Install 10 skills for Claude Code assistance
**Context**: Project had CLAUDE.md but no skills directory
**Options Considered**: Skills-only, skills+session, full setup
**Choice**: Full setup with session management
**Reasoning**: Established codebase benefits from structured session tracking
**Trade-offs**: Additional files to maintain
**References**: .claude/skills/, _project_specs/
