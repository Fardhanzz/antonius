# ANTONIUS — AI Architecture

## 1. Objective
Build a reliable pipeline that converts an image of a homework question into:
- structured question data;
- an answer;
- an explanation;
- verification where appropriate;
- web sources when needed;
- follow-up conversational context.

## 2. Pipeline

Image
→ Vision Analysis
→ Question Structuring
→ Intent/Subject Classification
→ Tool Routing
→ Solver
→ Verification
→ Response Formatting
→ UI

## 3. Vision Output
Prefer structured JSON.

Example:
{
  "subject": "mathematics",
  "topic": "quadratic equations",
  "question": "Solve 2x² - 5x - 3 = 0",
  "needs_web_search": false,
  "confidence": 0.96
}

If confidence is low, ask the user to confirm or retake the image.

## 4. Router
Determine whether the task needs:
- AI reasoning;
- web search;
- calculator;
- symbolic/math verification;
- multiple tools.

Do not call web search by default.

## 5. Web Search Rules
Use web search when:
- the user explicitly asks for sources;
- information is current or time-sensitive;
- the question depends on external facts;
- a reliable reference materially improves the answer.

Avoid web search for simple self-contained calculations unless a source is explicitly requested.

## 6. Solver
The solver should produce structured output:
{
  "answer": "...",
  "steps": ["...", "..."],
  "explanation": "...",
  "confidence": 0.0
}

Never rely on a single unverified guess for calculations.

## 7. Verification
Examples:
- equations: substitute answer;
- arithmetic: recompute;
- factual answers: compare against retrieved sources;
- chemistry: check balancing where practical;
- physics: check units and dimensional consistency where practical.

If verification fails, re-solve or transparently report uncertainty.

## 8. Sources
When web search is used, source metadata should include:
{
  "title": "...",
  "url": "...",
  "snippet": "..."
}

Only display URLs returned by the search layer.

## 9. Follow-up Context
A follow-up chat should retain:
- original image/question;
- extracted structured question;
- previous answer;
- relevant source context;
- conversation messages.

Do not require the user to upload the image again.

## 10. Error States
Image unclear:
Ask for retake.

Question ambiguous:
Ask for confirmation.

Search unavailable:
Explain that web lookup failed and offer an answer based on available knowledge only, where appropriate.

AI failure:
Offer retry without exposing internal stack traces.

## 11. Prompting Principles
System prompts should emphasize:
- accuracy;
- explicit reasoning steps in the user-visible answer;
- uncertainty when appropriate;
- no invented citations;
- respect for extracted question;
- concise but educational explanations.

Do not expose hidden chain-of-thought. User-visible reasoning should be a concise explanation of the solution steps.

## 12. Security
All external AI/search secrets stay server-side.
Never ship API keys in browser bundles.

## 13. Model Abstraction
Keep provider-specific code behind a service interface.

Example:
VisionService
SolverService
SearchService
VerificationService

This allows providers to be changed later without rewriting the UI.

## 14. Cost Control
For personal use:
- resize/compress images before upload where quality permits;
- avoid duplicate AI calls;
- only search when needed;
- cache reusable source/results where safe;
- avoid sending unnecessarily large conversation history.

## 15. Reliability Principle
Prefer:
“I'm not confident; please confirm the question”
over confidently returning a wrong solution.
