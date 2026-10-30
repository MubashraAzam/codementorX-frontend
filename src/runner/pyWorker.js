/* eslint-disable no-undef */
// Module 4.1 / 4.2 — runs student Python inside the browser with Pyodide
// (CPython compiled to WebAssembly). Nothing is sent to a server.
// Classic worker: loaded with importScripts from the Pyodide CDN.
let pyodideReady = null;

const RUNNER_PY = String.raw`
import sys, io, json, traceback, contextlib

def _cmx_input_factory(stdin_text, out):
    lines = iter(stdin_text.split("\n")) if stdin_text else iter([])
    def _input(prompt=""):
        out.write(str(prompt))
        try:
            value = next(lines)
        except StopIteration:
            raise EOFError("Your program asked for input, but the Input box has no more lines.")
        out.write(value + "\n")
        return value
    return _input

def _cmx_clean_tb(exc):
    lines = traceback.format_exception(type(exc), exc, exc.__traceback__)
    keep = [l for l in lines if "<student>" in l or not l.startswith("  File")]
    text = "".join(keep).replace("<student>", "main.py")
    # drop the frames pyodide/our runner add
    return "\n".join(l for l in text.splitlines() if "_pyodide" not in l and "_cmx_" not in l)

def _cmx_snap(v, depth=0):
    if v is None or isinstance(v, (bool, int, float)):
        return {"t": type(v).__name__, "v": repr(v)}
    if isinstance(v, str):
        return {"t": "str", "v": repr(v if len(v) <= 200 else v[:200] + "…")}
    if isinstance(v, (list, tuple, set)) and depth < 2:
        items = list(v)[:30]
        return {"t": type(v).__name__, "items": [_cmx_snap(x, depth + 1) for x in items], "len": len(v)}
    if isinstance(v, dict) and depth < 2:
        return {"t": "dict", "items": [[repr(k)[:40], _cmx_snap(x, depth + 1)] for k, x in list(v.items())[:30]], "len": len(v)}
    if hasattr(v, "__dict__") and depth < 1 and not isinstance(v, type):
        return {"t": type(v).__name__, "items": [[k, _cmx_snap(x, depth + 1)] for k, x in list(vars(v).items())[:20] if not k.startswith("__")], "obj": True}
    r = repr(v)
    return {"t": type(v).__name__, "v": r if len(r) <= 120 else r[:120] + "…"}

def _cmx_globals(stdin_text, out):
    return {"__name__": "__main__", "input": _cmx_input_factory(stdin_text, out)}

def _cmx_run(src, stdin_text):
    out = io.StringIO()
    err = None
    try:
        code = compile(src, "<student>", "exec")
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            exec(code, _cmx_globals(stdin_text, out))
    except BaseException as e:
        err = _cmx_clean_tb(e)
    return json.dumps({"stdout": out.getvalue(), "stderr": err or "", "ok": err is None})

_CMX_MAX_STEPS = 400

def _cmx_trace(src, stdin_text):
    out = io.StringIO()
    steps = []
    stopped = [False]
    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<student>":
            return tracer
        if event in ("line", "return", "exception"):
            if len(steps) >= _CMX_MAX_STEPS:
                stopped[0] = True
                raise RuntimeError("_cmx_stop")
            names = {}
            for k, v in frame.f_locals.items():
                if k.startswith("__") or callable(v) or type(v).__name__ == "module":
                    continue
                names[k] = _cmx_snap(v)
            stack, f = [], frame
            while f is not None and f.f_code.co_filename == "<student>":
                stack.append(f.f_code.co_name)
                f = f.f_back
            steps.append({
                "line": frame.f_lineno, "event": event, "func": frame.f_code.co_name,
                "stack": stack[::-1], "vars": names, "out": out.getvalue()[-3000:],
                "ret": _cmx_snap(arg) if event == "return" else None,
            })
        return tracer
    err = None
    try:
        code = compile(src, "<student>", "exec")
        sys.settrace(tracer)
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            exec(code, _cmx_globals(stdin_text, out))
    except BaseException as e:
        if not stopped[0]:
            err = _cmx_clean_tb(e)
    finally:
        sys.settrace(None)
    return json.dumps({"steps": steps, "error": err, "output": out.getvalue(), "truncated": stopped[0]})
`;

function load(indexURL) {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      importScripts(indexURL + "pyodide.js");
      const py = await loadPyodide({ indexURL });
      py.runPython(RUNNER_PY);
      return py;
    })();
  }
  return pyodideReady;
}

self.onmessage = async (e) => {
  const { id, type, code, stdin, indexURL } = e.data;
  try {
    const py = await load(indexURL);
    self.postMessage({ id, type: "ready" });
    const fn = py.globals.get(type === "trace" ? "_cmx_trace" : "_cmx_run");
    const json = fn(code, stdin || "");
    fn.destroy();
    self.postMessage({ id, type: "result", result: JSON.parse(json) });
  } catch (err) {
    self.postMessage({ id, type: "error", message: String(err && err.message ? err.message : err) });
  }
};
