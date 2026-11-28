// All server calls of the level page. Every AI prompt is built on the server
// (Module 3, /api/mentor/...) and quizzes are generated and graded on the
// server (Module 2.2, /api/assessment/...). Lessons, lesson cards and practice
// sets are cached on the server, so a second visit loads at once.

import { apiRequest } from "../../utils/api";
import { mentor } from "../../utils/mentor";
import { SERVER_LANG } from "./levelData";

const base = (ctx, extra = {}) => ({
  language: ctx.language,
  levelIndex: ctx.levelIndex,
  uiLang: SERVER_LANG[ctx.uiLang] || "English",
  ...extra,
});

/* ---------- Lesson tab ---------- */
export const loadOverview = (ctx, { fresh = false } = {}) => mentor("overview", base(ctx, { fresh }));
export const loadFullLesson = (ctx, { fresh = false } = {}) => mentor("lesson", base(ctx, { fresh })).then((r) => r.text || "");
export const loadExample = (ctx) => mentor("example", base(ctx)).then((r) => r.text || "");

/* ---------- Exercises tab: { practiceId, exercises:[{title, description, expectedOutput, starterCode}] } ---------- */
export const loadPractice = (ctx, { fresh = false } = {}) => mentor("practice", base(ctx, { fresh }));
export const askSolution = (ctx, practiceId, index) => mentor("solution", base(ctx, { practiceId, index })).then((r) => r.text || "");

/* ---------- 3-step Socratic hints: target = {type:"lesson"} | {type:"practice", practiceId, index, code} | {type:"quiz", attemptId, index} ---------- */
export const askHint = (ctx, step, target) => mentor("hint", base(ctx, { step, target })).then((r) => r.text || "");

/* ---------- AI tutor chat and AI pair programming ---------- */
export const askTutor = (ctx, question, history) => mentor("ask", base(ctx, { question, history })).then((r) => r.text || "");
export const askPair = (ctx, { action, code, message = "", error = "", task = "", history = [] }) =>
  mentor("pair", base(ctx, { action, code, message, error, task, history })).then((r) => r.text || "");

/* ---------- MCQs: generated and graded on the server ---------- */
export const startQuiz = (ctx) => apiRequest(`/api/assessment/${ctx.language}/${ctx.levelIndex}/start`, { method: "POST" });
export const answerQuiz = (attemptId, index, choice) => apiRequest(`/api/assessment/attempt/${attemptId}/answer`, { method: "POST", body: { index, choice } });
export const finishQuiz = (attemptId) => apiRequest(`/api/assessment/attempt/${attemptId}/finish`, { method: "POST" });

// History in the shape the server expects: [{ role: "user" | "assistant", content }]
export const toHistory = (messages) =>
  messages.filter((m) => m.who === "me" || m.who === "ai").slice(-8).map((m) => ({ role: m.who === "me" ? "user" : "assistant", content: m.text }));
