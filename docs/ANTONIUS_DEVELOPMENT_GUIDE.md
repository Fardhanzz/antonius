# ANTONIUS — Development Guide for AI Coding Agents

## 1. Role
You are the engineering agent responsible for implementing Antonius according to:
- ANTONIUS_PRD.md
- ANTONIUS_DESIGN_SYSTEM.md
- ANTONIUS_AI_ARCHITECTURE.md

These documents are the source of truth.

## 2. Golden Rule
Do not build the entire application in one step.

Implement one milestone at a time.

After each milestone:
1. run/build the project;
2. test the affected flow;
3. verify existing functionality still works;
4. summarize changes;
5. identify known issues.

## 3. Do Not
- rewrite unrelated working code;
- change the visual language without instruction;
- introduce unnecessary dependencies;
- expose secrets;
- fabricate API behavior;
- create fake production integrations and silently present them as real;
- remove working features to make a new feature easier.

## 4. Before Coding
Inspect:
- current project structure;
- package manager;
- framework;
- existing components;
- environment configuration;
- current routes.

Reuse existing infrastructure where reasonable.

## 5. Milestone Order

### M1 — Foundation
- project setup;
- PWA configuration;
- design tokens;
- global typography;
- navigation;
- Home.

### M2 — Scanner
- camera;
- gallery upload;
- preview;
- retake;
- crop/rotate where practical.

### M3 — AI Vision
- image upload to backend;
- vision model integration;
- question extraction;
- subject/topic detection;
- confirmation UI.

### M4 — Solver
- structured solver response;
- answer UI;
- step-by-step explanation;
- error states.

### M5 — Chat
- follow-up conversation;
- preserve question context.

### M6 — Web Grounding
- search routing;
- source cards;
- citations;
- source failure handling.

### M7 — History
- save;
- list;
- detail;
- delete/clear.

### M8 — Homework Session
- create session;
- question progress;
- scan next;
- review.

### M9 — Polish
- animations;
- accessibility;
- performance;
- PWA install UX;
- icons;
- offline app shell.

## 6. Definition of Done
A milestone is not complete merely because the code compiles.

It must:
- work on mobile viewport;
- have loading/error/empty states where relevant;
- follow the design system;
- avoid console errors;
- preserve previous functionality.

## 7. Testing
At minimum test:
- happy path;
- invalid image;
- failed API;
- slow API;
- empty state;
- mobile layout;
- installable PWA behavior where available.

## 8. UI Consistency
Before creating a new component, check whether an existing component can be reused.

If a new pattern is needed, add it to the design system rather than creating an isolated style.

## 9. Environment Variables
Never hard-code secrets.

Use environment variables and document required variables in `.env.example`.

## 10. Git
Use small, descriptive commits when Git is available.

Examples:
- `feat: add mobile home screen`
- `feat: add camera capture flow`
- `feat: integrate vision analysis`
- `fix: handle unclear scan`
- `style: refine neo-brutalist cards`

## 11. Agent Reporting Format
After each task report:

### Implemented
- ...

### Tested
- ...

### Files changed
- ...

### Known issues
- ...

### Next recommended milestone
- ...

## 12. Product Personality
Keep UI microcopy in Indonesian unless explicitly instructed otherwise.

Tone:
- casual;
- concise;
- playful;
- clear.

Never make the UI childish to the point of reducing usability.
