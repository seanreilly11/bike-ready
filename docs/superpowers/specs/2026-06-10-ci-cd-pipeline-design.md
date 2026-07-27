# CI/CD pipeline design

## Context

A production-readiness audit (2026-06-10) found no automated quality gate:
nothing runs lint, typecheck, tests, or a build before code lands on `main`.
The repo deploys via Vercel's Git integration (auto-deploy on push/PR), so CI's
job is purely a pre-merge/pre-deploy quality gate, not deployment itself. The
project owner works mainly directly on `main` (no PR workflow), so the
workflow must run on both `push` and `pull_request` targeting `main`.

This follows on from the earlier production-readiness work: Sentry error
monitoring (done) and the lint setup fix (done - `npm run lint` now runs
`eslint .` against `eslint-config-next`'s native flat config and surfaced 12
pre-existing errors / 11 warnings).

## Goals

- GitHub Actions workflow that runs lint, typecheck, tests, and build on every
  push/PR to `main`.
- New `typecheck` npm script (`tsc --noEmit`).
- Fix the 12 existing lint errors so CI is green from its first run.
- No GitHub secrets required.

## Non-goals

- Deployment (Vercel Git integration already handles this).
- Branch protection / required-status-check configuration in repo settings -
  can be enabled later by the user if/when they start using PRs.
- E2E tests (none exist yet).
- Fixing the 11 lint warnings (e.g. `useAuth.ts:153` missing `track` dep) -
  non-blocking, noted but out of scope.

## Design

### Workflow: `.github/workflows/ci.yml`

- Triggers: `push` to `main`, `pull_request` targeting `main`.
- Single job `ci`, `runs-on: ubuntu-latest`.
- Steps, in order (fail-fast - first failing step stops the run):
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` - Node 22, `cache: npm`
  3. `npm ci`
  4. `npm run lint`
  5. `npm run typecheck`
  6. `npm run test:run`
  7. `npm run build`

### Build env vars

`next.config.ts` calls `validateEnv()` (see `lib/validateEnv.ts`), which
throws if these are unset:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_REDIRECT_URL`

`validateEnv()` only checks presence, not validity, and no page makes
build-time Supabase calls (`generateStaticParams` in
`app/guide/[moduleId]/page.tsx` doesn't touch Supabase). So the `npm run
build` step in the workflow sets these to hardcoded placeholder values
directly in its `env:` block (e.g. `https://placeholder.supabase.co`,
`placeholder`, `placeholder`, `http://localhost:3000`) - no GitHub secrets
needed.

### `package.json`

Add a `typecheck` script:

```json
"typecheck": "tsc --noEmit"
```

(`tsconfig.json` already has `"noEmit": true`, so this just exposes the
existing check as a runnable script - confirmed `npx tsc --noEmit` currently
passes clean.)

## Prerequisite fixes (must land first so CI is green)

`npm run lint` currently reports 12 errors. Each fix below is concrete enough
to implement directly:

1. **`app/error.tsx`** and **`app/global-error.tsx`** - both have:

   ```tsx
   <a href="/learn" className="...">
     Back to modules
   </a>
   ```

   triggering `@next/next/no-html-link-for-pages`. Fix: import `Link` from
   `next/link` and replace the `<a>` with `<Link href="/learn" className="...">Back to modules</Link>`
   (same className, just swap the tag).

2. **`components/questions/LessonAccordion.tsx`** (lines 15, 19-21) -

   ```tsx
   const [open, setOpen] = useState(false);
   useEffect(() => {
     setOpen(false);
   }, [skill, difficulty]);
   ```

   triggers `react-hooks/set-state-in-effect`. Fix: replace with React's
   "adjust state during render" pattern - track the previous `skill`/
   `difficulty` in state and reset `open` synchronously during render when
   they change, removing the `useEffect` entirely:

   ```tsx
   const [open, setOpen] = useState(false);
   const [prevKey, setPrevKey] = useState(`${skill}-${difficulty}`);
   const key = `${skill}-${difficulty}`;
   if (key !== prevKey) {
     setPrevKey(key);
     setOpen(false);
   }
   ```

   Remove the now-unused `useEffect` import if nothing else in the file uses it.

3. **`components/questions/OptionButton.tsx`** (lines 27-35) - same
   `set-state-in-effect` issue, tracking `prevState` via `useRef` +
   `useEffect`. Fix with the same render-time-adjustment pattern, replacing
   the ref with state:

   ```tsx
   const [burst, setBurst] = useState<"pop" | "shake" | null>(null);
   const [prevState, setPrevState] = useState<OptionState>(state);
   if (state !== prevState) {
     if (prevState !== "correct" && state === "correct") setBurst("pop");
     if (prevState !== "incorrect" && state === "incorrect") setBurst("shake");
     setPrevState(state);
   }
   ```

   Remove the now-unused `useEffect`/`useRef` imports if nothing else in the
   file uses them.

4. **`components/ui/MasteryDot.tsx`** (lines 19-27) - same pattern as #3:

   ```tsx
   const [popping, setPopping] = useState(false);
   const [prevState, setPrevState] = useState<DotState>(state);
   if (state !== prevState) {
     if (prevState !== "correct" && state === "correct") setPopping(true);
     setPrevState(state);
   }
   ```

   Remove the now-unused `useEffect`/`useRef` imports if nothing else in the
   file uses them.

5. **`tests/components/DotMap.test.tsx`** (line 16) -

   ```tsx
   function makeQuestions(count: number, moduleId = 'priority'): Question[] {
     return Array.from({ length: count }, (_, i) => ({
       ...
       module: moduleId as any,
   ```

   Fix: type the parameter as `ModuleId` instead of `string` so no cast is
   needed: `function makeQuestions(count: number, moduleId: ModuleId = 'priority'): Question[]`
   and `module: moduleId,`. Add `ModuleId` to the existing
   `import type { Question, LocalProgress } from '@/types'` line.

6. **`tests/data/questions.test.ts`** (line 57) -

   ```ts
   expect((q.feedback as any).title, ...).toBeUndefined()
   ```

   `Feedback` (in `types/index.ts`) no longer has a `title` field - this test
   guards against its reintroduction. Fix: replace `as any` with
   `as Record<string, unknown>`: `(q.feedback as Record<string, unknown>).title`.

7. **`tests/stores/appStore.test.ts`** (line 99) -
   ```ts
   const fakeUser = { id: "u1", email: "test@example.com" } as any;
   ```
   `setUser` expects `User | null` from `@supabase/supabase-js`, which has many
   required fields a partial mock can't satisfy directly. Fix: replace `as any`
   with `as unknown as User`, importing `type { User } from '@supabase/supabase-js'`.

## Testing / Verification

1. After each prerequisite fix, run `npm run lint` and `npm run test:run` -
   confirm the specific error is gone and no new failures appear.
2. After all 7 fixes: `npm run lint` reports 0 errors (11 pre-existing
   warnings remain, expected).
3. `npm run typecheck` - 0 errors.
4. `npm run test:run` - all 152 tests still pass.
5. `npm run build` locally with the placeholder env vars the workflow will
   use - succeeds.
6. Push to `main`, confirm the Actions tab shows a green "CI" run end to end.
