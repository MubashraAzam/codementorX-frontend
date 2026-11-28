// Thin layer over the Module 4 runner (src/runner): Python and JavaScript run
// in the browser, React shows a live preview, C++/Java run on the server
// (Piston first, Judge0 backup). Also turns the Module 4.2 Python trace into
// friendly "what happened, step by step" rows.

import { runCode as runAny, traceCode, canVisualize, runsInBrowser } from "../../runner";

export { canVisualize, runsInBrowser };

/** returns { ok, stdout, stderr, preview?, ms } */
export function runCode(language, code, stdin = "") {
  return runAny(language, code, stdin);
}

export function trace(code, stdin = "") {
  return traceCode(code, stdin);
}

// The line number of a Python error ("File "main.py", line 4"), if any.
export function errorLine(stderr) {
  const m = String(stderr || "").match(/line (\d+)/g);
  return m ? Number(m[m.length - 1].replace(/\D/g, "")) : undefined;
}

// Lenient output check for exercises: ignores spaces, blank lines and prompt text before the answer.
export function outputMatches(actual, expected) {
  const norm = (s) => String(s ?? "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const want = norm(expected);
  const got = norm(actual);
  if (!want.length || got.length < want.length) return false;
  const tail = got.slice(-want.length);
  return want.every((w, i) => tail[i] === w || tail[i].toLowerCase().endsWith(w.toLowerCase()));
}

function show(snap) {
  if (!snap) return "";
  if (snap.v !== undefined) return snap.v;
  if (Array.isArray(snap.items)) {
    const inner = snap.items.slice(0, 6).map((x) => (Array.isArray(x) ? `${x[0]}: ${show(x[1])}` : show(x))).join(", ");
    const more = (snap.len || snap.items.length) > 6 ? ", …" : "";
    return snap.t === "dict" || snap.obj ? `{${inner}${more}}` : `[${inner}${more}]`;
  }
  return snap.t || "";
}

// steps: [{ line, event, vars }] from the Python tracer -> rows for the Code tab
export function explainTrace(steps, code) {
  const lines = (steps || []).filter((s) => s.event === "line");
  if (!lines.length) return [];
  const src = String(code).split("\n");
  const indent = (s) => (s || "").match(/^\s*/)[0].length;
  const rows = [];
  for (let i = 0; i < lines.length && rows.length < 60; i += 1) {
    const cur = lines[i];
    const next = lines[i + 1];
    const after = next ? next.vars : steps[steps.length - 1]?.vars || {};
    const before = cur.vars || {};
    const changed = Object.keys(after || {})
      .filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]))
      .map((k) => `${k} = ${show(after[k])}`)
      .join(", ");
    const text = (src[cur.line - 1] || "").trim();
    const cond = text.match(/^(if|elif|while)\s+(.+):\s*$/);
    let result = null;
    if (cond && next) result = next.line > cur.line && indent(src[next.line - 1]) > indent(src[cur.line - 1]) ? "True" : "False";
    rows.push({ line: cur.line, text: cond ? cond[2] : text, changed, result });
  }
  return rows;
}
