// All TypeScript types for CycleDutch.
// This is the single source of truth for all type definitions.

import { SIGN_REGISTRY } from "@/data/signs";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Enums and unions
// ---------------------------------------------------------------------------

export type ModuleId =
  | "fundamentals"
  | "priority"
  | "signs"
  | "roadusers"
  | "infrastructure"
  | "legal"
  | "vocabulary";

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "scenario_decision";

export type QuestionStatus = "draft" | "active" | "archived";

export type SignId = keyof typeof SIGN_REGISTRY;

export type DotState =
  | "unseen"
  | "seen"
  | "correct"
  | "active"
  | "active-correct"
  | "locked"
  | "mastered";

export const AnswerResult = {
  Correct: "Correct",
  Wrong: "Not quite",
} as const;

export type ModuleStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "preview_done"
  | "mastered";

// ---------------------------------------------------------------------------
// Static content types
// ---------------------------------------------------------------------------

export interface Option {
  id: string;
  label: string;
}

export interface Feedback {
  body: string;
  rule: string;
  tip: string;
}

export interface Question {
  id: string;
  module: ModuleId;
  skill: string;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  options: Option[];
  correct: string;
  sign?: SignId;
  feedback: Feedback;
  status: QuestionStatus;
}

export interface LessonVariant {
  title: string;
  body: string;
}

export interface SkillLessons {
  easy: LessonVariant;
  medium: LessonVariant;
  hard: LessonVariant;
}

export interface LessonsFile {
  meta: Record<string, unknown>;
  lessons: Record<string, SkillLessons>;
}

export interface Module {
  id: ModuleId;
  title: string;
  icon: LucideIcon;
  description: string;
  badgeId: string;
  badgeName: string;
  alwaysFree: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  moduleId: ModuleId | null;
}

// ---------------------------------------------------------------------------
// Dynamic / Supabase types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  is_premium: boolean;
  created_at: string;
}

export interface QuestionProgress {
  id: string;
  user_id: string;
  question_id: string;
  seen: boolean;
  correct: boolean;
  attempts: number;
  last_answered_at: string;
}

export interface EarnedBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface TestResult {
  id: string;
  user_id: string;
  score_pct: number;
  answers: Record<string, string>;
  passed: boolean;
  completed_at: string;
}

// ---------------------------------------------------------------------------
// Derived / computed types
// ---------------------------------------------------------------------------

export type LocalProgress = Record<string, { seen: boolean; correct: boolean }>;

// ---------------------------------------------------------------------------
// Analytics event types
// ---------------------------------------------------------------------------

export interface AnalyticsEvents {
  // --- existing ---
  question_answered: {
    question_id: string;
    module: ModuleId;
    skill: string;
    difficulty: Difficulty;
    correct: boolean;
    time_to_answer_ms: number;
    context: "learn" | "review" | "test";
  };
  module_started: { module: ModuleId };
  module_completed: { module: ModuleId };
  gate_seen: {
    module: ModuleId;
    source: "inline" | "nav" | "preview_complete";
  };
  gate_converted: Record<string, never>;
  test_completed: { score_pct: number; passed: boolean };
  badge_earned: { badge_id: string };
  onboarding_started: Record<string, never>;
  onboarding_completed: Record<string, never>;
  ab_variant_assigned: { test: string; variant: string };

  // --- acquisition ---
  cta_clicked: { source: "hero" | "bottom"; hero_variant: string | null };
  onboarding_skipped: Record<string, never>;

  // --- learning engagement ---
  lesson_accordion_toggled: {
    question_id: string;
    skill: string;
    difficulty: Difficulty;
    open: boolean;
  };
  dot_map_jumped: {
    module: ModuleId;
    from_index: number;
    to_index: number;
  };
  module_exited_early: {
    module: ModuleId;
    question_index: number;
    total_questions: number;
  };
  feedback_panel_viewed: {
    question_id: string;
    module: ModuleId;
    correct: boolean;
  };

  // --- conversion funnel ---
  gate_dismissed: { module: ModuleId };
  gate_next_module_clicked: { from_module: ModuleId; to_module: ModuleId };
  upgrade_cta_clicked: {
    source:
      | "preview_complete"
      | "user_menu"
      | "gate_modal"
      | "review"
      | "test"
      | "upsell_banner";
  };
  checkout_started: Record<string, never>;

  // --- retention & auth ---
  auth_modal_opened: {
    reason: "save_progress" | "upgrade";
    source: string;
  };
  magic_link_sent: { reason: "save_progress" | "upgrade" };
  account_created: { hero_variant: string | null };
  return_banner_clicked: Record<string, never>;
  return_banner_dismissed: Record<string, never>;
  progress_migrated: { questions_count: number };
  user_signed_out: Record<string, never>;

  // --- test & review ---
  test_started: Record<string, never>;
  test_abandoned: { progress_pct: number; questions_answered: number };
  test_share_clicked: {
    score_pct: number;
    passed: boolean;
    platform: "native" | "clipboard";
  };
  test_retried: { previous_score_pct: number };
  review_question_opened: {
    question_id: string;
    module: ModuleId;
    position: number;
  };
  review_cleared: Record<string, never>;

  // --- milestone & delight ---
  badge_toast_shown: { badge_id: string };
  badge_toast_dismissed: { badge_id: string; auto: boolean };

  // --- guide engagement ---
  glossary_searched: { query: string; results_count: number };
  glossary_category_filtered: { category: string | null };
  guide_toc_clicked: {
    module: string;
    section_index: number;
    section_heading: string;
  };
}

// ---------------------------------------------------------------------------
// Guide / signs-reference types
// ---------------------------------------------------------------------------

export interface GuideSection {
  heading: string;
  body: string;
}

export interface GuideEntry {
  moduleId: string;
  title: string;
  subtitle: string;
  /** Keyword-targeted <title> tag. Falls back to `title` if absent. */
  seoTitle?: string;
  /** On-page H1. Falls back to `title` if absent. */
  h1?: string;
  /** ISO date (YYYY-MM-DD) used for Article dateModified + sitemap lastmod. */
  updatedAt?: string;
  sections: GuideSection[];
}

export interface SignsDesignRule {
  id: string;
  title: string;
  body: string;
  examples: string[];
}

export interface SignsDesignSystem {
  intro: string;
  rules: SignsDesignRule[];
}

export interface SignsSign {
  id: string;
  component: string;
  name: string;
  dutch_name: string;
  code: string | null;
  description: string;
  end_variant: string | null;
}

export interface SignsCategory {
  id: string;
  title: string;
  description: string;
  signs: SignsSign[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FREE_PER_MODULE = 3;
export const TEST_PASS_PCT = 80;
export const RETURN_BANNER_MIN = 3;
