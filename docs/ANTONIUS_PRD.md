# ANTONIUS — Product Requirements Document

## 1. Product
Antonius is a personal, mobile-first PWA AI Homework Assistant.

Core flow:
Camera/Upload → Vision AI → Question Confirmation → Solve → Verify → Answer → Sources → Follow-up Chat → History.

## 2. Vision
Turn a physical homework question into a clear, understandable solution with as little friction as possible.

## 3. Target User
Primary user: the owner of this personal project.

Primary use case:
A student receives many homework questions with limited time and wants to scan questions from books or worksheets instead of typing them manually.

## 4. Goals
- Scan a question using the phone camera.
- Upload an image from the gallery.
- Understand printed text, equations, tables, diagrams, and reasonably clear handwriting.
- Detect subject/topic.
- Solve and explain the problem.
- Use web search only when external/current information is needed.
- Show sources for web-grounded answers.
- Support follow-up questions while preserving context.
- Save useful history.
- Support multi-question Homework Sessions.
- Install and run as a standalone PWA.

## 5. Non-goals for MVP
- Payments/subscriptions.
- Social features.
- Teacher dashboards.
- School management.
- Enterprise architecture.
- Complex analytics.
- Multi-user collaboration.
- Excessive gamification.

## 6. Core Screens
1. Home
2. Scanner
3. Image Preview
4. AI Analysis
5. Question Confirmation
6. Answer
7. Sources
8. Follow-up Chat
9. History
10. Homework Session
11. Settings

## 7. Primary User Journey
1. Open Antonius.
2. Tap Scan Soal.
3. Capture image.
4. Review image.
5. AI analyzes it.
6. User confirms extracted question.
7. AI routes the task.
8. AI solves it.
9. Verification runs where appropriate.
10. Answer and explanation appear.
11. Sources appear when web search was used.
12. User can ask follow-up questions.
13. Question is optionally saved to history.

## 8. Answer Modes
- Direct: answer + steps.
- Tutor: concept + step-by-step explanation.
- Hint: guidance without immediately revealing the final answer.

Default: Tutor.

## 9. AI Routing
The system should determine whether a task needs:
- normal reasoning,
- web search,
- calculation,
- verification,
- or a combination.

Do not search the web for every question.

## 10. Web Grounding
When web search is used:
- use actual search results;
- select relevant sources;
- display source title and link;
- never invent URLs;
- distinguish source facts from AI reasoning.

## 11. Verification
Where practical, verify calculations or logical consistency before presenting the answer.

Example:
For an equation solution, substitute the result back into the original equation.

## 12. Homework Session
A user can create a session such as:
- Subject: Mathematics
- Chapter: Quadratic Equations
- Target: 20 questions

The session tracks progress and provides a Scan Next Question action.

## 13. History
Store, when enabled:
- original image;
- extracted question;
- subject;
- topic;
- answer;
- explanation;
- sources;
- timestamp;
- session ID.

## 14. PWA
Requirements:
- installable manifest;
- standalone display;
- app icons;
- splash/background configuration;
- service worker/app-shell caching;
- mobile-first responsive layout;
- safe-area support.

AI solving still requires network access.

## 15. Privacy and Security
- Do not expose API keys in client code.
- Use server-side API routes for external AI/search services.
- Store only data needed by the app.
- Provide a way to clear history.
- Avoid unnecessary analytics for the personal MVP.

## 16. MVP Definition of Done
A user can:
1. install/open Antonius as a PWA;
2. scan a homework question;
3. preview and retake the image;
4. have AI understand the question;
5. confirm/edit extracted text;
6. receive an answer and explanation;
7. ask a follow-up question;
8. see sources when web search is used;
9. save/reopen the result from history.

## 17. Development Principles
- Mobile-first.
- Camera-first.
- One-handed interaction.
- Minimal screens.
- Explain answers, not only output them.
- Clear loading/error states.
- Keep personality playful without sacrificing clarity.
- Build one milestone at a time.
- Do not rewrite unrelated working features.

## 18. Brand Personality
Antonius is:
- smart;
- quick;
- playful;
- slightly absurd;
- confident;
- informal but clear.

Example microcopy:
- Loading: “Antonius lagi mikir...”
- Success: “Nah. Ketemu jawabannya.”
- Bad image: “Waduh, ini fotonya bikin Antonius merem. Coba foto lagi.”
- Hard problem: “Ini soal lumayan barbar. Kita bedah pelan-pelan.”
