# Frontend UI/UX Review — Authenticated Pages

> Reviewed: 2026-03-17
> Scope: All authenticated user-facing components (Candidate, Employer, Enterprise)

---

## Priority Order for Fixes

1. Fix dead-end UX bugs (disabled buttons, broken CTAs, lost filter state)
2. Add missing error/empty states (silent failures = blank screens)
3. Replace hardcoded/fake data with real backend calls
4. Persist UI state (WelcomeBanner dismissal, filter state across tabs)
5. Accessibility pass — aria-labels + modal focus trapping at minimum
6. Split monolithic dashboard components
7. Virtualization + memoization on list-heavy components

---

## Component-by-Component Findings

---

### CandidateDashboard.tsx

**Size:** ~71KB — too large, does too much.

**Suggested split:**
- `CandidateOverview` — profile, stats, welcome
- `SkillDashboard` — skill cards, passport, history
- `AssessmentSelection` — skill/difficulty picker

**State:** 8+ `useState` hooks. Candidate for a `useCandidateState` custom hook.

**Hardcoded data:**
- `AVAILABLE_ASSESSMENTS` constant — not driven from backend.

**Missing states:**
- No error boundary around failed API calls.
- No empty state for "no recommendations found".
- Loading states incomplete on lazy-loaded `SkillPassport`.

**UX issues:**
- Too many tabbed interfaces visible simultaneously (6+ tabs).
- Job listings have no clear "Apply" CTA — only "View Details".
- Assessment difficulty levels not explained to the user.
- No progress indicator for multi-step assessment flow.

**Accessibility:**
- Icon-only buttons (Play, X) have no `aria-label`.
- Modals missing `role="dialog"` and focus trapping.
- Tab switches don't announce content changes to screen readers.
- Score colours (red/yellow/green) not backed by text labels.

**Performance:**
- `motion.div` inside `.map()` on job/skill lists — heavy animation instances.
- No `useMemo` for filtered jobs or assessment categories.
- No `React.memo` on child card components.

**Mobile:**
- No mobile navigation (no hamburger, no bottom nav).
- Modal overflow can exceed viewport with no internal scroll.

---

### EmployerDashboard.tsx

**Size:** ~83KB — largest component in the app, needs splitting.

**Suggested split:**
- `CandidateList` — search, filters, candidate cards
- `JobBoard` — job posting, management
- `CandidateDetailModal` — extracted standalone modal

**State:** 15+ `useState` hooks.

**Hardcoded/fake data:**
- Candidate list is generated mock data — not from backend.
- Industry filter list is hardcoded.

**Missing states:**
- No loading state during AI candidate matching.
- No error handling for failed AI matching.
- No empty state when filters return nothing.

**UX issues:**
- "Match Candidates to Jobs" requires selecting a job first — workflow not communicated.
- Verification modal requires a blockchain hash but doesn't explain where to find it.
- Filter state resets when switching between tabs.
- No bulk actions (select multiple candidates).

**Accessibility:**
- Tabs missing `role="tab"` and `aria-selected`.
- Modals don't trap focus or handle Escape key.
- Certification hash input has no visible label or description.

**Performance:**
- Full candidate list renders on every filter change (no virtualization).
- AI matching call has no debounce or loading guard.
- No `React.memo` on candidate cards.

**Mobile:**
- Filter panel not adapted for small screens.
- Table layouts for candidate skills don't respond to narrow viewports.

---

### EnterpriseDashboard.tsx

**Missing states:**
- No error state if analytics fetch fails.
- No "no data for this period" messaging per date range.
- Skeleton loaders absent — only a spinner on load.

**Broken functionality:**
- Download button has no `onClick` handler — broken.
- Date range selector (7d / 30d / 90d) is purely visual; it does not re-filter data.

**UX issues:**
- Pipeline table has no sorting or filtering.
- Team activity table has no pagination (can be very long).
- "Bottleneck" alert surfaces the problem but suggests no action.

**Accessibility:**
- Tab panels need `role="tabpanel"` and `aria-labelledby`.
- Tables missing `scope` on header cells.
- Trend colours (green/red) need text fallback.

**Performance:**
- All metric cards animate with `motion.div` on every mount.
- Tables with many rows not virtualized.

**Mobile:**
- Tables fall back to `overflow-x-auto` horizontal scroll — no card alternative.
- Sticky header consumes significant viewport space on mobile.

---

### SkillPassport.tsx

**API behaviour:**
- Regenerates on every mount — no caching. Every open fires a Gemini API call.

**Broken UI:**
- "View Assessment Recording" button appears in skill detail modal but is always disabled with no explanation.

**Missing states:**
- No empty states for: no skills, no weaknesses, no opportunities.
- Error recovery is limited to a single "Try Again" with no error context.
- No loading skeleton — just a spinner.

**UX issues:**
- Skill cards are clickable only in the "Strengths" section — inconsistent.
- "Suggested Resources" in weakness cards show names but have no links.
- Weakness recommendations don't suggest concrete next steps.

**Accessibility:**
- Skill detail modal needs focus trap and Escape key handler.
- Score colours need text labels (e.g. "Expert", "Developing").
- Modal close button has no `aria-label`.

**Performance:**
- No caching — passport is regenerated on every component mount.
- Assessment history conversion should be in `useMemo`, not during state update.

---

### GamificationHub.tsx

**Missing states:**
- No loading state on initial mount.
- No error handling at all — failures are silent.
- No empty states for: no achievements, no leaderboard entries.

**UX issues:**
- Daily challenges and weekly goals show progress bars but have no "Go complete this" action button.
- Leaderboard shows only top 10 with "Your position" separately — confusing layout.
- Achievement modal doesn't close on Escape key.
- Challenge progress shows percentage only, not absolute numbers (e.g. "2/5").

**Accessibility:**
- Achievement modal missing `role="dialog"`.
- Rarity (common/rare/epic/legendary) shown only via colour.
- Progress bars have no accessible text alternative.

**Performance:**
- Leaderboard renders all entries without virtualization.
- Animated progress bars on every challenge/goal item.

---

### AICareerCoach.tsx

**Critical — fake AI:**
- All career paths, salary data, interview tips, and resume tips are **hardcoded constants**.
- Coach responses are **rule-based keyword matching**, not actual AI calls.
- There are zero real backend or Gemini API calls in this component.

**Broken functionality:**
- Resume upload button has no handler — does nothing.
- Salary data is static and not personalised to the user's role or location.
- No way to export or save advice from the session.
- Chat history is lost on page refresh.

**UX issues:**
- Career paths tab not filterable or comparable side by side.
- Suggested chat prompts are hardcoded per response type — very limited.
- 1500ms simulated typing delay blocks interactivity.

**Accessibility:**
- Chat messages lack screen-reader context for who is speaking.
- Tab panels missing `role="tabpanel"` and `aria-labelledby`.
- Typing indicator animation has no accessible text alternative.

---

### MockInterview.tsx

**Broken flow:**
- If microphone permission is denied, app shows an alert then leaves the user with no fallback to text input.

**Missing states:**
- No error state if AI evaluation fails.
- No retry mechanism for failed question generation or evaluation.

**UX issues:**
- Recording status has no timer — user doesn't know how long they've been talking.
- Interim transcript updates are confusing (no distinction between in-progress and final).
- Question card doesn't communicate time limit or answer expectations.
- Feedback shows three scores (clarity, confidence, relevance) with no explanation of what each means.

**Accessibility:**
- Mic status is colour-only (red/green) — needs text label.
- Score bar thresholds (80/60) are not explained.
- Mode transitions (setup → interview → feedback) don't announce to screen readers.
- No focus management between mode transitions.

---

### AssessmentHistory.tsx

**Broken UI:**
- Trend chart bar heights are **random**, not scaled to actual data.

**Missing states:**
- Component renders `null` on data fetch failure — no error message shown.
- No recovery mechanism for failed fetches.
- Loading skeleton absent — spinner only.

**UX issues:**
- History table has no pagination.
- Expandable trend cards give no visual affordance that they're clickable.
- "Retake Assessment" button only shown for failed attempts — missed opportunity for passed ones too.
- "Integrity concerns" label is jargon — needs clearer language.

**Accessibility:**
- Tab bar needs `role="tab"`, `aria-selected`, `role="tabpanel"`.
- Expandable cards need `aria-expanded`.
- History table needs `scope` on header cells.

**Performance:**
- History list is unbounded — no virtualization or pagination.
- Date formatting functions called on every render (should use `useMemo`).

---

### NotificationBell.tsx

**UX issues:**
- Delete notification is immediate with no undo.
- Unread count shows "9+" but no way to navigate to older notifications.
- "All caught up!" message only appears when `unreadCount === 0`, not when the full list is empty.
- Polling interval (30s) is hardcoded — no backoff on failure.

**Accessibility:**
- Bell button has no `aria-label`.
- Unread badge has no `aria-label` (just a number).
- Dropdown needs `role="menu"` or proper popover semantics.
- Delete button has no `aria-label`.

**Performance:**
- Full list re-renders on every `loadNotifications` call.
- Should use WebSocket or at minimum exponential backoff on polling failures.

---

### WelcomeBanner.tsx

**Broken behaviour:**
- Dismissing the banner does not persist — it reappears on every page refresh.
- "Next action" CTA only routes correctly for the `complete_tour` action type. All other action types silently do nothing.
- `completionPercentage === 100` check for compact view is fragile (floating point).

**UX issues:**
- Progress steps only render for candidates — employers see nothing.
- Progress circle animation delay (1s) is noticeable and can feel slow.
- Time-based greeting ("Good morning") doesn't account for the user's timezone.

**Accessibility:**
- Progress circle SVG has no `aria-label` or `role`.
- Percentage text inside the SVG circle is not accessible.
- Dismiss button has no `aria-label`.

**Performance:**
- Greeting function is called on every render — should use `useMemo`.

---

## Cross-Cutting Issues

### Hardcoded / Fake Data Summary

| Component | Fake/Hardcoded Data |
|---|---|
| `AICareerCoach` | All career paths, salary data, ALL coach responses |
| `EnterpriseDashboard` | Date range selector doesn't filter data |
| `AssessmentHistory` | Trend chart bar heights are random |
| `EmployerDashboard` | Candidate list is mock-generated |
| `CandidateDashboard` | Available assessments list is a static constant |

### Pervasive Accessibility Gaps

Every authenticated component shares these issues:
- Icon-only buttons with no `aria-label`
- Modals missing `role="dialog"`, focus trapping, Escape key handling
- Status/score conveyed by colour only (green/yellow/red) with no text backup
- Tab bars missing `role="tab"`, `aria-selected`, `role="tabpanel"`
- No focus management on mode/view transitions

### Performance Patterns to Fix

- `motion.div` inside `.map()` — creates N animation instances per list
- No virtualization on unbounded lists (candidates, history, leaderboard, notifications)
- No `useMemo` for computed values (filtered lists, colour mappings, date formats)
- No `React.memo` on repeated card components
- `SkillPassport` fires a Gemini API call on every mount — needs caching

### Mobile Gaps

- Tables in `EmployerDashboard`, `EnterpriseDashboard`, `AssessmentHistory` use `overflow-x-auto` — no card/list alternative on mobile
- `CandidateDashboard` has no mobile navigation pattern
- Modals can overflow viewport height with no internal scroll on small screens
