import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { splitSections } from "./markup";
import { glide } from "./fx";
import { Dots, Icon, InlineMd, Md } from "./ui";

/* ---------- "How ... decides" diagram (for condition levels) ---------- */
function cut(s, n) {
  const t = String(s ?? "");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function DecisionFlow({ flow }) {
  const checks = (flow.checks || []).slice(0, 3);
  const samples = (flow.samples || []).filter((s) => s && s.label !== undefined).slice(0, 4);
  const [pick, setPick] = useState(Math.min(1, Math.max(samples.length - 1, 0)));
  const n = checks.length;
  const hit = samples.length ? Math.min(Number(samples[pick]?.hit) || 0, n) : 0;
  const rowY = (i) => 20 + i * 87;
  const H = rowY(n) + 44;
  const hot = (key) => {
    const [kind, i] = key;
    if (kind === "down") return i < hit; // false-path line below check i
    if (kind === "right") return i === hit; // true-path line of check i
    if (kind === "check") return i <= hit && i < n;
    if (kind === "res") return i === hit;
    return false;
  };
  return (
    <>
      <svg className="flow" viewBox={`0 0 400 ${H}`} role="img" aria-label={flow.title}>
        <path className="ln hot" d="M70 0 L70 20" />
        {checks.map((c, i) => (
          <g key={i}>
            {i > 0 && <path className={`ln${hot(["down", i - 1]) ? " hot" : ""}`} d={`M70 ${rowY(i - 1) + 54} L70 ${rowY(i)}`} />}
            <path className={`ln${hot(["right", i]) ? " hot" : ""}`} d={`M130 ${rowY(i) + 27} L250 ${rowY(i) + 27}`} />
            <rect className={`bx${hot(["check", i]) ? " hot" : ""}`} x="10" y={rowY(i)} width="120" height="54" rx="14" />
            <text x="70" y={rowY(i) + 32} textAnchor="middle"><title>{c.cond}</title>{cut(c.cond, 15)}</text>
            <rect className={`bx${hot(["res", i]) ? " hot" : ""}`} x="250" y={rowY(i) + 7} width="145" height="40" rx="12" />
            <text className="res" x="322" y={rowY(i) + 32} textAnchor="middle"><title>{c.result}</title>{cut(c.result, 18)}</text>
            <text className="l" x="165" y={rowY(i) + 20}>TRUE</text>
            <text className="l" x="78" y={rowY(i) + 72}>FALSE</text>
          </g>
        ))}
        <path className={`ln${hit === n ? " hot" : ""}`} d={`M70 ${rowY(n - 1) + 54} L70 ${rowY(n) + 18} L250 ${rowY(n) + 18}`} />
        <rect className={`bx${hit === n ? " hot" : ""}`} x="250" y={rowY(n)} width="145" height="36" rx="12" />
        <text className="res" x="322" y={rowY(n) + 23} textAnchor="middle"><title>{flow.else}</title>{cut(flow.else || "else", 18)}</text>
      </svg>
      {samples.length > 0 && (
        <div className="tryin" style={{ marginTop: 6 }}>
          {samples.map((s, i) => (
            <button key={i} type="button" className={`chipbtn${i === pick ? " on" : ""}`} onClick={() => setPick(i)}>{s.label}</button>
          ))}
        </div>
      )}
    </>
  );
}

function StepsFlow({ flow }) {
  const steps = (flow.steps || []).slice(0, 5);
  const [hot, setHot] = useState(0);
  useEffect(() => {
    if (steps.length < 2) return undefined;
    const id = setInterval(() => setHot((h) => (h + 1) % steps.length), 1600);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div className="flowsteps">
      {steps.map((s, i) => (
        <div key={i}>
          {i > 0 && <div className={`fline${i <= hot ? " hot" : ""}`} />}
          <button type="button" className={`fstep${i === hot ? " hot" : ""}`} onClick={() => setHot(i)} style={{ width: "100%", textAlign: "left" }}>
            <span className="num">{i + 1}</span>
            <span><b>{s.label}</b>{s.detail && <small>{s.detail}</small>}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- the full lesson reader ---------- */
function Reader({ lesson, lessonError, langFence, rootRef, uiLang, onClose, onRegenerate, onUrdu, onNext }) {
  const sections = splitSections(lesson);
  const [active, setActive] = useState(0);
  const artRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onScroll = () => {
      const secs = artRef.current?.querySelectorAll("section") || [];
      let cur = 0;
      secs.forEach((s, i) => {
        if (s.getBoundingClientRect().top < 260) cur = i;
      });
      setActive(cur);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [rootRef]);

  function jump(i) {
    const root = rootRef.current;
    const sec = artRef.current?.querySelectorAll("section")[i];
    if (!root || !sec) return;
    glide(root, sec.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 190);
  }

  return (
    <article className="card reader on">
      <div className="rhead">
        <button type="button" className="back" style={{ height: 38 }} onClick={onClose}><Icon name="back" />Overview</button>
        <h2>Full lesson</h2>
        <span className="badge"><i />Made by AI for you</span>
        <div className="sp">
          <button type="button" className="btn gh sm" onClick={onRegenerate}><Icon name="refresh" />Regenerate</button>
          <button type="button" className="btn gh sm" onClick={onUrdu}>
            {uiLang === "ur" ? "In English" : <span className="ur" style={{ fontSize: 15 }}>اردو میں</span>}
          </button>
        </div>
      </div>
      {!lesson ? (
        <div className="rempty">
          {lessonError ? <div className="errbox"><b>Could not load the lesson.</b> {lessonError}</div> : <Dots label="Writing your full lesson…" />}
          {!lessonError && <div className="skel" style={{ height: 220, marginTop: 14 }} />}
        </div>
      ) : (
        <div className="rbody">
          <nav className="toc" aria-label="Lesson sections">
            {sections.map((s, i) => (
              <a key={i} className={`${i === active ? "on" : ""}${i < active ? " seen" : ""}`} onClick={() => jump(i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && jump(i)}>
                <b>{i + 1}</b>{s.title}
              </a>
            ))}
          </nav>
          <div className={`art${uiLang === "ur" ? " ur-text" : ""}`} ref={artRef}>
            {sections.map((s, i) => (
              <section key={i}>
                <h3><span className="n">{i + 1}</span>{s.title}</h3>
                <Md className="rsec-body" text={s.body} lang={langFence} />
              </section>
            ))}
          </div>
        </div>
      )}
      <div className="rfoot">
        <button type="button" className="btn gh sm" onClick={onClose}>← Back to overview</button>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={onNext}>I&apos;ve read it · write code <span>→</span></button>
      </div>
    </article>
  );
}

/* ---------- the Lesson tab ---------- */
export default function LessonTab({ ctx, langName, langFence, overview, lesson, lessonError, rootRef, uiLang, setUiLang, onRegenOverview, onRegenLesson, onAsk, onNext }) {
  const [reading, setReading] = useState(false);
  const [recapOn, setRecapOn] = useState(false);
  const recapRef = useRef(null);

  useEffect(() => {
    const el = recapRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([en]) => en.isIntersecting && setRecapOn(true), { root: rootRef.current, threshold: 0.7 });
    io.observe(el);
    return () => io.disconnect();
  }, [rootRef, overview, reading]);

  function morph(fn) {
    const root = rootRef.current;
    if (!document.startViewTransition || !root) {
      fn();
      return;
    }
    root.classList.add("morphing");
    const vt = document.startViewTransition(() => flushSync(fn));
    vt.finished.finally(() => root.classList.remove("morphing"));
  }
  const open = () => {
    if (!lesson && lessonError) onRegenLesson();
    morph(() => { setReading(true); rootRef.current?.scrollTo(0, 0); });
  };
  const close = () => morph(() => { setReading(false); rootRef.current?.scrollTo(0, 0); });

  if (reading) {
    return (
      <Reader
        lesson={lesson}
        lessonError={lessonError}
        langFence={langFence}
        rootRef={rootRef}
        uiLang={uiLang}
        onClose={close}
        onRegenerate={onRegenLesson}
        onUrdu={() => setUiLang(uiLang === "ur" ? "en" : "ur")}
        onNext={() => { setReading(false); onNext(); }}
      />
    );
  }

  if (!overview) {
    return (
      <div className="stack">
        <div className="g2b">
          <div className="card"><Dots label="Preparing your lesson…" /><div className="skel" style={{ height: 120, marginTop: 12 }} /></div>
          <div className="card"><div className="skel" style={{ height: 170 }} /></div>
        </div>
        <div className="card"><div className="skel" style={{ height: 90 }} /></div>
      </div>
    );
  }

  const ur = uiLang === "ur";
  const flow = overview.flow || {};
  const sectionCount = splitSections(lesson).length;

  return (
    <div className="stack" id="overview">
      <div className="g2b">
        <article
          className="card idea rise"
          style={{ "--d": ".05s" }}
          role="button"
          tabIndex={0}
          aria-label="Open the full lesson"
          onClick={open}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
        >
          <div className="row">
            <h3><span className="ic"><Icon name="bulb" /></span>The big idea</h3>
            <span className="badge"><i />{lesson ? `${sectionCount} sections` : lessonError ? "not loaded" : "writing…"}</span>
          </div>
          <p className={`txt${ur ? " ur-text" : ""}`}><InlineMd text={overview.bigIdea} /></p>
          {lesson && (
            <div className="toc-mini">
              {splitSections(lesson).slice(0, 6).map((s, i) => <span key={i}>{s.title}</span>)}
              {sectionCount > 6 && <span>+{sectionCount - 6} more</span>}
            </div>
          )}
          <div className="open">
            <Icon name="book" />
            {lesson ? "Open the full lesson with all the theory and examples" : lessonError ? "Could not write the full lesson. Click to try again" : "The full lesson is being written…"}
            <span className="ar"><Icon name="next" /></span>
          </div>
        </article>

        <article className="card rise" style={{ "--d": ".15s" }}>
          <div className="row"><h3>{flow.title || `How ${langName} decides`}</h3></div>
          {flow.type === "decision" && flow.checks?.length ? <DecisionFlow flow={flow} /> : <StepsFlow flow={flow} />}
        </article>
      </div>

      {overview.cards?.length > 0 && (
        <article className="card rise" style={{ "--d": ".1s" }}>
          <div className="row"><h3><span className="ic"><Icon name="frame" /></span>Key syntax</h3><span className="kk">Hover a card to flip it</span></div>
          <div className="ops">
            {overview.cards.map((c, i) => (
              <div className="opc" key={i} tabIndex={0}>
                <div className="in">
                  <div className="fa"><b>{c.front}</b><span>{c.label}</span></div>
                  <div className="fa bk"><b>{c.back}</b><span>try it!</span></div>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      <div className="g2">
        <article className="card rise" style={{ "--d": ".1s" }}>
          <div className="warn">
            <h4><Icon name="warn" />Common mistake: {overview.mistake?.title}</h4>
            <p className={ur ? "ur-text" : ""}><InlineMd text={overview.mistake?.text} /></p>
            {(overview.mistake?.wrong || overview.mistake?.right) && (
              <div className="vs">
                {overview.mistake.wrong && <div className="bd"><small>✗ WRONG</small>{overview.mistake.wrong}</div>}
                {overview.mistake.right && <div className="gd"><small>✓ RIGHT</small>{overview.mistake.right}</div>}
              </div>
            )}
          </div>
        </article>
        <article className="card rise" style={{ "--d": ".2s" }}>
          <h3><span className="ic"><Icon name="check" /></span>You now know</h3>
          <div className="sum" ref={recapRef}>
            {overview.recap.map((r, i) => (
              <label key={i} className={recapOn ? "ok" : ""} style={{ transitionDelay: `${0.3 + i * 0.25}s` }}>
                <span className="cb" style={{ transitionDelay: `${0.3 + i * 0.25}s` }}><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" /></svg></span>
                <span className={ur ? "ur-text" : ""}><InlineMd text={r} /></span>
              </label>
            ))}
          </div>
        </article>
      </div>

      <div className="btns">
        <button type="button" className="btn gh sm" onClick={() => onAsk(`Give me a hint to understand ${ctx.level.title}`)}><Icon name="bulb" />Hint</button>
        <button type="button" className="btn gh sm" onClick={() => onAsk(`Show me one more real-life example of ${ctx.level.title}`)}><Icon name="spark" />More examples</button>
        <button type="button" className="btn gh sm" onClick={onRegenOverview}><Icon name="refresh" />Explain again</button>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={onNext}>Next: write code <span>→</span></button>
      </div>
    </div>
  );
}
