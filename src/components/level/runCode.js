// Runs the student's code.
//   Python      -> Pyodide in a web worker (in the browser, also records a step-by-step trace)
//   JavaScript  -> a web worker (in the browser)
//   C++ / Java  -> your backend runner (Piston first, Judge0 backup) at RUN_ENDPOINT
// Every run has a time limit, so an endless loop cannot freeze the page.

import { apiRequest } from "../../utils/api";

// ⚠️ If your backend code route has a different path, change only this line.
export const RUN_ENDPOINT = "/api/code/run";

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const TIME_LIMIT_MS = 10000;

const PY_RUNNER = `
import sys, json, builtins, traceback
__lines = __stdin.split("\\n") if __stdin else []
__steps = []
def __input(prompt=""):
    sys.stdout.write(str(prompt))
    if not __lines:
        raise EOFError("Your program asked for more input. Add a value in the Input box.")
    v = __lines.pop(0)
    if __echo:
        sys.stdout.write(v + "\\n")
    return v
builtins.input = __input
def __clean(d):
    out = {}
    for k, v in list(d.items()):
        if k.startswith("__") or callable(v) or type(v).__name__ == "module":
            continue
        r = repr(v)
        out[k] = r if len(r) <= 48 else r[:45] + "..."
    return out
def __tr(frame, event, arg):
    if frame.f_code.co_filename != "<student>":
        return __tr
    if event == "line" and len(__steps) < 300:
        __steps.append([frame.f_lineno, __clean(frame.f_locals)])
    return __tr
__g = {"__name__": "__main__"}
__err = None
try:
    __code = compile(__src, "<student>", "exec")
    if __trace:
        sys.settrace(__tr)
    exec(__code, __g)
except BaseException as e:
    sys.settrace(None)
    tb = traceback.extract_tb(e.__traceback__)
    ln = [f.lineno for f in tb if f.filename == "<student>"]
    if isinstance(e, SyntaxError):
        ln = [e.lineno]
    __err = {"line": ln[-1] if ln else None, "text": type(e).__name__ + ": " + str(e)}
finally:
    sys.settrace(None)
__steps.append([0, __clean(__g)])
json.dumps({"steps": __steps if __trace else [], "error": __err})
`;

const PY_WORKER = `
importScripts("${PYODIDE_URL}pyodide.js");
let py = null;
self.onmessage = async (e) => {
  const { code, stdin, trace, echo } = e.data;
  let out = "";
  try {
    if (!py) { self.postMessage({ type: "loading" }); py = await loadPyodide({ indexURL: "${PYODIDE_URL}" }); }
    const dec = new TextDecoder();
    py.setStdout({ write: (b) => { out += dec.decode(b); return b.length; } });
    py.setStderr({ write: (b) => { out += dec.decode(b); return b.length; } });
    py.globals.set("__src", code);
    py.globals.set("__stdin", stdin || "");
    py.globals.set("__trace", !!trace);
    py.globals.set("__echo", echo !== false);
    const res = JSON.parse(py.runPython(${JSON.stringify(PY_RUNNER)}));
    self.postMessage({ type: "done", output: out, steps: res.steps, error: res.error });
  } catch (err) {
    self.postMessage({ type: "done", output: out, steps: [], error: { line: null, text: String(err && err.message || err) } });
  }
};`;

const JS_WORKER = `
self.onmessage = (e) => {
  const { code, stdin } = e.data;
  const lines = (stdin || "").split("\\n");
  let out = "";
  const fmt = (a) => a.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join(" ");
  self.console = { log: (...a) => { out += fmt(a) + "\\n"; }, error: (...a) => { out += fmt(a) + "\\n"; }, warn: (...a) => { out += fmt(a) + "\\n"; } };
  self.prompt = (q) => { if (q) out += q; const v = lines.length ? lines.shift() : null; if (v !== null) out += v + "\\n"; return v; };
  try { new Function(code)(); self.postMessage({ output: out, error: null }); }
  catch (err) { self.postMessage({ output: out, error: { line: null, text: String(err) } }); }
};`;

const workers = {};
function getWorker(kind) {
  if (!workers[kind]) {
    const src = kind === "python" ? PY_WORKER : JS_WORKER;
    workers[kind] = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  }
  return workers[kind];
}
function killWorker(kind) {
  workers[kind]?.terminate();
  delete workers[kind];
}

let pyLoaded = false;

function runInWorker(kind, payload, onStatus) {
  return new Promise((resolve) => {
    const w = getWorker(kind);
    // the first Python run also downloads Pyodide, so it gets more time
    const limit = kind === "python" && !pyLoaded ? 60000 : TIME_LIMIT_MS;
    const timer = setTimeout(() => {
      killWorker(kind);
      if (kind === "python") pyLoaded = false;
      resolve({ output: "", steps: [], error: { line: null, text: "Your program took too long. Is there an endless loop?" } });
    }, limit);
    w.onmessage = (e) => {
      if (e.data?.type === "loading") {
        onStatus?.("Loading Python (only the first time)…");
        return;
      }
      clearTimeout(timer);
      if (kind === "python") pyLoaded = true;
      resolve({ output: e.data.output || "", steps: e.data.steps || [], error: e.data.error || null });
    };
    w.onerror = (e) => {
      clearTimeout(timer);
      killWorker(kind);
      resolve({ output: "", steps: [], error: { line: null, text: e.message || "Could not start the code runner." } });
    };
    w.postMessage(payload);
  });
}

/**
 * runCode({ language, code, stdin, trace, echo, onStatus })
 * returns { output, error: {line, text} | null, steps: [[line, vars], ...] }
 */
export async function runCode({ language, code, stdin = "", trace = false, echo = true, onStatus }) {
  if (language === "python") return runInWorker("python", { code, stdin, trace, echo }, onStatus);
  if (language === "javascript") return runInWorker("javascript", { code, stdin }, onStatus);
  try {
    onStatus?.("Running on the server…");
    const res = await apiRequest(RUN_ENDPOINT, { method: "POST", body: { language, code, stdin } });
    const output = res?.stdout ?? res?.output ?? res?.run?.stdout ?? "";
    const errText = res?.compile_output || res?.stderr || res?.run?.stderr || res?.error || "";
    return { output, error: errText ? { line: null, text: String(errText).trim() } : null, steps: [] };
  } catch (err) {
    return { output: "", error: { line: null, text: err?.message || "The code server is not reachable right now." }, steps: [] };
  }
}

// Compares program output with the expected output of a test.
// Lenient: ignores extra spaces, and allows prompt text before the answer on a line.
export function outputMatches(actual, expected) {
  const norm = (s) => String(s ?? "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const want = norm(expected);
  const got = norm(actual);
  if (!want.length) return got.length === 0;
  if (got.length < want.length) return false;
  const tail = got.slice(-want.length);
  return want.every((w, i) => tail[i] === w || tail[i].toLowerCase().endsWith(w.toLowerCase()));
}

/* ---------- turn a Python trace into friendly "what happened" rows ---------- */
export function explainTrace(steps, code) {
  if (!steps?.length) return [];
  const src = code.split("\n");
  const indent = (s) => (s || "").match(/^\s*/)[0].length;
  const rows = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    const [line, before] = steps[i];
    const after = steps[i + 1][1];
    const text = (src[line - 1] || "").trim();
    const changed = Object.keys(after).filter((k) => after[k] !== before[k]).map((k) => `${k} = ${after[k]}`);
    let result = null;
    const cond = text.match(/^(if|elif|while)\s+(.+):\s*$/);
    if (cond) {
      const next = steps[i + 1][0];
      const inside = next > line && indent(src[next - 1]) > indent(src[line - 1]);
      result = inside ? "True" : "False";
    }
    rows.push({ line, text: cond ? cond[2] : text, changed: changed.join(", "), result });
    if (rows.length >= 60) break;
  }
  return rows;
}
