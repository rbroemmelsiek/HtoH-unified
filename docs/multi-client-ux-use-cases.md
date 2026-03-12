# Multi-Client Service Plan UX Use Cases

## 1) Voice-first contact plan summon

**User phrase**
- "Open Alice Freeman's Service Plan."

**Expected UX**
- Transcript appears in chat input.
- System resolves contact name from Contacts Directory.
- If one exact match, opens Plan widget in under 500ms perceived latency.
- Assistant confirms action in chat with concise status text.

**Implementation details**
- Deterministic parser in `frontend/src/App.tsx` (`handleSendMessage`) runs before LLM routing.
- Contact lookup reads from shared contact directory storage (`frontend/src/services/contactDirectory.ts`).
- Plan context opens with `{ planId, ownerId }` resolved from contact link metadata.
- Fallback path opens current user profile plan if no explicit contact is provided.

## 2) Ambiguous name disambiguation

**User phrase**
- "Open John's service plan."

**Expected UX**
- System does not guess incorrectly.
- Assistant asks for clarification and returns top matches.
- User can respond with full name in a follow-up utterance.

**Implementation details**
- Name matcher returns multiple candidates; UI response lists up to 3.
- No widget opens until unique match is confirmed.

## 3) Missing contact handling

**User phrase**
- "Open Maria's service plan."

**Expected UX**
- Assistant reports contact not found.
- Offers next step: open Contacts Directory or provide exact name.
- Avoids generic "error" language.

**Implementation details**
- Intent parser checks contact directory and branches to explicit "not found" response.
- Response keeps user in-flow without breaking chat state.

## 4) Contact detail to plan action

**User action**
- In Contacts detail panel, click "Open Service Plan".

**Expected UX**
- Opens linked plan if available.
- If not linked, opens current profile plan.
- Preserves current app context and avoids page reload.

**Implementation details**
- Contacts widget dispatches `open-contact-plan` event with contact payload.
- `App.tsx` listens and routes to `handleExpandWidget('plan', data)`.

## 5) Create + link plan from contact

**User action**
- In contact detail, click "Create + Link Plan".

**Expected UX**
- New plan created with contact name convention.
- Contact now stores linked plan metadata.
- New plan opens immediately.

**Implementation details**
- Uses `planGateway.createPlan(uid, "<Contact> Service Plan")`.
- Updates contact directory record (`linkedPlanId`, `linkedOwnerId='self'`).
- Persists updates to local storage.

## High UX quality standards

- **Fast path first:** deterministic command routing for critical actions before LLM.
- **No silent failures:** every action returns visible confirmation/error guidance.
- **No wrong entity opens:** disambiguate on multiple matches instead of guessing.
- **Progressive disclosure:** advanced linking controls live in contact detail, not main chat stream.
- **Voice parity:** speech transcript and typed input share identical command parser.
- **Ownership safety:** resolve plan access through `ownerId` + `planId` context together.
