# Tasks: Coze Subagent Tool Integration

**Input**: Design documents from `/specs/006-coze-subagent/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/agent-tool.md`, `quickstart.md`

**Tests**: No new automated tests required by spec/constitution. Validation is done via quickstart flow plus `npx tsc --noEmit` and `npm run lint`.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes exact file path(s)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare dependencies and feature files before story work.

- [x] T001 Add Coze SDK dependency `@coze/api` in `package.json`
- [x] T002 [P] Add Coze runtime env examples in `.env.example` (token, bot_id, optional base URL)
- [x] T003 [P] Create Coze helper module scaffold in `lib/agent/coze-client.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared plumbing required by all user stories.

**⚠️ CRITICAL**: No user story implementation should start before this phase is complete.

- [x] T004 Define Coze request/response normalization helpers in `lib/agent/coze-client.ts` (stream reader + final text aggregator)
- [x] T005 Implement shared error-message mapping in `lib/agent/coze-client.ts` for auth/network/timeout failures
- [x] T006 Wire abort-aware call signature (accept `AbortSignal`) in `lib/agent/coze-client.ts` and export for tool usage
- [x] T007 Add/adjust tool naming constants for knowledge tool display in `components/agent/tool-call-card.tsx` to match renamed tool contract

**Checkpoint**: Coze client and naming foundation are ready; user stories can now proceed.

---

## Phase 3: User Story 1 - Get Professional Knowledge Answer (Priority: P1) 🎯 MVP

**Goal**: Replace mock knowledge tool with real Coze answer retrieval and return final answer text.

**Independent Test**: Ask a standards question in `/mobile/assistant` and verify answer is real content (not `mock success`).

### Implementation for User Story 1

- [x] T008 [US1] Replace mock `knowledgeQuery` implementation with renamed Coze-backed tool in `lib/agent/tools.ts`
- [x] T009 [US1] Update tool schema/description routing text for construction knowledge intent in `lib/agent/tools.ts`
- [x] T010 [US1] Pass authenticated user id context into Coze tool call path in `lib/agent/tools.ts` (aligned with `app/api/agent/route.ts` thread identity)
- [x] T011 [US1] Ensure `lib/agent/index.ts` still registers renamed knowledge tool through `allTools`

**Checkpoint**: US1 works end-to-end with real knowledge answer output.

---

## Phase 4: User Story 2 - Hide Subagent Intermediate Events (Priority: P2)

**Goal**: Prevent any Coze intermediate stream/state payload from entering main agent state or frontend display.

**Independent Test**: Trigger knowledge query and verify only tool running/done + final answer are visible.

### Implementation for User Story 2

- [x] T012 [US2] Enforce final-answer-only extraction from Coze stream in `lib/agent/coze-client.ts` (drop all intermediate events)
- [x] T013 [US2] Ensure tool return type remains plain string final answer in `lib/agent/tools.ts` (no structured intermediate payload)
- [x] T014 [US2] Update tool label mapping to renamed tool key in `components/agent/tool-call-card.tsx` while keeping existing running/done UX
- [x] T015 [US2] Verify `/api/agent` streaming contract remains unchanged in `app/api/agent/route.ts` (no custom Coze event emission)

**Checkpoint**: US2 meets zero-intermediate-visibility requirement.

---

## Phase 5: User Story 3 - Graceful Failure Messaging (Priority: P3)

**Goal**: Keep conversation usable with clear fallback messaging and cancellation propagation.

**Independent Test**: Force invalid token/timeout and confirm readable fallback; cancel request and confirm prompt stop.

### Implementation for User Story 3

- [x] T016 [US3] Add graceful fallback return paths for Coze auth/network/timeout errors in `lib/agent/coze-client.ts`
- [x] T017 [US3] Surface fallback text from tool without throwing chain-breaking exceptions in `lib/agent/tools.ts`
- [x] T018 [US3] Propagate request abort signal to Coze call path in `lib/agent/tools.ts` and `lib/agent/coze-client.ts`
- [x] T019 [US3] Validate failure and cancellation behavior steps in `specs/006-coze-subagent/quickstart.md` and adjust instructions if implementation details changed

**Checkpoint**: US3 failure/cancel flows behave predictably without breaking chat.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks and documentation alignment across stories.

- [x] T020 [P] Align feature docs wording with final tool name in `specs/006-coze-subagent/contracts/agent-tool.md` and `specs/006-coze-subagent/plan.md`
- [x] T021 Run end-to-end validation commands `npx tsc --noEmit` and `npm run lint` from repository root
- [x] T022 [P] Capture final implementation notes for handoff in `specs/006-coze-subagent/quickstart.md` (actual env key names and verification tips)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1, blocks all story work
- **Phase 3 (US1)**: depends on Phase 2
- **Phase 4 (US2)**: depends on US1 core tool replacement (Phase 3)
- **Phase 5 (US3)**: depends on US1 + US2 complete tool path
- **Phase 6 (Polish)**: depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: foundational only, no dependency on other stories
- **US2 (P2)**: depends on US1 tool integration being active
- **US3 (P3)**: depends on integrated tool path from US1/US2 for proper fallback and abort handling

### Within Each User Story

- Implement Coze client behavior before tool wiring that consumes it
- Keep tool return contract as plain string before UI/state validation
- Validate independent test criteria after each story checkpoint

---

## Parallel Opportunities

- **Setup**: `T002` and `T003` can run in parallel after `T001`
- **Foundational**: `T005` and `T007` can run in parallel after `T004`
- **US2**: `T014` can run in parallel with `T012/T013` once renamed tool key is decided
- **Polish**: `T020` and `T022` can run in parallel before final validation `T021`

---

## Parallel Example: User Story 2

```bash
Task: "T012 [US2] Enforce final-answer-only extraction in lib/agent/coze-client.ts"
Task: "T014 [US2] Update tool label mapping in components/agent/tool-call-card.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate independent test in `/mobile/assistant`
4. Demo real knowledge answer replacement as MVP

### Incremental Delivery

1. Deliver US1 (real Coze answer)
2. Add US2 hardening (no intermediate visibility)
3. Add US3 resilience (fallback + abort)
4. Finish with Phase 6 polish and command checks

### Team Parallel Strategy

1. Developer A: `lib/agent/coze-client.ts` foundation and story logic
2. Developer B: `lib/agent/tools.ts` integration and routing copy
3. Developer C: `components/agent/tool-call-card.tsx` + docs polish
