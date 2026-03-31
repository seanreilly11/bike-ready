// All TypeScript types for BikeReady.
// This is the single source of truth for all type definitions.

// ---------------------------------------------------------------------------
// Enums and unions
// ---------------------------------------------------------------------------

export type ModuleId =
  | 'priority'
  | 'signs'
  | 'roadusers'
  | 'infrastructure'
  | 'legal'
  | 'vocabulary'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type QuestionType = 'multiple_choice' | 'true_false' | 'scenario_decision'

export type QuestionStatus = 'draft' | 'active' | 'archived'

export type SignId =
  | 'mandatory_cycle'  // round blue sign, white bicycle — G11
  | 'no_cycling'       // round white, red border, red diagonal
  | 'priority_road'    // yellow diamond — voorrangsweg
  | 'uitgezonderd'     // no entry + uitgezonderd fietsers sub-sign
  | 'fietsstraat'      // red rectangular FIETSSTRAAT sign
  | 'cyclist_light'    // small traffic light with bicycle symbol, red active
  | 'shark_teeth'      // road marking — three white triangles

export type DotState = 'unseen' | 'seen' | 'correct' | 'active'

export type ModuleStatus = 'not_started' | 'in_progress' | 'complete' | 'preview_done'

// ---------------------------------------------------------------------------
// Static content types
// ---------------------------------------------------------------------------

export interface Option {
  id:    string
  label: string
}

export interface Feedback {
  title: 'Correct' | 'Not quite'
  body:  string
  rule:  string
  tip:   string
}

export interface Question {
  id:         string
  module:     ModuleId
  skill:      string
  difficulty: Difficulty
  type:       QuestionType
  prompt:     string
  options:    Option[]
  correct:    string
  sign?:      SignId
  feedback:   Feedback
  status:     QuestionStatus
}

export interface LessonVariant {
  title: string
  body:  string
}

export interface SkillLessons {
  easy:   LessonVariant
  medium: LessonVariant
  hard:   LessonVariant
}

export interface LessonsFile {
  meta:    Record<string, unknown>
  lessons: Record<string, SkillLessons>
}

export interface Module {
  id:          ModuleId
  title:       string
  emoji:       string
  description: string
  badgeId:     string
  badgeName:   string
}

export interface Badge {
  id:          string
  name:        string
  emoji:       string
  description: string
  moduleId:    ModuleId | null
}

// ---------------------------------------------------------------------------
// Dynamic / Supabase types
// ---------------------------------------------------------------------------

export interface Profile {
  id:         string
  is_premium: boolean
  created_at: string
}

export interface QuestionProgress {
  id:               string
  user_id:          string
  question_id:      string
  seen:             boolean
  correct:          boolean
  attempts:         number
  last_answered_at: string
}

export interface EarnedBadge {
  id:        string
  user_id:   string
  badge_id:  string
  earned_at: string
}

export interface TestResult {
  id:           string
  user_id:      string
  score_pct:    number
  answers:      Record<string, string>
  passed:       boolean
  completed_at: string
}

// ---------------------------------------------------------------------------
// Derived / computed types
// ---------------------------------------------------------------------------

export type LocalProgress = Record<string, { seen: boolean; correct: boolean }>

// ---------------------------------------------------------------------------
// Analytics event types
// ---------------------------------------------------------------------------

export interface AnalyticsEvents {
  question_answered: {
    question_id: string
    module:      ModuleId
    skill:       string
    difficulty:  Difficulty
    correct:     boolean
  }
  module_started:       { module: ModuleId }
  module_completed:     { module: ModuleId }
  gate_seen:            { module: ModuleId; source: 'inline' | 'nav' | 'preview_complete' }
  gate_converted:       Record<string, never>
  test_completed:       { score_pct: number; passed: boolean }
  badge_earned:         { badge_id: string }
  onboarding_completed: Record<string, never>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FREE_PER_MODULE   = 2
export const TEST_PASS_PCT     = 80
export const RETURN_BANNER_MIN = 3
