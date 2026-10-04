# ANTONIUS — Project Documentation Map

## Purpose
This file explains which document controls which part of the project.

## Files

### ANTONIUS_PRD.md
Product source of truth.

Use it for:
- features;
- user flows;
- scope;
- goals;
- MVP;
- product behavior.

### ANTONIUS_DESIGN_SYSTEM.md
Visual source of truth.

Use it for:
- colors;
- typography;
- spacing;
- borders;
- shadows;
- components;
- mobile layout;
- animations;
- visual do/don't rules.

### ANTONIUS_AI_ARCHITECTURE.md
AI behavior source of truth.

Use it for:
- vision pipeline;
- question extraction;
- routing;
- web search;
- solver;
- verification;
- source handling;
- follow-up context.

### ANTONIUS_DEVELOPMENT_GUIDE.md
Engineering-agent source of truth.

Use it for:
- milestone order;
- coding-agent behavior;
- testing;
- security;
- change discipline;
- reporting.

### ANTONIUS_FILE_MAP.md
Documentation index.

Use it to understand which document should be consulted for a given question.

## Priority
If documents conflict:
1. explicit user instruction;
2. security/safety requirements;
3. ANTONIUS_PRD.md;
4. ANTONIUS_DESIGN_SYSTEM.md;
5. ANTONIUS_AI_ARCHITECTURE.md;
6. ANTONIUS_DEVELOPMENT_GUIDE.md.

If an implementation decision is ambiguous, do not silently invent a major architecture. Ask or choose the smallest reversible solution.
