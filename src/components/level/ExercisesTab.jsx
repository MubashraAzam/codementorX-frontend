import { useRef, useState } from "react";
import { askHint, askSolution } from "./levelAI";
import { outputMatches, runCode } from "./runCode";
import { sparks } from "./fx";
import { CodeEditor, Dots, Icon, InlineMd, Md } from "./ui";

const BLANK = {
  python: "# Write your code here\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n",
  javascript: "// Write your code here\n",
};

export default function ExercisesTab({ ctx, langFence, langName, exercises, error, onReload, solved, onSolved, rootRef, onNext }) {
  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState({});
  const [results, setResults] = useState({}); // i -> { tests:[{pass, got}], output, error }
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [help, setHelp] = useState({}); // i -> { hint, solution, loading }
  const passRef = useRef(null);

  if (!exercises) {
    return (
      <div className="stack">
        <article className="card">
          {error ? (
            <div className="errbox"><b>Could not load the exercises.</b> {error} <button type="button" className="btn gh sm" onClick={onReload}>Try again</button></div>
          ) : (
            <><Dots label="Creating 3 exercises for this level…" /><div className="skel" style={{ height: 90, marginTop: 12 }} /></>
          )}
        </article>
      </div>
    );
  }

  const ex = exercises[active] || exercises[0];
  const code = codes[active] ?? (ex.starter || BLANK[ctx.language] || BLANK.python);
  const res = results[active];
  const h = help[active] || {};
  const passedCount = res ? res.tests.filter((t) => t.pass).length : 0;

  async function runTests() {
    if (busy) return;
    setBusy(true);
    const tests = ex.tests.length ? ex.tests : [{ input: "", output: null }];
    const out = [];
    let lastOutput = "";
    let lastError = null;
    for (const t of tests) {
      const r = await runCode({ language: ctx.language, code, stdin: String(t.input ?? ""), echo: false, onStatus: setStatus });
      lastOutput = r.output;
      lastError = r.error;
      out.push({ pass: !r.error && t.output !== null && outputMatches(r.output, t.output), got: r.error ? r.error.text : r.output.trim() });
      if (r.error && /took too long|not reachable/.test(r.error.text)) break;
    }
    setResults((m) => ({ ...m, [active]: { tests: out, output: lastOutput, error: lastError } }));
    setStatus("");
    setBusy(false);
    if (ex.tests.length && out.length === ex.tests.length && out.every((t) => t.pass)) {
      requestAnimationFrame(() => sparks(rootRef.current, passRef.current));
      onSolved(active);
    }
  }

  async function getHelp(kind) {
    if (kind === "hint" && ex.hint && !h.hint) {
      setHelp((m) => ({ ...m, [active]: { ...m[active], hint: ex.hint } }));
      return;
    }
    setHelp((m) => ({ ...m, [active]: { ...m[active], loading: kind } }));
    try {
      const text = kind === "hint"
        ? await askHint(ctx, `Exercise: ${ex.title}. ${ex.task} The student's code so far:\n${code}`)
        : await askSolution(ctx, ex);
      setHelp((m) => ({ ...m, [active]: { ...m[active], loading: null, [kind]: text } }));
    } catch {
      setHelp((m) => ({ ...m, [active]: { ...m[active], loading: null, [kind]: "The AI is busy. Please try again." } }));
    }
  }

  const allPassed = res && ex.tests.length && res.tests.length === ex.tests.length && res.tests.every((t) => t.pass);

  return (
    <div className="stack">
      <article className="card">
        <div className="row"><h3><span className="ic"><Icon name="pen" /></span>Exercises</h3><span className="kk">Solve it, run it, pass the tests</span></div>
        <div className="exs">
          {exercises.map((x, i) => (
            <button key={i} type="button" className={`ex${i === active ? " on" : ""}${solved.includes(i) ? " ok" : ""}`} onClick={() => setActive(i)}>
              <span className="st">{solved.includes(i) ? "✓" : i + 1}</span>
              <span>{x.title}<small>{x.tags}</small></span>
            </button>
          ))}
        </div>
        <div className="task">
          <p><b>Exercise {active + 1} · {ex.title}.</b> <InlineMd text={ex.task} /></p>
          {ex.tests.length > 0 && (
            <div className="exp">{ex.tests.map((t, i) => <span key={i}>{String(t.input).replace(/\n/g, " · ") || "(no input)"} → {String(t.output)}</span>)}</div>
          )}
        </div>
      </article>

      <div className="g2b">
        <div className="code editor">
          <div className="chead"><i /><i /><i /><span className="fn">exercise{active + 1}.{langFence === "cpp" ? "cpp" : langFence === "java" ? "java" : langFence === "javascript" ? "js" : "py"}</span><span className="lg">{langName}</span></div>
          <CodeEditor value={code} onChange={(v) => setCodes((m) => ({ ...m, [active]: v }))} lang={langFence} errLine={res?.error?.line || undefined} minHeight={280} />
          <div className="edbar">
            <button type="button" className="btn run sm" onClick={runTests} disabled={busy}><Icon name="play" />{busy ? "Testing…" : "Run & test"}</button>
            <button type="button" className="btn gh sm" style={{ background: "transparent", color: "#D9D2F0", borderColor: "#3A2F55" }} onClick={() => setCodes((m) => ({ ...m, [active]: ex.starter || BLANK[ctx.language] || BLANK.python }))}>Reset</button>
            <span className="status">{status || `${ex.tests.length} tests`}</span>
          </div>
        </div>

        <article className="card">
          <div className="row"><h3>Tests</h3><span className="kk">{passedCount} / {ex.tests.length} passed</span></div>
          <div className="tests">
            {ex.tests.map((t, i) => {
              const r = res?.tests[i];
              return (
                <div key={i} className={`tst${r?.pass ? " pass" : r ? " fail" : ""}`}>
                  <span className="b">{r?.pass ? "✓" : r ? "✗" : i + 1}</span>
                  <span>
                    input: {String(t.input).replace(/\n/g, " · ") || "—"}
                    {r && !r.pass && <small>got: {cutText(r.got)}</small>}
                  </span>
                  <code>{String(t.output)}</code>
                </div>
              );
            })}
          </div>
          <div className="console" style={{ minHeight: 80 }}>
            {!res && <span className="p">Output shows here…</span>}
            {res && <span className="o">{res.output || "(no output)"}</span>}
            {res?.error && <span className="e">{`\n${res.error.line ? `Line ${res.error.line}: ` : ""}${res.error.text}`}</span>}
          </div>
          <div className={`result${allPassed ? " show" : ""}`} ref={passRef}><Icon name="tick" />All tests passed!<span className="xp">+20 XP</span></div>
          <div className="btns" style={{ marginTop: 12 }}>
            <button type="button" className="btn gh sm" onClick={() => getHelp("hint")} disabled={!!h.loading}><Icon name="bulb" />Hint</button>
            <button type="button" className="btn gh sm" onClick={() => getHelp("solution")} disabled={!!h.loading}>Solution</button>
          </div>
          {h.loading && <Dots label={h.loading === "hint" ? "Thinking of a hint…" : "Writing the solution…"} />}
          {h.hint && !h.loading && <div className="hintbox show"><b>Hint:</b> <InlineMd text={h.hint} /></div>}
          {h.solution && <div className="aibox solbox"><small>SOLUTION</small><Md text={h.solution} lang={langFence} /></div>}
        </article>
      </div>
      <div className="btns">
        <button type="button" className="btn gh sm" onClick={onReload}><Icon name="refresh" />New exercises</button>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={onNext}>Ready for the MCQs <span>→</span></button>
      </div>
    </div>
  );
}

function cutText(s) {
  const t = String(s || "").replace(/\s+/g, " ");
  return t.length > 60 ? `${t.slice(0, 57)}…` : t || "(nothing)";
}
