import { useEffect, useState } from "react";
import { askCodeReview } from "./levelAI";
import { explainTrace, runCode } from "./runCode";
import { CodeEditor, Dots, Icon, Md } from "./ui";

const STARTER = {
  python: "# Write your Python code here\nname = input()\nprint(\"Hello,\", name)\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    cout << \"Hello!\" << endl;\n    return 0;\n}\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello!\");\n    }\n}\n",
  javascript: "// Write your JavaScript code here\nconsole.log(\"Hello!\");\n",
};

export default function CodeTab({ ctx, langFence, langName, example, onNext }) {
  const exampleCode = example?.code || STARTER[ctx.language] || STARTER.python;
  const inputs = (example?.inputs || []).map(String).slice(0, 4);
  const [code, setCode] = useState(null); // null = show the lesson example
  const [stdin, setStdin] = useState(null);
  const [run, setRun] = useState(null); // { id, output, error, rows }
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [shown, setShown] = useState(0);
  const [review, setReview] = useState({ loading: false, text: "" });

  const value = code ?? exampleCode;
  const input = stdin ?? (inputs[0] || "").replace(/\n/g, "\\n"); // shown with \n for new lines
  const rows = run?.rows || [];

  // play the trace: highlight each executed line one after another
  useEffect(() => {
    if (!run?.rows?.length) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= run.rows.length) clearInterval(id);
    }, run.rows.length > 20 ? 120 : 380);
    return () => clearInterval(id);
  }, [run]);

  async function doRun(nextInput = input) {
    if (busy) return;
    setBusy(true);
    setShown(0);
    setStatus(ctx.language === "python" || ctx.language === "javascript" ? "Running in your browser…" : "Running…");
    const res = await runCode({ language: ctx.language, code: value, stdin: nextInput.replace(/\\n/g, "\n"), trace: ctx.language === "python", onStatus: setStatus });
    setRun({ id: Date.now(), output: res.output, error: res.error, rows: explainTrace(res.steps, value) });
    setStatus(res.error ? "Finished with an error" : "Finished");
    setBusy(false);
  }

  async function checkWithAI() {
    setReview({ loading: true, text: "" });
    try {
      const text = await askCodeReview(ctx, value, run?.output || "");
      setReview({ loading: false, text });
    } catch {
      setReview({ loading: false, text: "The AI is busy right now. Please try again." });
    }
  }

  const runLine = shown > 0 && shown <= rows.length ? rows[shown - 1]?.line : undefined;

  return (
    <div className="stack">
      <article className="card">
        <div className="row">
          <h3><span className="ic"><Icon name="code" /></span>Code lab</h3>
          <div className="lab-tools">
            <span className="kk">Edit the code, give an input, press Run</span>
            <button type="button" className="btn gh sm" onClick={() => { setCode(null); setRun(null); }}>Load example</button>
            <button type="button" className="btn gh sm" onClick={() => { setCode(""); setRun(null); }}>Clear</button>
          </div>
        </div>
      </article>

      <div className="g2b">
        <div className="code editor">
          <div className="chead"><i /><i /><i /><span className="fn">{example?.file || `main.${langFence === "cpp" ? "cpp" : "py"}`}</span><span className="lg">{langName}</span></div>
          <CodeEditor value={value} onChange={setCode} lang={langFence} runLine={runLine} errLine={run?.error?.line || undefined} minHeight={320} />
          <div className="edbar">
            <button type="button" className="btn run sm" onClick={() => doRun()} disabled={busy}><Icon name="play" />{busy ? "Running…" : "Run"}</button>
            <button type="button" className="btn gh sm" style={{ background: "transparent", color: "#D9D2F0", borderColor: "#3A2F55" }} onClick={checkWithAI} disabled={review.loading}>
              Ask AI to check my code
            </button>
            <span className="status">{status || (ctx.language === "python" || ctx.language === "javascript" ? "Runs in your browser" : "Runs on the server")}</span>
          </div>
        </div>

        <article className="card">
          <div className="minihead"><span className="kk">Input</span><span className="kk" style={{ color: "var(--accent)" }}>what the program will read</span></div>
          <div className="inrow">
            <input value={input} onChange={(e) => setStdin(e.target.value)} placeholder="Type input here (use \n for a new line)" aria-label="Program input" />
            {inputs.map((v) => (
              <button key={v} type="button" className="chipbtn" onClick={() => { setStdin(v.replace(/\n/g, "\\n")); doRun(v); }}>{v.replace(/\n/g, " · ")}</button>
            ))}
          </div>
          <div className="minihead"><span className="kk">Output</span></div>
          <div className="console">
            {!run && <span className="p">Press Run to see the output…</span>}
            {run && (
              <>
                <span className="p">$ run {example?.file || "main"}</span>{"\n"}
                <span className="o">{run.output || (run.error ? "" : "(no output)")}</span>
                {run.error && <span className="e">{`\n${run.error.line ? `Line ${run.error.line}: ` : ""}${run.error.text}`}</span>}
              </>
            )}
          </div>
          {review.loading && <Dots label="The AI is reading your code…" />}
          {review.text && <div className="aibox"><small>AI CHECK</small><Md text={review.text} lang={langFence} /></div>}
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
    </div>
  );
}
