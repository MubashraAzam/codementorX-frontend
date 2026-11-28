// All AI calls of the level page live here.
// Results are cached in localStorage per language + level + UI language,
// so opening a level again is instant and does not spend AI calls.
// "Regenerate" buttons pass { fresh: true } to skip the cache.

import { apiRequest } from "../../utils/api";
import { fallbackOverview, fallbackQuiz, LANGS, QUIZ_SIZE, topicsOf } from "./levelData";

export async function callAI(prompt) {
  const data = await apiRequest("/api/ai/ask", { method: "POST", body: { prompt } });
  return data?.text || "";
}

function cacheKey(ctx, kind) {
  return `cmx_lvl:${ctx.language}:${ctx.levelIndex}:${kind}:${ctx.uiLang}`;
}
function readCache(ctx, kind) {
  try {
    const raw = localStorage.getItem(cacheKey(ctx, kind));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeCache(ctx, kind, value) {
  try {
    localStorage.setItem(cacheKey(ctx, kind), JSON.stringify(value));
  } catch {
    /* storage full or blocked — ignore */
  }
}

export function parseJSON(text) {
  if (!text) return null;
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  const starts = [clean.indexOf("{"), clean.indexOf("[")].filter((i) => i >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

function urduLine(ctx) {
  return ctx.uiLang === "ur"
    ? "Write the explanations in simple Urdu (Urdu script). Keep all code, keywords and program output in English."
    : "Use simple English for a beginner.";
}

function about(ctx) {
  const L = LANGS[ctx.language]?.name || "Python";
  return `${L} level ${ctx.levelIndex + 1} "${ctx.level.title}" (topics: ${topicsOf(ctx.level).join(", ")})`;
}

async function cached(ctx, kind, fresh, make) {
  if (!fresh) {
    const hit = readCache(ctx, kind);
    if (hit) return hit;
  }
  const value = await make();
  if (value) writeCache(ctx, kind, value);
  return value;
}

/* ---------- 1. overview cards (big idea, diagram, flip cards, mistake, recap, code example) ---------- */
export function loadOverview(ctx, { fresh = false } = {}) {
  const L = LANGS[ctx.language]?.name || "Python";
  return cached(ctx, "overview", fresh, async () => {
    const prompt = `You are designing a lesson page for ${about(ctx)}. ${urduLine(ctx)}
Return ONLY valid JSON, no markdown, with exactly this shape:
{
 "bigIdea": "2 or 3 short sentences. Wrap code words in backticks and key words in **double stars**.",
 "flow": ONE of these two:
   {"type":"decision","title":"How ${L} decides","checks":[{"cond":"age >= 18","result":"You can vote!"},{"cond":"age >= 16","result":"Almost there!"}],"else":"Too young","samples":[{"label":"age 12","hit":2},{"label":"age 17","hit":1},{"label":"age 20","hit":0}]}
   or {"type":"steps","title":"How it works","steps":[{"label":"short step","detail":"3 to 6 words"}]} with 3 to 5 steps,
 "cards": [{"front":"==","label":"equal","back":"5 == 5 → True"}] with 4 to 6 cards of the key syntax of this level,
 "mistake": {"title":"short title","text":"1 or 2 sentences","wrong":"one wrong line of code","right":"the fixed line"},
 "recap": ["4 short points the student now knows"],
 "example": {"file":"main.${LANGS[ctx.language]?.ext || "py"}","code":"a short runnable ${L} program (max 14 lines) that shows this level; read input from the user if it helps","inputs":["3 example inputs, one per run. Put \\n between values if the program reads several values. Use [] if it reads nothing"]}
}
Use "decision" ONLY when the level is about conditions or branching. "hit" is the index of the check that runs for that sample (use checks.length for else).`;
    const data = parseJSON(await callAI(prompt));
    if (!data || typeof data !== "object" || !data.bigIdea) return null;
    const fb = fallbackOverview(ctx.level, L);
    return {
      bigIdea: String(data.bigIdea),
      flow: data.flow && (data.flow.checks?.length || data.flow.steps?.length) ? data.flow : fb.flow,
      cards: Array.isArray(data.cards) && data.cards.length ? data.cards.slice(0, 6) : fb.cards,
      mistake: data.mistake?.title ? data.mistake : fb.mistake,
      recap: Array.isArray(data.recap) && data.recap.length ? data.recap.slice(0, 5) : fb.recap,
      example: data.example?.code ? { ...data.example, inputs: Array.isArray(data.example.inputs) ? data.example.inputs : [] } : fb.example,
    };
  }).then((v) => v || fallbackOverview(ctx.level, L));
}

/* ---------- 2. the full lesson (long markdown, like the old page) ---------- */
export function loadFullLesson(ctx, { fresh = false } = {}) {
  const L = LANGS[ctx.language] || LANGS.python;
  return cached(ctx, "lesson", fresh, async () => {
    const prompt = `You are an expert ${L.name} tutor. Create a comprehensive lesson on "${ctx.level.title}" covering: ${ctx.level.sub}.
Structure: 6 to 10 sections, each starting with a "## " heading (start directly with the first ## heading, no title line).
Include: clear explanations, key concepts, syntax examples in \`\`\`${L.fence} code blocks with the expected output after them, tips, common mistakes and a short summary section at the end.
${urduLine(ctx)}`;
    const text = await callAI(prompt);
    return text && text.length > 200 ? text : null;
  });
}

/* ---------- 3. exercises with tests ---------- */
export function loadExercises(ctx, { fresh = false } = {}) {
  const L = LANGS[ctx.language]?.name || "Python";
  return cached(ctx, "exercises", fresh, async () => {
    const prompt = `Create 3 practice exercises for ${about(ctx)}, from easy to harder. ${urduLine(ctx)}
Each program reads its input from the user (${ctx.language === "cpp" ? "cin" : "input() with NO prompt text"}) and prints only the answer.
Return ONLY a JSON array, no markdown:
[{"title":"short title","tags":"2 or 3 keywords","task":"what to build in 2 or 3 sentences","starter":"a few lines of ${L} starter code with comments, or an empty string","tests":[{"input":"85","output":"A"}],"hint":"one helpful sentence, no full solution"}]
Give each exercise 3 tests. Put \\n between values when the program reads several. "output" must be exactly what the correct program prints.`;
    const data = parseJSON(await callAI(prompt));
    if (!Array.isArray(data) || !data.length) return null;
    return data.slice(0, 3).map((x, i) => ({
      title: x.title || `Exercise ${i + 1}`,
      tags: x.tags || "",
      task: x.task || "",
      starter: x.starter || "",
      hint: x.hint || "",
      tests: Array.isArray(x.tests) ? x.tests.filter((t) => t && t.output !== undefined).slice(0, 4) : [],
    }));
  });
}

/* ---------- 4. ten MCQs, only about what the lesson taught ---------- */
export function loadQuiz(ctx, { fresh = false } = {}) {
  return cached(ctx, "quiz", fresh, async () => {
    const lessonMd = readCache(ctx, "lesson") || "";
    const headings = (lessonMd.match(/^##\s+.+$/gm) || []).map((h) => h.replace(/^##\s+/, "").replace(/[*`#]/g, "").trim()).slice(0, 12);
    const covered = headings.length ? ` The lesson had these sections: ${headings.join("; ")}.` : "";
    const prompt = `Create exactly ${QUIZ_SIZE} multiple-choice questions for ${about(ctx)}.${covered}
Ask ONLY about things this lesson taught. Mix: concept questions, "what does this code print?" questions and "find the mistake" questions. ${urduLine(ctx)}
Return ONLY a JSON array, no markdown:
[{"q":"question text","code":"optional short code snippet or empty string","opts":["A","B","C","D"],"ans":0,"exp":"why the right answer is right, 1 sentence","hint":"a nudge that does not give the answer"}]
"ans" is the 0-based index of the correct option. Vary the position of the right answer.`;
    const data = parseJSON(await callAI(prompt));
    if (!Array.isArray(data)) return null;
    const ok = data.filter((q) => q && q.q && Array.isArray(q.opts) && q.opts.length >= 2 && Number.isInteger(q.ans) && q.ans < q.opts.length);
    return ok.length >= 5 ? ok.slice(0, QUIZ_SIZE) : null;
  }).then((v) => v || fallbackQuiz(ctx.level));
}

/* ---------- small helpers ---------- */
export function askTutor(ctx, question, history = []) {
  const L = LANGS[ctx.language]?.name || "Python";
  const past = history.slice(-4).map((m) => `${m.who === "me" ? "Student" : "Tutor"}: ${m.text}`).join("\n");
  const prompt = `You are CodeMentorX, a kind ${L} tutor. The student is on ${about(ctx)}.
${ctx.uiLang === "ur" ? "Answer in simple Urdu (Urdu script); keep code in English." : "Answer in simple English."} Keep it under 90 words. Use a tiny code block only if it really helps.
${past ? `Recent chat:\n${past}\n` : ""}Student: ${question}`;
  return callAI(prompt);
}

export function askHint(ctx, what) {
  return callAI(`Give a short, encouraging hint (2 sentences, no full solution) for a student on ${about(ctx)}. ${what} ${urduLine(ctx)}`);
}

export function askSolution(ctx, exercise) {
  const L = LANGS[ctx.language] || LANGS.python;
  return callAI(`Give the complete ${L.name} solution for this exercise with a short explanation. Exercise: ${exercise.title}. ${exercise.task} Put the code in a \`\`\`${L.fence} block. ${urduLine(ctx)}`);
}

export function askCodeReview(ctx, code, output) {
  const L = LANGS[ctx.language]?.name || "Python";
  return callAI(`A beginner on ${about(ctx)} wrote this ${L} code:\n\`\`\`\n${code}\n\`\`\`\nIt printed:\n${output || "(nothing)"}\nIn under 80 words: say if it is correct, point out one improvement or bug, and praise one thing. ${urduLine(ctx)}`);
}
