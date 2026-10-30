import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, SkipBack, RefreshCw } from "lucide-react";
import { traceCode } from "../runner";

/**
 * Module 4.2 — Live code execution visualizer (Python).
 * Runs the program once with a tracer, then lets the student step through it:
 * the current line is highlighted, variables are shown as boxes (lists and
 * dicts as cells), with the call stack and the output so far.
 */
export default function Visualizer({ code, stdin, onClose }) {
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState("");
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    traceCode(code, stdin).then((r) => {
      if (cancelled) return;
      if (r.steps) setTrace(r);
      else setError(r.stderr || "Could not trace this program.");
    });
    return () => { cancelled = true; };
  }, [code, stdin]);

  const steps = useMemo(() => trace?.steps || [], [trace]);
  const step = steps[i];
  const last = steps.length - 1;

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => {
      if (i >= last) setPlaying(false);
      else setI((x) => Math.min(x + 1, last));
    }, 700);
    return () => clearTimeout(t);
  }, [playing, i, last]);

  // Highlight values that changed since the previous step.
  const changed = useMemo(() => {
    const prev = steps[i - 1]?.vars || {};
    const cur = step?.vars || {};
    return new Set(Object.keys(cur).filter((k) => JSON.stringify(cur[k]) !== JSON.stringify(prev[k])));
  }, [steps, step, i]);

  const lines = code.split("\n");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-label="Code visualizer">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#ECE7F4]">
          <div>
            <h3 className="font-heading font-black text-accent">Code Visualizer</h3>
            <p className="text-xs text-gray-400 font-semibold">Step through your program line by line</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" aria-label="Close visualizer"><X size={20} /></button>
        </div>

        {!trace && !error && <div className="p-10 text-center text-gray-400 font-bold"><RefreshCw className="mx-auto animate-spin mb-3 text-[#8B6FE8]" /> Running your program…</div>}
        {error && <div className="p-6 text-red-600 font-mono text-sm whitespace-pre-wrap">{error}</div>}

        {trace && (
          <>
            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#ECE7F4]">
              <button className="btn-game btn-secondary text-sm py-1.5 px-3" onClick={() => { setPlaying(false); setI(0); }} aria-label="First step"><SkipBack size={15} /></button>
              <button className="btn-game btn-secondary text-sm py-1.5 px-3" onClick={() => { setPlaying(false); setI((x) => Math.max(x - 1, 0)); }} disabled={i === 0}><ChevronLeft size={15} /> Back</button>
              <button className="btn-game btn-cute text-sm py-1.5 px-3" onClick={() => setPlaying((p) => !p)} disabled={!steps.length}>{playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Play</>}</button>
              <button className="btn-game btn-secondary text-sm py-1.5 px-3" onClick={() => { setPlaying(false); setI((x) => Math.min(x + 1, last)); }} disabled={i >= last}>Next <ChevronRight size={15} /></button>
              <input type="range" min={0} max={Math.max(last, 0)} value={i} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)); }} className="flex-1 min-w-[120px] accent-[#8B6FE8]" aria-label="Step" />
              <span className="text-xs font-bold text-gray-500">Step {steps.length ? i + 1 : 0} / {steps.length}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-0 flex-1 min-h-0 overflow-hidden">
              {/* CODE */}
              <div className="overflow-auto bg-[#1E2235] p-4 font-mono text-[13px] leading-6">
                {lines.map((text, n) => {
                  const active = step && step.line === n + 1;
                  return (
                    <div key={n} className={`flex rounded ${active ? "bg-[#F49B00]/25" : ""}`}>
                      <span className={`w-8 shrink-0 text-right pr-3 select-none ${active ? "text-[#F49B00] font-bold" : "text-gray-500"}`}>{active ? "➜" : n + 1}</span>
                      <span className="text-[#E6E9F5] whitespace-pre">{text || " "}</span>
                    </div>
                  );
                })}
              </div>

              {/* STATE */}
              <div className="overflow-auto p-5 space-y-5">
                {step && (
                  <div className="text-sm font-bold text-accent">
                    Line {step.line}
                    <span className="text-gray-400 font-semibold">
                      {step.event === "return" ? ` · returning from ${step.func}()` : step.event === "exception" ? " · an error happened here" : step.func !== "<module>" ? ` · inside ${step.func}()` : ""}
                    </span>
                  </div>
                )}
                {step?.event === "return" && step.ret && (
                  <div className="text-sm"><span className="font-bold text-accent">Return value: </span><Value v={step.ret} /></div>
                )}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">Variables</div>
                  {step && Object.keys(step.vars).length === 0 && <div className="text-sm text-gray-400">No variables yet.</div>}
                  <div className="space-y-2">
                    {step && Object.entries(step.vars).map(([name, v]) => (
                      <div key={name} className={`flex items-start gap-3 p-2 rounded-xl border ${changed.has(name) ? "border-[#F49B00] bg-[#FFF7EA]" : "border-[#ECE7F4]"}`}>
                        <span className="font-mono font-bold text-accent text-sm min-w-[70px]">{name}</span>
                        <Value v={v} />
                      </div>
                    ))}
                  </div>
                </div>
                {step?.stack?.length > 1 && (
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">Call stack</div>
                    <div className="flex flex-col-reverse gap-1">
                      {step.stack.map((f, k) => (
                        <div key={k} className={`font-mono text-xs px-3 py-1.5 rounded-lg ${k === step.stack.length - 1 ? "bg-[#EEF3FF] text-[#4F6BD8] font-bold" : "bg-gray-50 text-gray-500"}`}>{f === "<module>" ? "main program" : `${f}()`}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">Output so far</div>
                  <pre className="bg-[#1E2235] text-[#E6E9F5] rounded-xl p-3 text-xs font-mono whitespace-pre-wrap min-h-[48px]">{step?.out || ""}</pre>
                </div>
                {trace.truncated && <div className="text-xs text-[#C77800] font-bold">Showing the first 400 steps only.</div>}
                {trace.error && i === last && <pre className="text-xs text-red-600 whitespace-pre-wrap">{trace.error}</pre>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Value({ v }) {
  if (!v) return null;
  if (v.items && !v.obj && v.t !== "dict") {
    return (
      <div className="flex flex-wrap gap-1 items-end">
        <span className="text-[10px] text-gray-400 font-bold mr-1 self-center">{v.t}[{v.len}]</span>
        {v.items.map((x, k) => (
          <div key={k} className="flex flex-col items-center">
            <div className="min-w-[34px] px-2 py-1 border-2 border-[#C9D6FB] bg-[#EEF3FF] rounded-md font-mono text-xs text-accent text-center">{x.items ? `${x.t}[${x.len}]` : x.v}</div>
            {v.t !== "set" && <span className="text-[9px] text-gray-400 font-bold">{k}</span>}
          </div>
        ))}
        {v.len > v.items.length && <span className="text-xs text-gray-400">…</span>}
      </div>
    );
  }
  if (v.items) {
    return (
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
        <span className="col-span-2 text-[10px] text-gray-400 font-bold">{v.t}</span>
        {v.items.map(([k, x], j) => (
          <div key={j} className="contents">
            <span className="font-mono text-gray-500">{k}</span>
            <span className="font-mono text-accent">{x.items ? `${x.t}[${x.len}]` : x.v}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <span className="font-mono text-sm text-accent">
      {v.v} <span className="text-[10px] text-gray-400 font-bold">{v.t}</span>
    </span>
  );
}
