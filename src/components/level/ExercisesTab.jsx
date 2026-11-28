import { useState } from "react";
import CodeEditor from "../CodeEditor";
import { askHint, askSolution } from "./levelAI";
import { outputMatches, runCode, errorLine } from "./runCode";
import { sparks } from "./fx";
import HintSteps from "./HintSteps";
import { Dots, Icon, Md } from "./ui";

/**
 * Exercises tab = Module 3.1 practice set (3 exercises from the server, cached per level)
 * with the 3-step hint ladder (3.3), the worked solution on request, and
 * "Code it with your AI partner" which opens the exercise in the Code tab (3.2).
 */
export default function ExercisesTab({ ctx, langFence, langName, practice, error, onReload, solved, onSolved, rootRef, onOpenInLab, onNext }) {
  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState({});
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState({}); // i -> { ok, stdout, stderr, match }
  const [busy, setBusy] = useState(false);
  const [solutions, setSolutions] = useState({}); // i -> { loading, text, error }

  if (!practice) {
    return (
      <div className="stack">
        <article className="card">
          {error ? (
            <div className="errbox"><b>Could not load the exercises.</b> {error} <button type="button" className="btn gh sm" onClick={onReload}>Try again</button></div>
          ) : (
            <><Dots label="Preparing 3 practice exercises…" /><div className="skel" style={{ height: 90, marginTop: 12 }} /></>
          )}
        </article>
      </div>
    );
  }

  const list = practice.exercises || [];
  const ex = list[active] || list[0];
  const code = codes[active] ?? ex.starterCode ?? "";
  const stdin = inputs[active] ?? "";
  const res = results[active];
  const sol = solutions[active] || {};
  const isReact = ctx.language === "react";

  async function runCheck() {
    if (busy || !code.trim()) return;
    setBusy(true);
    const r = await runCode(ctx.language, code, stdin.replace(/\\n/g, "\n"));
    const match = !isReact && r.ok && ex.expectedOutput ? outputMatches(r.stdout, ex.expectedOutput) : false;
    setResults((m) => ({ ...m, [active]: { ...r, match } }));
    setBusy(false);
    if (match) {
      requestAnimationFrame(() => sparks(rootRef.current, document.querySelector(".cmxl .result.show")));
      onSolved(active);
    }
  }

  async function showSolution() {
    setSolutions((m) => ({ ...m, [active]: { loading: true } }));
    try {
      const text = await askSolution(ctx, practice.practiceId, active);
      setSolutions((m) => ({ ...m, [active]: { text } }));
    } catch (err) {
      setSolutions((m) => ({ ...m, [active]: { error: err.message || "Could not load the solution." } }));
    }
  }

  return (
    <div className="stack">
      <article className="card">
        <div className="row"><h3><span className="ic"><Icon name="pen" /></span>Exercises</h3><span className="kk">Write it, run it, match the expected output</span></div>
        <div className="exs">
          {list.map((x, i) => (
            <button key={i} type="button" className={`ex${i === active ? " on" : ""}${solved.includes(i) ? " ok" : ""}`} onClick={() => setActive(i)}>
              <span className="st">{solved.includes(i) ? "✓" : i + 1}</span>
              <span>{x.title}<small>{["Easy", "Medium", "Challenging"][i] || ""}</small></span>
            </button>
          ))}
        </div>
        <div className={`task${ctx.uiLang === "ur" ? " ur-mixed" : ""}`}>
          <p><b>Exercise {active + 1} · {ex.title}</b></p>
          <Md className="md" text={ex.description} lang={langFence} />
          {ex.expectedOutput && (
            <>
              <div className="kk" style={{ marginTop: 10 }}>Expected output</div>
              <div className="console" style={{ minHeight: 0, marginTop: 6 }}><span className="o">{ex.expectedOutput}</span></div>
            </>
          )}
        </div>
      </article>

      <div className="g2b">
        <div className="code editor">
          <div className="chead"><i /><i /><i /><span className="fn">exercise{active + 1}</span><span className="lg">{langName}</span></div>
          <div className="cm-wrap">
            <CodeEditor key={`${practice.practiceId}-${active}`} value={code} onChange={(v) => setCodes((m) => ({ ...m, [active]: v }))} language={ctx.language} height="300px" ariaLabel={`Exercise ${active + 1} editor`} />
            {res && !res.ok && errorLine(res.stderr) && (
              <style>{`.cmxl .cm-wrap .cm-content > .cm-line:nth-child(${errorLine(res.stderr)}){background:rgba(255,122,133,.18);box-shadow:inset 3px 0 0 #FF7A85}`}</style>
            )}
          </div>
          <div className="edbar">
            <button type="button" className="btn run sm" onClick={runCheck} disabled={busy || !code.trim()}><Icon name="play" />{busy ? "Running…" : isReact ? "Preview" : "Run & check"}</button>
            <button type="button" className="btn gh sm dark" onClick={() => setCodes((m) => ({ ...m, [active]: ex.starterCode || "" }))}>Reset</button>
            <button type="button" className="btn gh sm dark" onClick={() => onOpenInLab(ex, code)}>Code it with AI partner</button>
          </div>
        </div>

        <article className="card">
          {!isReact && (
            <>
              <div className="minihead"><span className="kk">Input</span><span className="kk" style={{ color: "var(--accent)" }}>if your program reads values</span></div>
              <div className="inrow">
                <input value={stdin} onChange={(e) => setInputs((m) => ({ ...m, [active]: e.target.value }))} placeholder="e.g. 85  (use \n between values)" aria-label="Program input" />
              </div>
            </>
          )}
          <div className="minihead"><span className="kk">{isReact ? "Live preview" : "Your output"}</span></div>
          {res?.preview ? (
            <iframe title="React preview" sandbox="allow-scripts" srcDoc={res.preview} className="preview" />
          ) : (
            <div className="console" style={{ minHeight: 80 }}>
              {!res && <span className="p">Run your code to see the output…</span>}
              {res && <span className="o">{res.stdout || (res.stderr ? "" : "(no output)")}</span>}
              {res?.stderr && <span className="e">{`${res.stdout ? "\n" : ""}${res.stderr}`}</span>}
            </div>
          )}
          <div className={`result${res?.match ? " show" : ""}`}><Icon name="tick" />Your output matches the expected output!<span className="xp">+20 XP</span></div>
          {res && res.ok && !res.match && ex.expectedOutput && !isReact && (
            <div className="hintbox show">Not the same as the expected output yet. Check your input and the exact words, spaces and numbers.</div>
          )}
          <div className="minihead"><span className="kk">Need help?</span></div>
          <HintSteps
            key={`${practice.practiceId}-${active}`}
            lang={langFence}
            fetchHint={(step) => askHint(ctx, step, { type: "practice", practiceId: practice.practiceId, index: active, code })}
          />
          <div className="btns" style={{ marginTop: 10 }}>
            <button type="button" className="btn gh sm" onClick={showSolution} disabled={sol.loading || !!sol.text}>Show solution</button>
          </div>
          {sol.loading && <Dots label="Writing the solution…" />}
          {sol.error && <div className="errbox">{sol.error}</div>}
          {sol.text && <div className="aibox solbox"><small>SOLUTION</small><Md text={sol.text} lang={langFence} /></div>}
        </article>
      </div>
      <div className="btns">
        <button type="button" className="btn gh sm" onClick={onReload}><Icon name="refresh" />New exercises</button>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={onNext}>Ready for the MCQs <span>→</span></button>
      </div>
    </div>
  );
}
