import { useEffect, useRef, useState } from "react";
import { answerQuiz, askHint, finishQuiz, startQuiz } from "./levelAI";
import { QUESTION_TYPE } from "./levelData";
import { confetti, floatXP, sparks } from "./fx";
import HintSteps from "./HintSteps";
import { CodeBlock, Dots, Icon } from "./ui";

/**
 * MCQs tab = Module 2.2 level assessment.
 * The server writes 10 questions (4 concept, 3 predict-the-output, 3 find-the-bug),
 * keeps the answers, reveals each one only after the student locks in a choice,
 * grades the attempt, records stars/unlocks the next level and returns a topic report.
 */
function ResultRing({ pct }) {
  const [on, setOn] = useState(false);
  const [shownPct, setShownPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 120);
    let raf = 0;
    let start;
    const step = (ts) => {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / 1500);
      setShownPct(Math.round(pct * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [pct]);
  return (
    <div className="bigring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id="lvrg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent2)" }} />
          </linearGradient>
        </defs>
        <circle className="t" cx="80" cy="80" r="70" />
        <circle className="v" cx="80" cy="80" r="70" style={{ stroke: "url(#lvrg)", strokeDashoffset: on ? 440 - (440 * pct) / 100 : 440 }} />
      </svg>
      <div className="lbl"><div><b>{shownPct}%</b><small>score</small></div></div>
    </div>
  );
}

function Report({ report }) {
  const types = Object.entries(report?.byType || {});
  const topics = Object.entries(report?.byTopic || {});
  if (!types.length && !topics.length) return null;
  const pct = (v) => Math.round((v.correct / v.total) * 100);
  const Bar = ({ label, v }) => (
    <div className="rq">
      <div className="row"><span className="rl">{label}</span><span>{v.correct}/{v.total}</span></div>
      <div className="mb"><i style={{ width: `${Math.max(4, pct(v))}%` }} className={pct(v) < 50 ? "low" : pct(v) < 70 ? "mid" : ""} /></div>
    </div>
  );
  return (
    <div className="report">
      <h4>Your performance report</h4>
      <div className="g2">
        <div><div className="kk">By question type</div>{types.map(([k, v]) => <Bar key={k} label={v.label || k} v={v} />)}</div>
        <div><div className="kk">By topic</div>{topics.map(([k, v]) => <Bar key={k} label={k} v={v} />)}</div>
      </div>
      {report.weakTopics?.length > 0 && (
        <div className="weak"><b>Revise next:</b> {report.weakTopics.map((t) => <span key={t}>{t}</span>)}</div>
      )}
    </div>
  );
}

export default function QuizTab({ ctx, langFence, rootRef, canvasRef, username, onXP, onHint, hintsUsed, onFinish, onReview, onNextLevel, isLastLevel }) {
  const [quiz, setQuiz] = useState({ loading: true, error: "", attemptId: null, questions: null, key: 0 });
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState([]); // index of the chosen option per question
  const [reveal, setReveal] = useState({}); // qi -> { correct, correctIndex, exp }
  const [result, setResult] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [problem, setProblem] = useState("");
  const [popStars, setPopStars] = useState(false);
  const optsRef = useRef([]);

  // start (or restart) an attempt on the server
  const { language, levelIndex } = ctx;
  useEffect(() => {
    let alive = true;
    startQuiz({ language, levelIndex })
      .then((d) => alive && setQuiz((q) => ({ ...q, loading: false, error: "", attemptId: d.attemptId, questions: d.questions })))
      .catch((err) => alive && setQuiz((q) => ({ ...q, loading: false, error: err.message || "Could not load the quiz." })));
    return () => {
      alive = false;
    };
  }, [language, levelIndex, quiz.key]);

  function restart() {
    setQuiz((q) => ({ loading: true, error: "", attemptId: null, questions: null, key: q.key + 1 }));
    setQi(0);
    setAnswers([]);
    setReveal({});
    setResult(null);
    setProblem("");
    setPopStars(false);
  }

  const questions = quiz.questions;
  const total = questions?.length || 0;
  const q = questions?.[qi];
  const answered = answers[qi] !== undefined;
  const rv = reveal[qi];

  async function answer(i) {
    if (!q || answered || !quiz.attemptId) return;
    const step = qi;
    const el = optsRef.current[i];
    setAnswers((a) => {
      const n = [...a];
      n[step] = i;
      return n;
    });
    try {
      const d = await answerQuiz(quiz.attemptId, step, i);
      setReveal((r) => ({ ...r, [step]: { correct: d.correct, correctIndex: d.correctIndex, exp: d.exp } }));
      setProblem("");
      if (d.correct) {
        floatXP(rootRef.current, el, "+10 XP");
        sparks(rootRef.current, el);
        onXP(10);
      }
    } catch (err) {
      setAnswers((a) => {
        const n = [...a];
        delete n[step];
        return n;
      });
      setProblem(err.message || "Could not save your answer. Please try again.");
    }
  }

  async function next() {
    if (qi < total - 1) {
      setQi(qi + 1);
      return;
    }
    setFinishing(true);
    try {
      const r = await finishQuiz(quiz.attemptId);
      setResult(r);
      onFinish(r);
      setTimeout(() => setPopStars(true), 600);
      if ((r.stars || 0) >= 2) setTimeout(() => confetti(canvasRef.current), 1500);
    } catch (err) {
      setProblem(err.message || "Could not grade the quiz. Please try again.");
    }
    setFinishing(false);
  }

  // keyboard: A, B, C, D to answer, Enter for next
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || result || !questions) return;
      if (document.activeElement?.closest?.(".cm-editor")) return;
      const k = "abcd".indexOf(e.key.toLowerCase());
      if (k >= 0 && k < (questions[qi]?.opts.length || 0)) optsRef.current[k]?.click();
      if (e.key === "Enter" && reveal[qi] && !finishing) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (quiz.loading || quiz.error || !questions) {
    return (
      <article className="card">
        {quiz.error ? (
          <div className="errbox"><b>Could not load the MCQs.</b> {quiz.error} <button type="button" className="btn gh sm" onClick={restart}>Try again</button></div>
        ) : (
          <><Dots label="Writing 10 questions about this level…" /><div className="skel" style={{ height: 160, marginTop: 12 }} /></>
        )}
      </article>
    );
  }

  if (result) {
    const stars = result.stars || 0;
    return (
      <article className="card res" style={{ animation: "vin .6s cubic-bezier(.3,1.4,.5,1)" }}>
        <ResultRing pct={result.score || 0} />
        <div className="rstars">
          {[0, 1, 2].map((s) => (
            <svg key={s} viewBox="0 0 24 24" className={`${s < stars ? "on" : ""}${popStars ? " p" : ""}`} style={{ animationDelay: `${s * 0.3}s` }} aria-hidden="true">
              <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />
            </svg>
          ))}
        </div>
        <h2>{stars === 3 ? `Excellent, ${username}!` : stars > 0 ? `Great job, ${username}!` : `Keep going, ${username}!`}</h2>
        <p>
          {result.correct} of {result.total} correct.{" "}
          {stars === 3 ? "You earned all 3 stars for this level." : stars > 0 ? "Score 85% or more to earn all 3 stars." : "Score 50% or more to pass. Review the lesson and try a new quiz."}
        </p>
        <div className="rstats">
          <div><small>Correct</small>{result.correct} / {result.total}</div>
          <div><small>XP earned</small>+{result.correct * 10}</div>
          <div><small>Hints used</small>{hintsUsed}</div>
        </div>
        {stars > 0 && !isLastLevel && (
          <div className={`unlock${popStars ? " show" : ""}`}><Icon name="lock" />Level {ctx.levelIndex + 2} is now open!</div>
        )}
        <Report report={result.report} />
        <div className="btns">
          <button type="button" className="btn gh" onClick={restart}><Icon name="refresh" />New quiz</button>
          <button type="button" className="btn gh" onClick={onReview}>Review lesson</button>
          {stars > 0 && !isLastLevel && <button type="button" className="btn" onClick={onNextLevel}>Next level <span>→</span></button>}
        </div>
      </article>
    );
  }

  return (
    <article className="card">
      <div className="qtop">
        <h3><span className="ic"><Icon name="check" /></span>Question {qi + 1} of {total}</h3>
        <div className="qdots">
          {questions.map((_, i) => (
            <i key={i} className={reveal[i] ? (reveal[i].correct ? "r" : "w") : i === qi ? "c" : ""} />
          ))}
        </div>
      </div>
      <div key={qi} style={{ animation: "vin .45s cubic-bezier(.3,1.3,.5,1)" }}>
        <div className="qmeta">
          {QUESTION_TYPE[q.type] && <span className={`qt ${q.type}`}>{QUESTION_TYPE[q.type]}</span>}
          {q.topic && <span className="qtopic">{q.topic}</span>}
        </div>
        <div className="qq" dir="auto">{q.q}</div>
        {q.code && <div className="qcode"><CodeBlock code={q.code} lang={langFence} file={null} /></div>}
        <div className="opts">
          {q.opts.map((o, i) => {
            let cls = "opt";
            if (answered && !rv) cls += i === answers[qi] ? " picked" : " dim";
            else if (rv) cls += i === rv.correctIndex ? " right" : i === answers[qi] ? " wrong" : " dim";
            return (
              <button key={i} type="button" ref={(el) => { optsRef.current[i] = el; }} className={cls} disabled={answered} onClick={() => answer(i)}>
                <span className="lt">{"ABCD"[i]}</span><code>{String(o)}</code>
              </button>
            );
          })}
        </div>
      </div>
      {rv && (
        <div className={`fb show ${rv.correct ? "r" : "w"}`}>
          <b>{rv.correct ? "Correct!" : "Not quite."}</b> {rv.exp}
        </div>
      )}
      {problem && <div className="errbox">{problem}</div>}
      {!answered && (
        <div style={{ marginTop: 14 }}>
          <HintSteps key={`${quiz.attemptId}-${qi}`} lang={langFence} onUsed={onHint} fetchHint={(step) => askHint(ctx, step, { type: "quiz", attemptId: quiz.attemptId, index: qi })} />
        </div>
      )}
      <div className="qfoot">
        <span className="kk">Tip: press A, B, C or D</span>
        {rv && (
          <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={next} disabled={finishing}>
            {finishing ? "Grading…" : qi === total - 1 ? "See my result" : "Next"} <span>→</span>
          </button>
        )}
      </div>
    </article>
  );
}
