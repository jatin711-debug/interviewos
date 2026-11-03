"use client";

// The site is static (GitHub Pages), so what used to be Next.js API routes runs here, in the browser:
// state is kept in localStorage (lib/storage.ts) and Python runs in Pyodide (lib/browser-python.ts).
// apiFetch keeps the old request/response contract, so pages call it exactly as they called fetch().
import { runPython } from "@/lib/browser-python";
import { BROWSER_CHECK_KILL_MS, PROGRESS_PREFIX } from "@/lib/python-challenge";
import { calculateSM2, readUserState, recordActivity, writeUserState, type MockSession, type ProblemProgress, type StarStory, type UserState } from "@/lib/storage";

type Body = Record<string, unknown>;
const PROFILE_FIELDS = ["name", "targetRole", "targetDate", "targetLocation", "planStartDate"] as const;
const MOCK_SESSIONS_KEPT = 200;
const REVIEW_HISTORY_KEPT = 50;
const CODE_LIMIT = 100_000;
const RUN_TIMEOUT_MS = 60_000;

const isRecord = (value: unknown): value is Body => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const quality = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;

function pickProgress(value: Body): Partial<ProblemProgress> {
  const picked: Partial<ProblemProgress> = {};
  if (typeof value.solved === "boolean") picked.solved = value.solved;
  if (text(value.notes, 20_000)) picked.notes = value.notes;
  if (text(value.userCode, 100_000)) picked.userCode = value.userCode;
  if (text(value.language, 20)) picked.language = value.language;
  if (text(value.lastAttemptAt, 40)) picked.lastAttemptAt = value.lastAttemptAt;
  if (text(value.solvedAt, 40)) picked.solvedAt = value.solvedAt;
  return picked;
}

function pickMockSession(value: Body): MockSession | null {
  const { problemId, startedAt, durationSeconds, passed, statedTime, statedSpace, selfRating } = value;
  if (!text(problemId, 200) || !text(startedAt, 40) || Number.isNaN(Date.parse(startedAt))) return null;
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds < 0) return null;
  if (typeof passed !== "boolean" || !text(statedTime, 200) || !text(statedSpace, 200)) return null;
  if (selfRating !== undefined && !quality(selfRating)) return null;
  return {
    id: text(value.id, 100) && value.id ? value.id : `mock-${Date.now()}`,
    problemId, startedAt, durationSeconds: Math.round(durationSeconds), passed, statedTime, statedSpace,
    ...(selfRating === undefined ? {} : { selfRating }),
  };
}

/** Applies a partial update; only known fields are accepted, and streak/activity are derived here. */
function updateState(body: Body): Response {
  const state: UserState = readUserState();
  let practiced = false;

  if (isRecord(body.profile)) {
    for (const field of PROFILE_FIELDS) {
      const value = body.profile[field];
      if (!text(value, 200)) continue;
      if ((field === "targetDate" || field === "planStartDate") && Number.isNaN(Date.parse(value))) return json({ error: `${field} must be a valid date.` }, 400);
      state.profile = { ...state.profile, [field]: value };
    }
  }

  if (isRecord(body.progress)) {
    for (const [id, value] of Object.entries(body.progress)) {
      if (id.length > 200 || !isRecord(value)) continue;
      const existing = state.progress[id];
      const picked = pickProgress(value);
      // Keep the first solve date so review scheduling stays anchored to it.
      if (existing?.solvedAt && picked.solvedAt) delete picked.solvedAt;
      state.progress[id] = { ...(existing ?? { solved: false }), ...picked };
      practiced = true;
    }
  }

  if (isRecord(body.studyNotes)) {
    for (const [id, value] of Object.entries(body.studyNotes)) {
      if (id.length <= 200 && text(value, 20_000)) { state.studyNotes[id] = value; practiced = true; }
    }
  }

  if (isRecord(body.pythonCourse)) {
    const incoming = body.pythonCourse;
    const course = { ...state.pythonCourse, completed: state.pythonCourse?.completed ?? [] };
    if (Array.isArray(incoming.completed)) {
      course.completed = [...new Set(incoming.completed.filter((id): id is string => text(id, 200)))];
      practiced = true;
    }
    if (text(incoming.currentLessonId, 200)) course.currentLessonId = incoming.currentLessonId;
    if (isRecord(incoming.exercises)) {
      const exercises = { ...course.exercises };
      for (const [id, value] of Object.entries(incoming.exercises)) {
        if (id.length <= 200 && isRecord(value) && text(value.passedAt, 40) && text(value.code, 100_000)) {
          exercises[id] = { passedAt: value.passedAt, code: value.code };
          practiced = true;
        }
      }
      course.exercises = exercises;
    }
    state.pythonCourse = course;
  }

  if (body.mockSession !== undefined) {
    const session = isRecord(body.mockSession) ? pickMockSession(body.mockSession) : null;
    if (!session) return json({ error: "Invalid mock session." }, 400);
    state.mockSessions = [...(state.mockSessions ?? []), session].slice(-MOCK_SESSIONS_KEPT);
    practiced = true;
  }

  if (practiced) recordActivity(state);
  writeUserState(state);
  return json({ success: true, state: readUserState() });
}

function saveStory(body: Body): Response {
  const story = body as unknown as StarStory;
  const state = readUserState();
  if (!story.id) story.id = `star-${Date.now()}`;
  story.updatedAt = new Date().toISOString();
  const index = state.starStories.findIndex(item => item.id === story.id);
  if (index >= 0) state.starStories[index] = story;
  else state.starStories.unshift(story);
  recordActivity(state);
  writeUserState(state);
  return json({ success: true, story });
}

function deleteStory(id: string | null): Response {
  if (!id) return json({ error: "Missing story ID" }, 400);
  const state = readUserState();
  state.starStories = state.starStories.filter(story => story.id !== id);
  writeUserState(state);
  return json({ success: true });
}

function reviewFlashcard(body: Body): Response {
  const { cardId, quality: rating } = body;
  if (!text(cardId, 200) || !cardId || !quality(rating)) return json({ error: "Invalid cardId or quality rating (must be 0-5)" }, 400);
  const state = readUserState();
  const current = state.flashcards[cardId] ?? { id: cardId, repetitions: 0, interval: 1, easeFactor: 2.5, nextReviewDate: new Date().toISOString(), history: [] };
  const card = {
    ...current,
    ...calculateSM2(rating, current.repetitions, current.interval, current.easeFactor),
    lastReviewedAt: new Date().toISOString(),
    history: [...(current.history ?? []), rating],
  };
  state.flashcards[cardId] = card;
  recordActivity(state);
  writeUserState(state);
  return json({ success: true, card });
}

// Schedules the next from-scratch re-solve of a DSA problem using SM-2.
function reviewProblem(body: Body): Response {
  const { problemId, quality: rating } = body;
  if (!text(problemId, 200) || !problemId) return json({ error: "Unknown problem." }, 400);
  if (!quality(rating)) return json({ error: "Quality must be an integer from 0 to 5." }, 400);
  const state = readUserState();
  const current = state.progress[problemId] ?? { solved: false };
  const previous = current.review;
  const schedule = calculateSM2(rating, previous?.repetitions ?? 0, previous?.interval ?? 1, previous?.easeFactor ?? 2.5);
  const now = new Date().toISOString();
  // A rating is only offered after passing every test, so it also counts as a solve.
  state.progress[problemId] = {
    ...current,
    solved: true,
    solvedAt: current.solvedAt ?? now,
    review: { ...schedule, lastReviewedAt: now, history: [...(previous?.history ?? []), rating].slice(-REVIEW_HISTORY_KEPT) },
  };
  recordActivity(state);
  writeUserState(state);
  return json({ success: true, progress: state.progress[problemId] });
}

function parseTestResults(text: string): unknown {
  const start = text.lastIndexOf("JSON_OUTPUT_START");
  const end = text.lastIndexOf("JSON_OUTPUT_END");
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start + "JSON_OUTPUT_START".length, end).trim()); } catch { return null; }
}

/**
 * Runs Python in the browser. Body: { code, testWrapper?, imports? }; testWrapper, when given, is the
 * full script to run (a test harness around `code`). The response matches the old server runner:
 * { success, exitCode, runtimeMs, stdout, stderr, testResults, timeout?, error? }.
 */
async function execute(body: Body, signal?: AbortSignal | null): Promise<Response> {
  const { code, testWrapper, imports } = body;
  if (typeof code !== "string" || !code.trim()) return json({ error: "No code provided" }, 400);
  if (testWrapper !== undefined && typeof testWrapper !== "string") return json({ error: "testWrapper must be a string." }, 400);
  if (code.length > CODE_LIMIT) return json({ error: `Code must be under ${CODE_LIMIT.toLocaleString("en-US")} characters.` }, 413);
  const script = testWrapper || code;
  const run = await runPython(script, {
    imports: `${code}\n${typeof imports === "string" ? imports : ""}`,
    timeoutMs: RUN_TIMEOUT_MS,
    checkTimeoutMs: script.includes(PROGRESS_PREFIX) ? BROWSER_CHECK_KILL_MS : undefined,
    signal: signal ?? undefined,
  });
  if (signal?.aborted) throw new DOMException("The run was cancelled.", "AbortError");
  // Pyodide reports Python exceptions as one message; show it where the old runner put stderr.
  const failed = Boolean(run.error);
  return json({
    success: !failed, exitCode: failed ? 1 : 0, runtimeMs: run.runtimeMs,
    stdout: run.output, stderr: run.timedOut ? "" : run.error ?? "",
    testResults: parseTestResults(run.output),
    ...(run.timedOut ? { timeout: true, error: `${run.error} Check for infinite loops or very slow code.` } : {}),
  });
}

async function readBody(init?: RequestInit): Promise<Body | null> {
  if (typeof init?.body !== "string") return null;
  try { const value: unknown = JSON.parse(init.body); return isRecord(value) ? value : null; } catch { return null; }
}

/** Drop-in for fetch() against the former /api/* routes. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, "http://local");
  const method = (init?.method ?? "GET").toUpperCase();
  try {
    const body = method === "POST" ? await readBody(init) : null;
    if (method === "POST" && !body) return json({ error: "Send a JSON object." }, 400);
    switch (`${method} ${url.pathname}`) {
      case "GET /api/state": return json(readUserState());
      case "POST /api/state": return updateState(body!);
      case "GET /api/star": return json(readUserState().starStories);
      case "POST /api/star": return saveStory(body!);
      case "DELETE /api/star": return deleteStory(url.searchParams.get("id"));
      case "POST /api/flashcards/review": return reviewFlashcard(body!);
      case "POST /api/dsa/review": return reviewProblem(body!);
      case "POST /api/execute": return await execute(body!, init?.signal);
      default: return json({ error: `No handler for ${method} ${url.pathname}` }, 404);
    }
  } catch (error) {
    if (init?.signal?.aborted) throw new DOMException("The run was cancelled.", "AbortError");
    return json({ error: error instanceof Error ? error.message : "Something went wrong." }, 500);
  }
}
