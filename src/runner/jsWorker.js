// Module 4.1 — runs student JavaScript in a Web Worker (separate thread, no
// access to the page). console.log output and prompt() input are captured.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function format(value) {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    const s = JSON.stringify(value, null, 0);
    return s === undefined ? String(value) : s;
  } catch {
    return String(value);
  }
}

self.onmessage = async (e) => {
  const { id, code, stdin } = e.data;
  const out = [];
  let failed = null;
  const lines = (stdin || "").split("\n");
  let next = 0;
  const log = (...a) => out.push(a.map(format).join(" "));
  const fakeConsole = { log, info: log, warn: log, error: log, debug: log, table: (x) => log(x) };
  const prompt = (msg = "") => {
    const v = next < lines.length && (stdin || "") !== "" ? lines[next++] : null;
    out.push(`${msg}${v ?? ""}`);
    return v;
  };
  self.postMessage({ id, type: "ready" });
  try {
    const fn = new AsyncFunction("console", "prompt", "alert", "document", "window", code);
    await fn(fakeConsole, prompt, (m) => log(String(m)), undefined, undefined);
    // let short timers (setTimeout / promises) finish
    await new Promise((r) => setTimeout(r, 300));
  } catch (err) {
    const msg = err && err.message ? `${err.name}: ${err.message}` : String(err);
    failed = /document|window/.test(msg) && /undefined|null/.test(msg)
      ? `${msg}\n(This runner has no web page. DOM code like document.querySelector needs the browser page; test your logic here, or use the React track's preview.)`
      : msg;
  }
  self.postMessage({ id, type: "result", result: { stdout: out.join("\n") + (out.length ? "\n" : ""), stderr: failed || "", ok: !failed } });
};
