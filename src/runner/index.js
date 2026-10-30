import { apiRequest } from "../utils/api";
import { buildReactPreview } from "./reactPreview";

// Module 4.1 — one entry point to run code for any track.
//   python      → Pyodide in a Web Worker (in the browser, free)
//   javascript  → Web Worker (in the browser, free)
//   react       → sandboxed iframe preview (in the browser, free)
//   cpp / java  → backend → Judge0
const PYODIDE_URL = (import.meta.env.VITE_PYODIDE_URL || "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/").replace(/\/?$/, "/");
const RUN_TIMEOUT_MS = 10000;   // stops infinite loops
const LOAD_TIMEOUT_MS = 90000;  // first Python run downloads ~10 MB

let pyWorker = null;
let seq = 0;

function workerCall(makeWorker, getWorker, setWorker, message) {
  return new Promise((resolve) => {
    let worker = getWorker();
    if (!worker) { worker = makeWorker(); setWorker(worker); }
    const id = ++seq;
    let timer = setTimeout(() => finish({ ok: false, stdout: "", stderr: "Python could not start (check your internet connection)." , timeout: true }), LOAD_TIMEOUT_MS);
    function finish(result) {
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      resolve(result);
    }
    function onMessage(e) {
      if (e.data.id !== id) return;
      if (e.data.type === "ready") {
        clearTimeout(timer);
        timer = setTimeout(() => {
          worker.terminate(); setWorker(null); // a stuck loop: throw the worker away
          finish({ ok: false, stdout: "", stderr: `Stopped: the program ran longer than ${RUN_TIMEOUT_MS / 1000} seconds. Check for an infinite loop.`, timeout: true });
        }, RUN_TIMEOUT_MS);
      } else if (e.data.type === "result") finish(e.data.result);
      else if (e.data.type === "error") finish({ ok: false, stdout: "", stderr: e.data.message });
    }
    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, ...message });
  });
}

const python = (message) =>
  workerCall(() => new Worker(new URL("./pyWorker.js", import.meta.url)), () => pyWorker, (w) => { pyWorker = w; }, { ...message, indexURL: PYODIDE_URL });

function javascript(message) {
  let jsWorker = null; // fresh worker every run: no state leaks between runs
  return workerCall(() => new Worker(new URL("./jsWorker.js", import.meta.url)), () => jsWorker, (w) => { jsWorker = w; }, message)
    .finally(() => jsWorker?.terminate());
}

export async function runCode(language, code, stdin = "") {
  const started = performance.now();
  let result;
  if (language === "python") result = await python({ type: "run", code, stdin });
  else if (language === "javascript") result = await javascript({ code, stdin });
  else if (language === "react") {
    try {
      result = { ok: true, preview: buildReactPreview(code), stdout: "", stderr: "" };
    } catch (err) {
      result = { ok: false, stdout: "", stderr: err.message };
    }
  } else {
    try {
      const r = await apiRequest("/api/code/run", { method: "POST", body: { language, code, stdin } });
      result = { ok: r.ok, stdout: r.stdout, stderr: [r.compileOutput, r.stderr].filter(Boolean).join("\n"), status: r.status, time: r.time };
    } catch (err) {
      result = { ok: false, stdout: "", stderr: err.message };
    }
  }
  return { ...result, ms: Math.round(performance.now() - started) };
}

// Module 4.2 — step-by-step execution trace (Python).
export function traceCode(code, stdin = "") {
  return python({ type: "trace", code, stdin });
}

export const canVisualize = (language) => language === "python";
export const runsInBrowser = (language) => ["python", "javascript", "react"].includes(language);
