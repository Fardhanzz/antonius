# ANTONIUS — Technical Stack & Architecture

## 1. Purpose

This document defines the recommended technical foundation for Antonius.

It is intentionally optimized for:
- personal use;
- low operational complexity;
- mobile-first PWA;
- AI-assisted development with Google Antigravity;
- easy local development;
- low cost;
- ability to replace AI/search providers later.

This is a practical MVP stack, not an enterprise architecture.

---

# 2. Recommended Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js + TypeScript | PWA UI and server-capable web app |
| Styling | Tailwind CSS | Fast implementation of the design system |
| UI components | Custom Antonius components | Preserve neo-brutalist identity |
| Icons | Lucide React | Consistent interface icons |
| AI Vision + Solver | Gemini API | Image understanding and answer generation |
| Web Search | Search provider behind server-side adapter | Grounding/current information |
| Backend | Next.js Route Handlers | Keep API keys server-side and expose app APIs |
| Database | Supabase Postgres | History, sessions, sources |
| File storage | Supabase Storage | Optional question image storage |
| Validation | Zod | Validate AI/API payloads |
| PWA | Web App Manifest + Service Worker | Installable mobile app experience |
| Deployment | Vercel | Simple deployment for Next.js |
| Version control | Git + GitHub | Source history and rollback |
| Package manager | npm | Simple default for a beginner-friendly project |

---

# 3. Why Next.js?

Next.js is recommended because Antonius is not only a static UI.

It needs:
- frontend pages;
- server-side API calls;
- secure secret handling;
- image processing/upload routes;
- AI integrations;
- search integrations;
- database access.

A single Next.js project can contain both the UI and server-side Route Handlers.

This reduces the number of separate services the personal project needs to understand.

Recommended architecture:

```text
Mobile Browser / PWA
        |
        v
     Next.js
   /         \
 UI           Route Handlers
              |
      +-------+--------+
      |       |        |
    Gemini  Search   Supabase
```

---

# 4. Why TypeScript?

TypeScript is required for the project.

Reasons:
- catches many mistakes before runtime;
- makes AI response structures easier to validate;
- improves autocomplete;
- makes component contracts clearer;
- helps an AI coding agent understand the codebase.

Avoid writing the main application in plain JavaScript.

---

# 5. Tailwind CSS

Tailwind is recommended for implementation speed.

However, Antonius must NOT become a generic Tailwind-looking application.

Tailwind is only the implementation mechanism.

The visual identity comes from:

`ANTONIUS_DESIGN_SYSTEM.md`

Create reusable design tokens/components rather than scattering arbitrary values everywhere.

Example concept:

```text
Button
Card
Badge
PageHeader
ScanButton
SourceCard
AnswerCard
ProgressChecklist
```

These components should implement the Antonius design language consistently.

---

# 6. UI Architecture

Use a component-driven structure.

Recommended:

```text
src/
├── app/
│   ├── page.tsx
│   ├── scan/
│   ├── solve/
│   ├── history/
│   ├── session/
│   ├── settings/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── scanner/
│   ├── answer/
│   ├── sources/
│   └── chat/
│
├── features/
│   ├── scanner/
│   ├── ai/
│   ├── solver/
│   ├── search/
│   ├── history/
│   └── sessions/
│
├── lib/
│   ├── ai/
│   ├── search/
│   ├── supabase/
│   ├── validation/
│   └── utils/
│
└── types/
```

Do not create hundreds of files prematurely.

Start small and grow the structure as features are implemented.

---

# 7. AI Provider — Gemini

Gemini is the recommended initial AI provider because Antonius needs multimodal input.

The initial AI layer should support:

```text
Image
  ↓
Vision understanding
  ↓
Structured question
  ↓
Solver
```

Keep provider-specific code isolated.

Recommended abstraction:

```text
VisionService
SolverService
```

The rest of the application should not depend directly on Gemini SDK calls.

For example:

```text
UI
 ↓
AI service
 ↓
Gemini adapter
 ↓
Gemini API
```

This makes it possible to change providers later.

---

# 8. AI Response Validation

Never blindly trust raw model output.

Use Zod schemas.

Example conceptual structure:

```ts
const QuestionSchema = z.object({
  subject: z.string(),
  topic: z.string().nullable(),
  question: z.string(),
  confidence: z.number().min(0).max(1),
  needsWebSearch: z.boolean()
});
```

The exact schema may evolve.

The important principle is:

```text
AI output
   ↓
Validate
   ↓
Normalize
   ↓
Application
```

not:

```text
AI output
   ↓
Directly render everything
```

---

# 9. Web Search Architecture

Do not tightly couple Antonius to one search provider.

Create:

```text
SearchService
      ↓
SearchProvider
```

The UI should receive normalized results:

```ts
type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
};
```

The provider can later be changed without rewriting the answer screen.

## Search rule

Do not search the web for every question.

Search when:
- information is current;
- external facts are required;
- the user explicitly asks for sources;
- a reliable reference materially improves the answer.

---

# 10. Database — Supabase

Supabase Postgres is recommended for MVP persistence.

Primary tables:

```text
questions
sessions
sources
```

Potential future table:

```text
chat_messages
```

Because this is a personal app, authentication can initially be avoided if the app is only used privately.

If authentication becomes necessary later, Supabase Auth can be introduced.

---

# 11. Image Storage

Two modes are possible.

### Mode A — Temporary processing

```text
Camera
 ↓
Frontend
 ↓
Server
 ↓
Gemini
 ↓
Discard image
```

Best for privacy and simplicity if persistent image history is not needed.

### Mode B — Persistent history

```text
Camera
 ↓
Storage
 ↓
Database reference
 ↓
Gemini
```

Use Supabase Storage if the user wants to reopen original images from history.

MVP recommendation:

Start with temporary processing unless image persistence is explicitly needed.

---

# 12. API Key Security

Never expose:

```text
GEMINI_API_KEY
SEARCH_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

to browser/client code.

Correct:

```text
Browser
   ↓
/api/solve
   ↓
Server
   ↓
Gemini
```

Incorrect:

```text
Browser
   ↓
Gemini API directly
```

All secrets belong in environment variables.

---

# 13. Environment Variables

Create:

```text
.env.example
```

Example categories:

```env
GEMINI_API_KEY=

SEARCH_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

Only variables explicitly required by client-side SDK initialization may use `NEXT_PUBLIC_`.

Never put private server secrets behind `NEXT_PUBLIC_`.

---

# 14. PWA Architecture

Antonius should be installable from a mobile browser.

Required:

```text
manifest.webmanifest
icons/
service worker
```

Manifest should define:

- name: Antonius
- short name: Antonius
- start URL
- standalone display
- theme color
- background color
- icons
- maskable icon where supported

Mobile viewport must support:

```css
viewport-fit=cover
```

and safe-area CSS:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

---

# 15. Offline Strategy

Do not pretend the AI works offline.

Offline support should focus on:

- app shell;
- static assets;
- previously cached UI resources;
- graceful offline messaging.

When offline:

```text
You are offline.

Scanning and AI solving need an internet connection.
```

History that has already been cached may remain readable depending on implementation.

---

# 16. Camera

Use browser camera APIs first.

Expected mechanism:

```text
navigator.mediaDevices.getUserMedia()
```

Requirements:
- mobile rear camera preference;
- permission handling;
- capture frame;
- retake;
- gallery fallback;
- graceful unsupported-browser message.

Do not require a native Android/iOS app for MVP.

---

# 17. Image Processing

Before sending a large image to AI:

1. validate type;
2. check size;
3. optionally resize;
4. preserve enough quality for text;
5. compress when appropriate.

Avoid aggressive compression that makes equations unreadable.

A practical initial limit can be established during implementation and adjusted after testing on the target phone.

---

# 18. Math and Calculation Tools

AI should not be the only calculation mechanism.

For mathematical tasks, consider adding a deterministic calculation/verification layer later.

Architecture:

```text
Question
   ↓
AI identifies calculation
   ↓
Calculator / symbolic verifier
   ↓
AI explanation
```

The AI remains responsible for explaining the result.

The deterministic tool helps catch arithmetic mistakes.

This is a P1/P2 enhancement, not a blocker for the first MVP.

---

# 19. Verification Architecture

Verification should be independent from answer presentation.

```text
Solver
  ↓
Candidate Answer
  ↓
Verifier
  ↓
Verified / Needs Review
  ↓
Answer UI
```

Possible verification:
- arithmetic recomputation;
- equation substitution;
- unit checking;
- chemistry balancing;
- source comparison.

Do not display “Verified” unless a meaningful verification actually happened.

---

# 20. Error Handling

Every external dependency needs a failure path.

Dependencies:
- Gemini;
- search provider;
- Supabase;
- camera;
- network.

Never expose raw stack traces to the user.

Instead:

```text
Waduh, Antonius gagal memproses soal.

[ Coba Lagi ]
```

Developer logs may contain technical details.

---

# 21. State Management

Do not introduce a global state library immediately.

Start with:
- React state;
- URL state where appropriate;
- server state/API responses;
- localStorage/IndexedDB for small client-side persistence where useful.

Only add a dedicated state library if actual complexity requires it.

This keeps the project easier for an AI coding agent to maintain.

---

# 22. Data Flow

## Scan

```text
Camera
 ↓
Image File
 ↓
Preview
 ↓
POST /api/analyze
 ↓
Vision Service
 ↓
Structured Question
 ↓
Confirmation UI
```

## Solve

```text
Confirmed Question
 ↓
POST /api/solve
 ↓
Router
 ├── SearchService (if needed)
 ├── SolverService
 └── VerificationService
 ↓
Structured Answer
 ↓
Answer UI
```

## Follow-up

```text
Question Context
+
Conversation
+
User Message
 ↓
POST /api/chat
 ↓
AI
 ↓
Response
```

---

# 23. API Route Concept

Suggested initial routes:

```text
POST /api/analyze
POST /api/solve
POST /api/chat
POST /api/search
GET  /api/history
POST /api/history
DELETE /api/history/:id
```

Some routes may be merged if implementation remains simpler.

Do not create APIs merely because this document lists them. Use the smallest practical API surface.

---

# 24. Deployment

Recommended initial deployment:

```text
GitHub
   ↓
Vercel
   ↓
Antonius PWA
```

Environment variables are configured in the deployment platform.

For personal testing, local development remains the primary development environment.

---

# 25. Local Development

Recommended commands will depend on the generated project, but the expected workflow is:

```text
Install dependencies
↓
Create .env.local
↓
Run development server
↓
Open on desktop
↓
Test on phone using local network/tunnel when needed
```

The AI coding agent should document the exact commands after project initialization.

---

# 26. Testing Strategy

MVP testing priority:

### Manual mobile tests
- camera permission;
- capture;
- upload;
- blurry image;
- clear image;
- AI success;
- AI failure;
- search success;
- search failure;
- follow-up chat;
- history;
- PWA installation.

### Automated tests
Start with:
- utility functions;
- schema validation;
- AI response normalization;
- routing logic.

Do not spend excessive effort on end-to-end testing before the core product works.

---

# 27. Performance

Priorities:
1. fast initial UI;
2. fast camera opening;
3. compressed/appropriate image payloads;
4. streaming or progressive AI response where practical;
5. avoid unnecessary re-renders;
6. avoid sending duplicate requests.

AI latency is inherently variable, so provide immediate progress feedback.

---

# 28. Cost Strategy

Because Antonius is personal-use:

- avoid unnecessary API calls;
- resize images;
- do not search every question;
- cache reusable data;
- keep prompts focused;
- avoid resending unnecessary conversation history;
- use inexpensive models where quality is sufficient.

Do not optimize prematurely before real usage reveals the expensive path.

---

# 29. Accessibility

Technical implementation must support:
- keyboard navigation where applicable;
- semantic buttons;
- accessible labels;
- sufficient contrast;
- reduced-motion preference;
- screen-reader-friendly status messages.

The visual neo-brutalism must not become an accessibility excuse.

---

# 30. Browser Priority

Primary:
- Chrome Android.

Secondary:
- Safari iOS;
- modern Chromium browsers.

The app should degrade gracefully if a browser lacks a particular feature.

---

# 31. Architecture Principles

### Principle 1 — Simple first
Prefer fewer services.

### Principle 2 — Provider abstraction
Keep Gemini/search/database adapters isolated.

### Principle 3 — Server secrets
Never expose private API keys.

### Principle 4 — Structured AI
Validate model output.

### Principle 5 — Mobile first
Desktop is secondary.

### Principle 6 — Reversible decisions
Avoid architecture that is difficult to change.

### Principle 7 — Personal project
Do not build enterprise complexity without a real need.

---

# 32. Initial Technology Decision

For the first implementation, use:

```text
Next.js
TypeScript
Tailwind CSS
Custom React components
Lucide React
Gemini API
Search provider via SearchService abstraction
Supabase
Vercel
Git/GitHub
npm
```

If Antigravity discovers a concrete environment constraint that makes one of these choices impractical, it should report the constraint before replacing the technology.

Do not switch stacks casually.

---

# 33. Relationship to Other Documents

This file defines technology and architecture.

It does not override:
- product requirements in `ANTONIUS_PRD.md`;
- visual rules in `ANTONIUS_DESIGN_SYSTEM.md`;
- AI behavior in `ANTONIUS_AI_ARCHITECTURE.md`.

Engineering execution follows `ANTONIUS_DEVELOPMENT_GUIDE.md`.
