// Your workspace (progress, notes, reviews, stories) lives in this browser's localStorage.
// The site is static, so nothing is sent anywhere; lib/local-api.ts applies changes to it.

// SM-2 schedule shared by flashcards and DSA re-solve reviews.
export interface ReviewSchedule {
  repetitions: number;
  interval: number; // in days
  easeFactor: number;
  nextReviewDate: string; // ISO string
  lastReviewedAt?: string;
  history?: number[]; // quality ratings, 0-5
}

export interface ProblemProgress {
  solved: boolean;
  notes?: string;
  userCode?: string;
  language?: string;
  lastAttemptAt?: string;
  solvedAt?: string;
  review?: ReviewSchedule; // when to re-solve this problem from scratch
}

export interface PythonCourseProgress {
  completed: string[]; // lesson ids
  currentLessonId?: string;
  exercises?: Record<string, { passedAt: string; code: string }>; // key: lesson id
}

export interface MockSession {
  id: string;
  problemId: string;
  startedAt: string;
  durationSeconds: number;
  passed: boolean;
  statedTime: string;
  statedSpace: string;
  selfRating?: number; // 0-5
}

export interface FlashcardSM2 {
  id: string;
  repetitions: number;
  interval: number; // in days
  easeFactor: number; // default 2.5
  nextReviewDate: string; // ISO string
  lastReviewedAt?: string;
  history?: number[];
}

export interface StarStory {
  id: string;
  title: string;
  category: "Conflict" | "Outage" | "Tight Deadline" | "Trade-off" | "Leadership" | "Architecture";
  company: string; // the company or project the story comes from
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  tags: string[];
  updatedAt: string;
}

export interface UserState {
  profile: {
    name: string;
    targetRole: string;
    targetDate: string;
    targetLocation: string;
    currentStreak: number; // derived from activityDates on every read
    lastActiveDate: string; // derived; "" when there is no activity yet
    planStartDate?: string; // local YYYY-MM-DD; set on first activity, anchors the roadmap
  };
  progress: Record<string, ProblemProgress>; // key: problemId or topicId
  flashcards: Record<string, FlashcardSM2>; // key: flashcardId
  starStories: StarStory[];
  studyNotes: Record<string, string>; // key: topicId
  pythonCourse?: PythonCourseProgress;
  activityDates?: string[]; // local YYYY-MM-DD days with activity; drives the streak
  mockSessions?: MockSession[];
}

export const STATE_KEY = "interviewos:state:v1";

export function getInitialState(): UserState {
  return {
    profile: {
      name: "",
      targetRole: "Software Engineer",
      // A 16-week plan by default; profile fields can be updated through the state API in lib/local-api.ts.
      targetDate: new Date(Date.now() + 16 * 7 * 86_400_000).toISOString().slice(0, 10) + "T00:00:00.000Z",
      targetLocation: "",
      currentStreak: 0,
      lastActiveDate: "",
    },
    progress: {},
    flashcards: {},
    starStories: [],
    studyNotes: {},
    pythonCourse: { completed: [] },
    activityDates: [],
    mockSessions: [],
  };
}

const ACTIVITY_DAYS_KEPT = 400;

/** Local calendar day as YYYY-MM-DD; streaks follow the machine's time zone, not UTC. */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function previousDay(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return localDateKey(new Date(year, month - 1, day - 1));
}

/** Consecutive active days ending today, or ending yesterday if today has no activity yet. */
export function computeStreak(dates: string[] = [], today: string = localDateKey()): number {
  const days = new Set(dates);
  let cursor = days.has(today) ? today : previousDay(today);
  let streak = 0;
  while (days.has(cursor)) { streak += 1; cursor = previousDay(cursor); }
  return streak;
}

function withDerivedFields(state: UserState): UserState {
  const dates = state.activityDates ?? [];
  return { ...state, profile: { ...state.profile, currentStreak: computeStreak(dates), lastActiveDate: dates[dates.length - 1] ?? "" } };
}

/** Marks today as active. Call from handlers that record real practice. */
export function recordActivity(state: UserState, now: Date = new Date()): void {
  const today = localDateKey(now);
  state.activityDates = [...new Set([...(state.activityDates ?? []), today])].sort().slice(-ACTIVITY_DAYS_KEPT);
  state.profile = {
    ...state.profile,
    planStartDate: state.profile.planStartDate ?? today,
    currentStreak: computeStreak(state.activityDates, today),
    lastActiveDate: today,
  };
}

// Older files may predate newer fields; fill them in without touching saved data.
function normalize(raw: UserState): UserState {
  const initial = getInitialState();
  return {
    ...raw,
    profile: { ...initial.profile, ...(raw.profile ?? {}) },
    progress: raw.progress ?? {},
    flashcards: raw.flashcards ?? {},
    starStories: Array.isArray(raw.starStories) ? raw.starStories : [],
    studyNotes: raw.studyNotes ?? {},
    pythonCourse: { ...raw.pythonCourse, completed: Array.isArray(raw.pythonCourse?.completed) ? raw.pythonCourse.completed : [] },
    activityDates: Array.isArray(raw.activityDates) ? raw.activityDates.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)) : [],
    mockSessions: Array.isArray(raw.mockSessions) ? raw.mockSessions : [],
  };
}

export function readUserState(): UserState {
  let raw: string | null = null;
  try { raw = localStorage.getItem(STATE_KEY); }
  catch { throw new Error("This browser is blocking site storage, so progress can't be loaded or saved."); }
  if (raw === null) return withDerivedFields(getInitialState());
  try {
    return withDerivedFields(normalize(JSON.parse(raw)));
  } catch (err) {
    // Keep unreadable data aside instead of letting the next save overwrite it.
    try { localStorage.setItem(`${STATE_KEY}:corrupt-${Date.now()}`, raw); } catch { /* storage is full */ }
    console.error("Saved progress could not be parsed; kept a copy and started fresh.", err);
    return withDerivedFields(getInitialState());
  }
}

export function writeUserState(state: UserState): void {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
  catch { throw new Error("Your browser could not save progress (storage may be full or blocked)."); }
}

// SM-2 Spaced Repetition Algorithm Implementation
// Quality rating: 0 (blackout) to 5 (perfect recall)
export function calculateSM2(
  quality: number, // 0 - 5
  prevRepetitions: number = 0,
  prevInterval: number = 1,
  prevEase: number = 2.5
): { repetitions: number; interval: number; easeFactor: number; nextReviewDate: string } {
  let repetitions = prevRepetitions;
  let interval = prevInterval;
  let easeFactor = prevEase;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // Calculate new Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    repetitions,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate: nextDate.toISOString(),
  };
}
