# ZUSTAND.md — CycleDutch State Management

CycleDutch uses Zustand for global client-side state. This replaces all prop drilling of `prog`, `isPrem`, `earned`, `user`, and related callback props throughout the component tree.

---

## Why Zustand

The prototype and early Next.js build passed the following props down through every screen and component:

```
App
  prog, setProg, isPrem, setIsPrem, earned, setEarned,
  onAnswer, onBack, onMod, onGate, onSaveNudge, newBadge
  └── LearnIndex       (prog, isPrem, earned, onMod, onGate)
  └── ModuleScreen     (prog, isPrem, onAnswer, onBack, onMod, onGate, onSaveNudge, newBadge)
        └── QCard      (q, onAnswer, answered, selectedId)
  └── ReviewScreen     (prog, onAnswer, isPrem, onGate)
  └── TestScreen       (isPrem, onGate, onBadge)
```

This is shallow but it means every screen must receive and forward props it may not directly use. As the app grows with auth, Stripe webhooks, and Supabase sync this becomes increasingly fragile.

Zustand gives any component direct access to global state without prop threading. No Provider wrapper. No dispatch. No boilerplate.

---

## Store structure

Two stores. Keep them separate — one for progress/auth state, one for UI state.

### 1. useAppStore — progress, auth, premium

```ts
// stores/appStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QuestionProgress {
  seen: boolean
  correct: boolean
}

interface AppState {
  // Progress
  progress: Record<string, QuestionProgress>
  earned: string[]                            // badge IDs

  // Auth / premium
  user: User | null
  isPremium: boolean

  // Actions
  answerQuestion: (questionId: string, isCorrect: boolean) => void
  earnBadge: (badgeId: string) => void
  setUser: (user: User | null) => void
  setPremium: (val: boolean) => void
  hydrateProgress: (progress: Record<string, QuestionProgress>) => void
  resetProgress: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: {},
      earned: [],
      user: null,
      isPremium: false,

      answerQuestion: (questionId, isCorrect) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [questionId]: {
              seen: true,
              // correct is sticky — once true it never reverts to false
              correct: state.progress[questionId]?.correct || isCorrect,
            },
          },
        })),

      earnBadge: (badgeId) =>
        set((state) => ({
          earned: state.earned.includes(badgeId)
            ? state.earned
            : [...state.earned, badgeId],
        })),

      setUser: (user) => set({ user }),

      setPremium: (val) => set({ isPremium: val }),

      hydrateProgress: (progress) => set({ progress }),

      resetProgress: () => set({ progress: {}, earned: [] }),
    }),
    {
      name: 'progress',   // localStorage key
      partialize: (state) => ({     // only persist these fields
        progress: state.progress,
        earned: state.earned,
      }),
    }
  )
)
```

**The `persist` middleware** handles localStorage automatically. No manual `localStorage.getItem` / `setItem` calls needed anywhere in the app for progress. When a user creates an account, call `hydrateProgress` with their Supabase data and then remove the persisted localStorage entry.

**The `correct` sticky logic** is enforced in the store — once a question is answered correctly it can never go back to false, matching the database upsert behaviour.

### 2. useUIStore — transient UI state

```ts
// stores/uiStore.ts
import { create } from 'zustand'

interface UIState {
  // Modal states
  showGate: boolean
  showAuth: boolean
  authReason: 'save_progress' | 'upgrade' | null

  // Toast / notifications
  newBadgeId: string | null
  showUpgradeToast: boolean

  // Onboarding
  onboardingDone: boolean

  // Return banner
  showReturnBanner: boolean

  // Actions
  openGate: () => void
  closeGate: () => void
  openAuth: (reason: 'save_progress' | 'upgrade') => void
  closeAuth: () => void
  showBadge: (badgeId: string) => void
  clearBadge: () => void
  setUpgradeToast: (val: boolean) => void
  completeOnboarding: () => void
  dismissReturnBanner: () => void
}

export const useUIStore = create<UIState>()(
  (set) => ({
    showGate: false,
    showAuth: false,
    authReason: null,
    newBadgeId: null,
    showUpgradeToast: false,
    onboardingDone: false,
    showReturnBanner: false,

    openGate: () => set({ showGate: true }),
    closeGate: () => set({ showGate: false }),
    openAuth: (reason) => set({ showAuth: true, authReason: reason }),
    closeAuth: () => set({ showAuth: false, authReason: null }),
    showBadge: (badgeId) => set({ newBadgeId: badgeId }),
    clearBadge: () => set({ newBadgeId: null }),
    setUpgradeToast: (val) => set({ showUpgradeToast: val }),
    completeOnboarding: () => set({ onboardingDone: true }),
    dismissReturnBanner: () => set({ showReturnBanner: false }),
  })
)
```

`onboardingDone` can also be persisted with the persist middleware if preferred, but since it's already stored in a separate localStorage key in the prototype it's fine to leave it in the UI store without persistence and set it from localStorage on mount.

---

## Migration — what changes

### Before (prototype / early build)

Every screen received props from the root App component:

```tsx
// App.tsx — old pattern
const [prog, setProg] = useState({})
const [isPrem, setIsPrem] = useState(false)
const [earned, setEarned] = useState([])
const [showGate, setShowGate] = useState(false)
const [showAuth, setShowAuth] = useState(false)
const [newBadge, setNewBadge] = useState(null)

<LearnIndex
  prog={prog}
  isPrem={isPrem}
  earned={earned}
  onMod={setActiveMod}
  onGate={() => setShowGate(true)}
/>

<ModuleScreen
  prog={prog}
  isPrem={isPrem}
  onAnswer={(qid, correct) => { /* update prog */ }}
  onBack={() => setScreen('learn')}
  onMod={setActiveMod}
  onGate={() => setShowGate(true)}
  onSaveNudge={() => setShowAuth(true)}
  newBadge={newBadge}
/>

<ReviewScreen
  prog={prog}
  onAnswer={(qid, correct) => { /* update prog */ }}
  isPrem={isPrem}
  onGate={() => setShowGate(true)}
/>
```

### After (Zustand)

Each component reads directly from the store. Root App component manages only routing:

```tsx
// App.tsx — new pattern
// No state here except navigation
const [screen, setScreen] = useState<Screen>('home')
const [activeMod, setActiveMod] = useState<string | null>(null)

// All progress/auth/UI state is in Zustand stores
// No prop drilling
```

```tsx
// LearnIndex.tsx — reads from store directly
function LearnIndex() {
  const { progress, isPremium, earned } = useAppStore()
  const { openGate } = useUIStore()

  // No props needed
}
```

```tsx
// ModuleScreen.tsx — reads and writes store directly
function ModuleScreen({ moduleId }: { moduleId: string }) {
  const { progress, isPremium, answerQuestion, earnBadge } = useAppStore()
  const { openGate, openAuth, showBadge } = useUIStore()

  function handleAnswer(questionId: string, selectedOptionId: string) {
    const isCorrect = selectedOptionId === question.correct
    answerQuestion(questionId, isCorrect)
    // badge check
    checkAndAwardBadge(moduleId, progress, earnBadge, showBadge)
  }
}
```

```tsx
// QCard.tsx — still receives q, answered, selectedId as props
// These are local to the question session, not global state
// onAnswer becomes a local function, not a passed-down callback
```

---

## What remains as local state

Not everything belongs in Zustand. Keep these as `useState` inside the components that own them:

| State | Lives in | Why |
|---|---|---|
| `currentQuestionIndex` | ModuleScreen | Navigation within a session — not shared |
| `selectedOptionId` | ModuleScreen | In-progress answer before submission |
| `answered` (bool) | ModuleScreen | Whether current question is answered |
| `lessonOpen` | QCard | Accordion open/closed |
| `testAnswers` | TestScreen | Answers during active test |
| `testPhase` | TestScreen | intro / in_progress / results |
| `emailInputValue` | AuthModal | Form field value |
| `emailSent` | AuthModal | Whether magic link was sent |

These are all transient, component-scoped states that no other component needs to know about.

---

## Supabase sync

The Zustand store is the client-side source of truth. Supabase is the server-side source of truth. They sync in two directions:

**On sign-in (localStorage → Supabase):**
```ts
// In useAuth or a dedicated sync hook
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { progress } = useAppStore.getState()

    // Migrate any localStorage progress to Supabase
    await migrateProgress(session.user.id, progress)

    // Fetch full progress from Supabase and hydrate store
    const serverProgress = await fetchProgress(session.user.id)
    useAppStore.getState().hydrateProgress(serverProgress)

    // Stop persisting to localStorage — Supabase is now source of truth
    useAppStore.persist.clearStorage()
  }
})
```

**On answer (store → Supabase):**
```ts
// answerQuestion fires optimistically in the store
// then syncs to Supabase in the background
async function handleAnswer(questionId: string, isCorrect: boolean) {
  // 1. Update store immediately (optimistic)
  answerQuestion(questionId, isCorrect)

  // 2. Sync to Supabase if logged in
  const { user } = useAppStore.getState()
  if (user) {
    await supabase.from('question_progress').upsert({
      user_id: user.id,
      question_id: questionId,
      seen: true,
      correct: isCorrect,
      attempts: 1,
      last_answered_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_id' })
  }
}
```

Note: `useAppStore.getState()` can be called outside React components, which is one of the key advantages of Zustand over Context — useful for event handlers, utility functions, and auth listeners that live outside the component tree.

---

## Reading state outside React

Zustand stores are accessible outside components via `.getState()`:

```ts
// In the Supabase auth callback (not a component)
const { setPremium } = useAppStore.getState()
setPremium(true)

// In a utility function
const { progress } = useAppStore.getState()
const moduleProgress = getModuleProgress('priority', progress)
```

This is particularly useful for:
- The `onAuthStateChange` listener in `useAuth`
- The Stripe webhook response handler
- The localStorage migration function

---

## Selectors — avoid re-renders

Use selectors to subscribe to only the slice of state a component needs:

```ts
// Only re-renders when isPremium changes, not on every progress update
const isPremium = useAppStore((state) => state.isPremium)

// Only re-renders when this specific question's progress changes
const questionProgress = useAppStore(
  (state) => state.progress[questionId]
)

// Derived value — memoised with useShallow for object equality
import { useShallow } from 'zustand/react/shallow'

const { progress, earned } = useAppStore(
  useShallow((state) => ({ progress: state.progress, earned: state.earned }))
)
```

Avoid subscribing to the whole store (`useAppStore()`) in components that only need one or two values — it causes unnecessary re-renders on every state change.

---

## File structure

```
stores/
  appStore.ts      — progress, auth, premium state
  uiStore.ts       — modals, toasts, banners, onboarding
```

No additional files needed. Both stores are imported directly wherever they're used.

---

## Installation

```bash
npm install zustand
```

No other configuration required. The `persist` middleware is included in the Zustand package.
