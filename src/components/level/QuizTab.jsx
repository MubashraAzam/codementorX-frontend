import { useEffect, useRef, useState } from "react";
import { starsForScore } from "./levelData";
import { confetti, floatXP, sparks } from "./fx";
import { CodeBlock, Dots, Icon, InlineMd } from "./ui";

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

export default function QuizTab({ ctx, langFence, quiz, error, onReload, rootRef, canvasRef, username, hintsUsed, onHint, onXP, onFinish, onReview, onNextLevel, isLastLevel, ur }) {
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [hintOpen, setHintOpen] = useState({});
  const [done, setDone] = useState(false);
  const [popStars, setPopStars] = useState(false);
  const optsRef = useRef([]);

  const total = quiz?.length || 0;
  const q = quiz?.[qi];
  const answered = answers[qi] !== undefined;
  const correctCount = answers.filter((a, i) => quiz && a === quiz[i]?.ans).length;
  const score = total ? Math.round((correctCount / total) * 100) : 0;
  const stars = starsForScore(score);

  function answer(i) {
    if (!q || answered || done) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = i;
      return next;
    });
    if (i === q.ans) {
      const el = optsRef.current[i];
      floatXP(rootRef.current, el, "+10 XP");
      sparks(rootRef.current, el);
      onXP(10);
    }
  }

  function next() {
    if (qi < total - 1) {
      setQi(qi + 1);
      return;
    }
    setDone(true);
    onFinish({ score, stars, correct: correctCount, total });
    setTimeout(() => setPopStars(true), 600);
    if (stars >= 2) setTimeout(() => confetti(canvasRef.current), 1500);
  }

  function retry() {
    setQi(0);
    setAnswers([]);
    setHintOpen({});
    setDone(false);
    setPopStars(false);
  }

  // keyboard: A, B, C, D to answer, Enter for next
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || done || !quiz) return;
      const k = "abcd".indexOf(e.key.toLowerCase());
      if (k >= 0 && k < (quiz[qi]?.opts.length || 0)) optsRef.current[k]?.click();
      if (e.key === "Enter" && answers[qi] !== undefined) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!quiz) {
    return (
      <article className="card">
        {error ? (
          <div className="errbox"><b>Could not load the MCQs.</b> {error} <button type="button" className="btn gh sm" onClick={onReload}>Try again</button></div>
        ) : (
          <><Dots label="Writing 10 questions about this lesson…" /><div className="skel" style={{ height: 160, marginTop: 12 }} /></>
        )}
      </article>
    );
  }

  if (done) {
    return (
      <article className="card res" style={{ animation: "vin .6s cubic-bezier(.3,1.4,.5,1)" }}>
        <ResultRing pct={score} />
        <div className="rstars">
          {[0, 1, 2].map((s) => (
            <svg key={s} viewBox="0 0 24 24" className={`${s < stars ? "on" : ""}${popStars ? " p" : ""}`} style={{ animationDelay: `${s * 0.3}s` }} aria-hidden="true">
              <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />
            </svg>
          ))}
        </div>
        <h2>{stars === 3 ? `Excellent, ${username}!` : stars > 0 ? `Great job, ${username}!` : `Keep going, ${username}!`}</h2>
        <p>
          {correctCount} of {total} correct.{" "}
          {stars === 3 ? "You earned all 3 stars for this level." : stars > 0 ? "Score 85% or more to earn all 3 stars." : "Score 50% or more to pass. Review the lesson and try again."}
        </p>
        <div className="rstats">
          <div><small>Correct</small>{correctCount} / {total}</div>
          <div><small>XP earned</small>+{correctCount * 10}</div>
          <div><small>Hints used</small>{hintsUsed}</div>
        </div>
        {stars > 0 && !isLastLevel && (
          <div className={`unlock${popStars ? " show" : ""}`}><Icon name="lock" />Level {ctx.levelIndex + 2} is now open!</div>
        )}
        <div className="btns">
          <button type="button" className="btn gh" onClick={retry}>{stars === 3 ? "Retry" : "Retry for more ★"}</button>
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
          {quiz.map((qq, i) => (
            <i key={i} className={i < qi || (i === qi && answered) ? (answers[i] === qq.ans ? "r" : "w") : i === qi ? "c" : ""} />
          ))}
        </div>
      </div>
      <div key={qi} style={{ animation: "vin .45s cubic-bezier(.3,1.3,.5,1)" }}>
        <div className={`qq${ur ? " ur-text" : ""}`}><InlineMd text={q.q} /></div>
        {q.code && <div className="qcode"><CodeBlock code={q.code} lang={langFence} file={null} /></div>}
        <div className="opts">
          {q.opts.map((o, i) => {
            let cls = "opt";
            if (answered) cls += i === q.ans ? " right" : i === answers[qi] ? " wrong" : " dim";
            return (
              <button key={i} type="button" ref={(el) => { optsRef.current[i] = el; }} className={cls} disabled={answered} onClick={() => answer(i)}>
                <span className="lt">{"ABCD"[i]}</span><code>{String(o)}</code>
              </button>
            );
          })}
        </div>
      </div>
      {answered && (
        <div className={`fb show ${answers[qi] === q.ans ? "r" : "w"}`}>
          <b>{answers[qi] === q.ans ? "Correct!" : "Not quite."}</b> <InlineMd text={q.exp} />
        </div>
      )}
      {hintOpen[qi] && !answered && <div className="hintbox show"><b>Hint:</b> <InlineMd text={q.hint || "Read the question slowly and think about each option."} /></div>}
      <div className="qfoot">
        <button type="button" className="btn gh sm" disabled={answered || hintOpen[qi]} onClick={() => { setHintOpen((m) => ({ ...m, [qi]: true })); onHint(); }}><Icon name="bulb" />Hint</button>
        <span className="kk">Tip: press A, B, C or D</span>
        {answered && <button type="button" className="btn" onClick={next}>{qi === total - 1 ? "See my result" : "Next"} <span>→</span></button>}
      </div>
      <button type="button" className="btn gh sm" style={{ marginTop: 10, display: qi === 0 && !answered ? "inline-flex" : "none" }} onClick={onReload}><Icon name="refresh" />New questions</button>
    </article>
  );
}

