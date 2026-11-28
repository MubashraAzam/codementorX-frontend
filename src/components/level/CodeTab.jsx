import { useEffect, useState } from "react";
import CodeEditor from "../CodeEditor";
import Visualizer from "../Visualizer";
import { canVisualize, errorLine, explainTrace, runCode, runsInBrowser, trace } from "./runCode";
import { Icon, InlineMd } from "./ui";

/**
 * Code tab = Module 4.1 in-browser IDE + 4.2 visualiser, in the new design.
 * The AI pair partner (Module 3.2) is in the right-hand panel and always sees this code.
 */
export default function CodeTab({ ctx, langName, code, setCode, starter, task, onClearTask, example, onAskPartner, onNext }) {
  const inputs = (example?.inputs || []).map(String).slice(0, 4);
  const [stdin, setStdin] = useState(inputs[0] || "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null); // { ok, stdout, stderr, preview, ms }
  const [rows, setRows] = useState([]);
  const [traceNote, setTraceNote] = useState("");
  const [shown, setShown] = useState(0);
  const [visualize, setVisualize] = useState(false);
  const [previewLog, setPreviewLog] = useState([]);
  const lang = ctx.language;
  const isReact = lang === "react";

  // console output / errors from the React preview iframe
  useEffect(() => {
    if (!isReact) return undefined;
    const onMsg = (e) => {
      if (!e.data?.cmxPreview || e.data.kind === "ready") return;
      setPreviewLog((l) => [...l.slice(-49), { kind: e.data.kind, text: e.data.text }]);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [isReact]);

  // play the trace: highlight each executed line one after another
  useEffect(() => {
    if (!rows.length) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= rows.length) clearInterval(id);
    }, rows.length > 20 ? 120 : 360);
    return () => clearInterval(id);
  }, [rows]);

  async function run(nextInput = stdin) {
    if (running || !code.trim()) return;
    setRunning(true);
    setResult(null);
    setRows([]);
    setShown(0);
    setTraceNote("");
    setPreviewLog([]);
    const input = nextInput.replace(/\\n/g, "\n");
    const r = await runCode(lang, code, input);
    setResult(r);
    setRunning(false);
    if (lang === "python" && r.ok) {
      const t = await trace(code, input);
      if (t?.truncated) setTraceNote("This program runs too many steps to list here. Press Visualize to step through it.");
      else setRows(explainTrace(t?.steps, code));
    }
  }

  const runLine = shown > 0 && shown <= rows.length ? rows[shown - 1]?.line : undefined;
  const errLine = result && !result.ok ? errorLine(result.stderr) : undefined;
  const status = running
    ? lang === "python" && !result ? "Starting Python… the first run takes a few seconds" : "Running…"
    : result?.ms != null ? `${result.ok ? "Finished" : "Stopped"} in ${(result.ms / 1000).toFixed(1)}s` : runsInBrowser(lang) ? "Runs in your browser" : "Runs on the server";

  return (
    <div className="stack">
      <article className="card">
        <div className="row">
          <h3><span className="ic"><Icon name="code" /></span>Code lab</h3>
          <div className="lab-tools">
            <span className="kk">{isReact ? "Edit the component, press Preview" : "Edit the code, give an input, press Run"}</span>
            {example?.code && <button type="button" className="btn gh sm" onClick={() => setCode(example.code)}>Load example</button>}
            <button type="button" className="btn gh sm" onClick={() => setCode(starter)}>Clear</button>
          </div>
        </div>
        {task && (
          <div className="task" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p><b>Exercise · {task.title}.</b> <InlineMd text={task.description} /></p>
              {task.expectedOutput && <div className="exp"><span>Expected: {task.expectedOutput}</span></div>}
            </div>
            {task.starterCode && code !== task.starterCode && <button type="button" className="btn gh sm" onClick={() => setCode(task.starterCode)}>Load starter code</button>}
            <button type="button" className="btn gh sm" onClick={onClearTask} aria-label="Close the exercise">✕</button>
          </div>
        )}
      </article>

      <div className="g2b">
        <div className="code editor">
          <div className="chead"><i /><i /><i /><span className="fn">{example?.file && !task ? example.file : `main.${isReact ? "jsx" : lang === "cpp" ? "cpp" : lang === "java" ? "java" : lang === "javascript" ? "js" : "py"}`}</span><span className="lg">{langName}</span></div>
          <div className={`cm-wrap${runLine ? " tracing" : ""}`} data-runline={runLine || ""} data-errline={errLine || ""}>
            <CodeEditor value={code} onChange={setCode} language={lang} height="340px" ariaLabel="Code lab editor" />
            {(runLine || errLine) && (
              <style>{`${runLine ? `.cmxl .cm-wrap .cm-content > .cm-line:nth-child(${runLine}){background:rgba(255,111,165,.2);box-shadow:inset 3px 0 0 #FF6FA5}` : ""}${errLine ? `.cmxl .cm-wrap .cm-content > .cm-line:nth-child(${errLine}){background:rgba(255,122,133,.18);box-shadow:inset 3px 0 0 #FF7A85}` : ""}`}</style>
            )}
          </div>
          <div className="edbar">
            <button type="button" className="btn run sm" onClick={() => run()} disabled={running || !code.trim()}><Icon name="play" />{running ? "Running…" : isReact ? "Preview" : "Run"}</button>
            {canVisualize(lang) && <button type="button" className="btn gh sm dark" onClick={() => setVisualize(true)} disabled={!code.trim()}>Visualize</button>}
            <button type="button" className="btn gh sm dark" onClick={() => onAskPartner("bugs")} disabled={!code.trim()}>Ask AI to check my code</button>
            <span className="status">{status}</span>
          </div>
        </div>

        <article className="card">
          {!isReact && (
            <>
              <div className="minihead"><span className="kk">Input</span><span className="kk" style={{ color: "var(--accent)" }}>one value per line · use \n</span></div>
              <div className="inrow">
                <input value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="Type input here, e.g. Ali\n20" aria-label="Program input" />
                {inputs.map((v) => (
                  <button key={v} type="button" className="chipbtn" onClick={() => { const t = v.replace(/\n/g, "\\n"); setStdin(t); run(t); }}>{v.replace(/\n/g, " · ")}</button>
                ))}
              </div>
            </>
          )}
          <div className="minihead"><span className="kk">{isReact ? "Live preview" : "Output"}</span></div>
          {result?.preview ? (
            <iframe title="React preview" sandbox="allow-scripts" srcDoc={result.preview} className="preview" />
          ) : (
            <div className="console">
              {!result && !running && previewLog.length === 0 && <span className="p">{isReact ? "Press Preview to see your component…" : "Press Run to see the output…"}</span>}
              {running && <span className="p">{status}</span>}
              {result && !result.preview && (
                <>
                  <span className="o">{result.stdout || (result.stderr ? "" : "(no output)")}</span>
                  {result.stderr && <span className="e">{`${result.stdout ? "\n" : ""}${result.stderr}`}</span>}
                </>
              )}
            </div>
          )}
          {previewLog.length > 0 && (
            <div className="console" style={{ minHeight: 0 }}>
              {previewLog.map((l, i) => <div key={i} className={l.kind === "error" ? "e" : "o"}>{l.text}</div>)}
            </div>
          )}
          {result && !result.ok && (
            <button type="button" className="tryit" onClick={() => onAskPartner("chat", "I got this error when I ran my code. What does it mean and how do I fix it?", result.stderr)}>
              Ask my AI partner about this error →
            </button>
          )}
          {traceNote && <div className="hintbox show" style={{ marginTop: 12 }}>{traceNote}</div>}
          {rows.length > 0 && (
            <>
              <div className="minihead"><span className="kk">What happened, step by step</span><span className="kk">{Math.min(shown, rows.length)} / {rows.length}</span></div>
              <div className="trace">
                {rows.slice(0, shown).map((r, i) => (
                  <div key={i} className={i === shown - 1 ? "cur" : ""}>
                    <span className="ln">line {r.line}</span>
                    <code>{r.text}</code>
                    {r.changed && <span className="vars">{r.changed}</span>}
                    {r.result && <span className={`t ${r.result}`}>{r.result}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>
      <div className="btns"><button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={onNext}>Next: exercises <span>→</span></button></div>
      {visualize && <Visualizer code={code} stdin={stdin.replace(/\\n/g, "\n")} onClose={() => setVisualize(false)} />}
    </div>
  );
}
