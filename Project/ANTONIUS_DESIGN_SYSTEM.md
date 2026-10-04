# ANTONIUS — Design System

## 1. Design Direction
Style: Playful Neo-Brutalism.

The interface should feel:
- bold;
- physical;
- playful;
- memorable;
- highly readable;
- intentionally imperfect in decoration but precise in usability.

Do not turn every element into a different color. Structure comes first.

## 2. Visual Hierarchy
Primary identity:
1. Cream canvas
2. Black structure/ink
3. Red primary action
4. Yellow/blue/green/purple accents

Black outlines and hard shadows define the UI.

## 3. Color Tokens

### Base
--color-canvas: #FFF7F2
--color-surface: #FFFFFF
--color-ink: #111111
--color-muted: #6F6A67

### Primary
--color-red: #D94336
--color-red-dark: #B83228

### Accents
--color-yellow: #FFD447
--color-blue: #70C5E8
--color-green: #A8E063
--color-purple: #A98BE8

### Semantic
--color-success: #2E9B68
--color-warning: #C79500
--color-error: #C7372F
--color-info: #3B82A8

Use semantic colors sparingly.

## 4. Typography
Preferred:
- Inter, Geist, or system sans-serif.
- Use a bold/extra-bold weight for major headings.
- Use regular/medium weight for body copy.

Suggested scale:
- Display: 32–40px, 800–900
- H1: 28–32px, 800
- H2: 22–26px, 800
- H3: 18–20px, 750
- Body: 15–17px, 400–500
- Caption: 12–14px, 500
- Button: 14–16px, 750–800

Do not use tiny body text for important information.

## 5. Borders
Default component border:
3px solid var(--color-ink)

High-emphasis hero/button border:
4px solid var(--color-ink)

Avoid hairline borders.

## 6. Hard Shadows
Default:
5px 5px 0 var(--color-ink)

Large card:
7px 7px 0 var(--color-ink)

Small component:
3px 3px 0 var(--color-ink)

No soft drop shadows on primary neo-brutalist components.

## 7. Radius
- Small: 10px
- Default: 14–16px
- Large: 20px
- Hero: 24px

Corners should remain rounded enough for mobile comfort without becoming pill-shaped everywhere.

## 8. Spacing
Use an 8px base rhythm:
8, 12, 16, 20, 24, 32, 40, 48.

Mobile page horizontal padding:
16–20px.

Section gap:
24–32px.

## 9. Touch Targets
Minimum interactive target:
44×44px.

Primary actions:
48–56px minimum height.

Avoid tightly packed controls.

## 10. Buttons

### Primary
- Red background
- Black border
- Black hard shadow
- Bold black/white text depending on contrast
- Slight press movement

### Secondary
- White/cream background
- Black border
- Hard shadow

### Ghost
- Transparent
- No large shadow
- Used only for low-priority actions

Pressed behavior:
- translate approximately 3–5px toward the shadow;
- reduce shadow by the same amount.

## 11. Cards
Default card:
- white or accent background;
- 3px black border;
- 5–7px hard shadow;
- 14–20px radius;
- 16–20px internal padding.

Do not overuse cards. A card should communicate grouping or importance.

## 12. Badges
Use compact, bold badges for:
- subject;
- topic;
- status;
- source type.

Example:
MATEMATIKA
VERIFIED
WEB SOURCE

## 13. Home Screen
Primary CTA must be visually dominant:

SCAN SOAL

Secondary:
- Upload from Gallery
- Ask AI

Recent questions appear below.

Do not make Home look like a corporate dashboard.

## 14. Scanner
Camera should occupy most of the viewport.

Controls:
- close/back;
- flash;
- gallery;
- capture.

Capture button should be large and thumb-friendly.

Avoid unnecessary UI over the camera.

## 15. Image Preview
Actions:
- Retake
- Crop
- Rotate
- Solve

“Solve” is the primary action.

## 16. AI Analysis
Use a progress checklist rather than a generic spinner.

Example:
✓ Membaca gambar
✓ Mengenali soal
● Memahami pertanyaan
○ Menentukan metode
○ Menyusun jawaban

## 17. Question Confirmation
Show:
- extracted question;
- subject;
- topic;
- edit action;
- continue action.

This screen exists to catch OCR/vision mistakes before solving.

## 18. Answer Screen
Order:
1. Question
2. Big answer
3. Step-by-step explanation
4. Verification
5. Sources
6. Follow-up chat CTA

The final answer must visually dominate.

## 19. Sources
Use compact source cards.

Show:
- source name;
- useful short description;
- external-link affordance.

Never fabricate sources.

## 20. Chat
Chat should preserve the current problem context.

Input should be fixed near the bottom and respect mobile safe areas.

## 21. History
Keep it list-based rather than dashboard-heavy.

Each item:
- subject;
- topic/title;
- timestamp;
- optional thumbnail;
- chevron/open affordance.

## 22. Homework Session
Progress should be visually obvious:
“12 / 20 selesai”

Use a question grid/list and a large “SCAN NEXT QUESTION” CTA.

## 23. Settings
Keep it compact:
- AI model/preferences;
- answer style;
- theme;
- history/data;
- about.

## 24. Motion
Motion should be quick and functional:
- button press;
- card entrance;
- progress transitions;
- small success animation.

Avoid long animations.

Suggested timing:
- micro interaction: 100–160ms
- normal transition: 180–250ms
- larger entrance: 250–350ms

## 25. Decorative Language
Allowed:
- dots;
- comic bursts;
- small offset shapes;
- stickers;
- underlines;
- hand-drawn-like accents.

Decorations must never obscure text or controls.

## 26. Mobile/PWA Rules
- Design at mobile widths first.
- Respect env(safe-area-inset-top/bottom).
- Bottom navigation must remain thumb accessible.
- Camera screen can use edge-to-edge layout.
- Avoid hover-only interactions.
- Use `100dvh` rather than relying only on `100vh`.

## 27. Accessibility
- Maintain strong text contrast.
- Do not communicate status by color alone.
- Buttons need accessible labels.
- Camera controls need text/ARIA labels where appropriate.
- Respect reduced-motion preferences.

## 28. Do / Don't

DO:
- bold hierarchy;
- thick borders;
- hard shadows;
- restrained accent colors;
- large touch targets;
- playful microcopy.

DON'T:
- use glassmorphism;
- use soft SaaS gradients everywhere;
- use excessive blur shadows;
- make every card a different color;
- create tiny controls;
- sacrifice readability for visual gimmicks.
