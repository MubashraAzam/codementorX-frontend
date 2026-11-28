import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowLeft, Compass, Sparkles, Trash2, Check, Lightbulb, PenTool, Bug, Rocket, Trophy,
  Target, Clock, Layers, ChevronDown, Flag, Map as MapIcon,
} from "lucide-react";
import { apiRequest } from "../utils/api";
import { trackMeta } from "../utils/tracks";
import "./roadmap/roadmapPage.css";

/**
 * RoadmapPage — Module 2.4 AI Roadmap Generator (new pink / plum design)
 * ----------------------------------------------------------------------
 * For languages and technologies that have no built-in course. The student types
 * what they want to learn; the AI returns ordered stages with concepts, practice,
 * debugging tasks and a project, plus a final capstone. Roadmaps are saved per
 * account and each stage can be ticked off.
 *
 * Props:
 *   onBack         fn          "Back" button (App.jsx sends it to the dashboard or Choose Path)
 *   onEnrollTrack  fn(lang)    opens Choose Path on a built-in track (e.g. someone typed "Python")
 *
 * "/roadmaps?topic=Go" (from the AI Roadmap card on Choose Path) fills the topic box.
 *
 * API (unchanged): GET /api/roadmaps · GET /api/roadmaps/:id · POST /api/roadmaps
 *                  PATCH /api/roadmaps/:id/stages/:index · DELETE /api/roadmaps/:id
 */

const SUGGESTIONS = ["Go", "Kotlin", "SQL", "Rust", "TypeScript", "Swift", "PHP", "Dart"];
const LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];
const GEN_STEPS = [
  "Reading your goal…",
  "Putting the topics in the right order…",
  "Adding practice and debugging tasks…",
  "Planning a project for every stage…",
  "Designing your final capstone…",
];
const TILE_COLORS = ["#E2577F", "#B44BD6", "#6B5CF5", "#E8813D", "#2FA88A", "#D6457A"];
const SPARK_GLYPHS = ["✓", "★", "{ }", "★", "</>", "★"];
const CONFETTI = ["#FF6FA5", "#FFA36C", "#8FD3FF", "#B44BD6", "#F5B83D", "#6B5CF5"];

const pad = (n) => String(n).padStart(2, "0");
const tileColor = (topic = "") => TILE_COLORS[[...topic].reduce((s, c) => s + c.charCodeAt(0), 0) % TILE_COLORS.length];
const tileText = (topic = "") => (topic.replace(/[^A-Za-z0-9+#]/g, "").slice(0, 2) || "AI");
const levelLabel = (id) => LEVELS.find((l) => l.id === id)?.label || "Beginner";
const readTopicParam = () => {
  try { return new URLSearchParams(window.location.search).get("topic")?.slice(0, 60) || ""; } catch { return ""; }
};

/* ---------------- small pieces ---------------- */
function BounceTitle({ a, b }) {
  const ref = useRef(null);
  useEffect(() => {
    const iv = setInterval(() => {
      const h = ref.current; if (!h) return;
      h.classList.remove("hop"); void h.offsetWidth; h.classList.add("hop");
    }, 5600);
    return () => clearInterval(iv);
  }, []);
  let i = 0;
  const words = (text, accent) => text.split(" ").map((w, wi, arr) => (
    <span key={`${text}-${wi}`}>
      <span className="rm-w">
        {[...w].map((c) => <span key={i} className={`rm-ch${accent ? " acc" : ""}`} style={{ "--i": i++ }}>{c}</span>)}
      </span>
      {wi < arr.length - 1 && <span className="rm-sp" />}
    </span>
  ));
  return <h1 ref={ref} className="rm-h1">{words(a)}<span className="rm-sp" />{words(b, true)}</h1>;
}

function Ring({ pct, size = 120, stroke = 11, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="rm-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="bg" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="fg" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="rm-ring-in">{children}</div>
    </div>
  );
}

// Counts up to a number when it changes
function CountUp({ value }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current, t0 = performance.now(), ms = 700;
    let raf = 0;
    const f = (t) => {
      const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * e));
      if (p < 1) raf = requestAnimationFrame(f); else from.current = value;
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

// Adds .in to every .rise element inside the page when it scrolls into view
function useRise(rootRef) {
  useEffect(() => {
    const root = rootRef.current; if (!root) return undefined;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { root, threshold: 0.12 });
    const scan = () => root.querySelectorAll(".rise:not(.in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [rootRef]);
}

/* ---------------- right side: empty + generating ---------------- */
function EmptyState({ onPick }) {
  return (
    <div className="rm-card rm-empty rise">
      <svg className="rm-trail" viewBox="0 0 520 170" aria-hidden="true">
        <path d="M20 140 C 110 140, 120 40, 210 50 S 320 150, 400 110 S 470 30, 500 30" />
        {[[20, 140], [210, 50], [400, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="10" style={{ "--i": i }} />)}
        <g className="flag" transform="translate(500 30)"><path d="M0 0 V-34" /><path d="M0 -34 L22 -27 L0 -20 Z" /></g>
      </svg>
      <h2>Your roadmap will appear here</h2>
      <p>Type any language or technology on the left: Go, Kotlin, SQL, Rust and more. The AI plans it for you, stage by stage, with practice, debugging tasks and projects.</p>
      <div className="rm-feats">
        <div><Layers size={20} /><b>Ordered stages</b><span>Learn things in the right order</span></div>
        <div><Bug size={20} /><b>Practice + debugging</b><span>Real tasks for every stage</span></div>
        <div><Trophy size={20} /><b>Projects + capstone</b><span>Build something at each step</span></div>
      </div>
      <div className="rm-try">
        <span>Try one:</span>
        {SUGGESTIONS.slice(0, 5).map((s) => <button type="button" key={s} onClick={() => onPick(s)}>{s}</button>)}
      </div>
    </div>
  );
}

function Generating({ topic }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 1900);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="rm-card rm-gen" role="status" aria-live="polite">
      <div className="rm-gen-orb"><Compass size={34} /></div>
      <h2>Building your <span>{topic}</span> roadmap</h2>
      <svg className="rm-gen-path" viewBox="0 0 520 120" aria-hidden="true">
        <path className="base" d="M10 90 C 90 90, 100 20, 180 30 S 270 110, 350 80 S 450 20, 510 30" />
        <path className="draw" d="M10 90 C 90 90, 100 20, 180 30 S 270 110, 350 80 S 450 20, 510 30" />
        {[[10, 90], [180, 30], [350, 80], [510, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" style={{ "--i": i }} />)}
      </svg>
      <ul className="rm-gen-steps">
        {GEN_STEPS.map((s, i) => (
          <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>
            <i>{i < step ? <Check size={13} strokeWidth={3} /> : null}</i>{s}
          </li>
        ))}
      </ul>
      <small>This usually takes 10 to 20 seconds.</small>
    </div>
  );
}

/* ---------------- one roadmap ---------------- */
function RoadmapView({ data, onToggle, onEnrollTrack, burst }) {
  const { roadmap, builtInTrack } = data;
  const stages = roadmap.stages || [];
  const doneCount = stages.filter((s) => s.done).length;
  const pct = stages.length ? Math.round((doneCount / stages.length) * 100) : 0;
  const nextIndex = stages.findIndex((s) => !s.done);
  const allDone = stages.length > 0 && nextIndex === -1;

  // done stages start folded; the student can open any of them
  const [openState, setOpenState] = useState({});
  const isOpen = (i) => (i in openState ? openState[i] : !stages[i].done);
  const flip = (i) => setOpenState((o) => ({ ...o, [i]: !isOpen(i) }));

  const stageRefs = useRef([]);
  const goNext = () => stageRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });

  const mark = (i, e) => {
    const done = !stages[i].done;
    if (done) {
      burst(e.currentTarget.getBoundingClientRect(), doneCount + 1 === stages.length);
      setOpenState((o) => ({ ...o, [i]: false }));
    } else {
      setOpenState((o) => ({ ...o, [i]: true }));
    }
    onToggle(i, done);
  };

  const track = builtInTrack ? trackMeta(builtInTrack) : null;

  return (
    <div className="rm-view">
      {track && (
        <div className="rm-banner rise">
          <span className="rm-banner-ic"><Sparkles size={20} /></span>
          <p><b>Good news!</b> {track.label} has a full CodeMentor  course with 20 levels, quizzes, projects and a certificate.</p>
          <button type="button" className="rm-btn pri sm" onClick={() => onEnrollTrack && onEnrollTrack(builtInTrack)}>Open the {track.label} course →</button>
        </div>
      )}

      <section className="rm-hero rise">
        <div className="rm-hero-l">
          <div className="rm-pills">
            <span><Compass size={14} />{roadmap.topic}</span>
            <span><Target size={14} />{levelLabel(roadmap.experience)}</span>
            <span><Clock size={14} />{roadmap.hoursPerWeek || 5} h / week</span>
            <span><Layers size={14} />{stages.length} stages</span>
          </div>
          <h2>{roadmap.title}</h2>
          {roadmap.overview && <p className="ov">{roadmap.overview}</p>}
          {roadmap.goal && <p className="goal"><Flag size={15} /> Your goal: {roadmap.goal}</p>}
          {!allDone && nextIndex >= 0 && (
            <button type="button" className="rm-next" onClick={goNext}>
              <span>Next up</span>Stage {pad(nextIndex + 1)} · {stages[nextIndex].title}<ChevronDown size={16} />
            </button>
          )}
          {allDone && <p className="rm-alldone"><Trophy size={16} /> Every stage is done. Time for the capstone!</p>}
        </div>
        <div className="rm-hero-r">
          <Ring pct={pct} size={150} stroke={13}>
            <b><CountUp value={pct} />%</b>
            <small>{doneCount} of {stages.length} done</small>
          </Ring>
        </div>
      </section>

      <ol className="rm-tl" style={{ "--fill": `${stages.length ? (doneCount / stages.length) * 100 : 0}%` }}>
        <span className="rm-rail" aria-hidden="true"><span /></span>
        {stages.map((s, i) => {
          const open = isOpen(i);
          return (
            <li key={i} ref={(el) => { stageRefs.current[i] = el; }} className={`rm-stage rise${s.done ? " done" : ""}${i === nextIndex ? " now" : ""}${open ? " open" : ""}`} style={{ "--d": `${(i % 3) * 70}ms` }}>
              <span className="rm-node" aria-hidden="true">{s.done ? <Check size={18} strokeWidth={3} /> : pad(i + 1)}</span>
              <article className="rm-card rm-sc">
                <button type="button" className="rm-sc-head" onClick={() => flip(i)} aria-expanded={open}>
                  <span className="k">Stage {pad(i + 1)}{s.duration ? <em>{s.duration}</em> : null}</span>
                  <h3>{s.title}</h3>
                  {i === nextIndex && <span className="rm-here">You are here</span>}
                  {s.done && <span className="rm-donetag"><Check size={13} strokeWidth={3} /> Done</span>}
                  <ChevronDown size={18} className="rm-chev" />
                </button>
                <div className="rm-sc-body">
                  <div className="rm-sc-inner">
                    <div className="rm-sec">
                      <h4><Lightbulb size={15} /> Learn</h4>
                      <div className="rm-chips">{s.concepts.map((c, ci) => <span key={ci} style={{ "--i": ci }}>{c}</span>)}</div>
                    </div>
                    <div className="rm-two">
                      {s.exercises?.length > 0 && (
                        <div className="rm-sec">
                          <h4><PenTool size={15} /> Practice</h4>
                          <ul className="rm-list">{s.exercises.map((x, xi) => <li key={xi}>{x}</li>)}</ul>
                        </div>
                      )}
                      {s.debugging?.length > 0 && (
                        <div className="rm-sec bug">
                          <h4><Bug size={15} /> Debug practice</h4>
                          <ul className="rm-list">{s.debugging.map((x, xi) => <li key={xi}>{x}</li>)}</ul>
                        </div>
                      )}
                    </div>
                    {s.project?.title && (
                      <div className="rm-proj">
                        <span className="ic"><Rocket size={18} /></span>
                        <div><small>Mini project</small><b>{s.project.title}</b>{s.project.desc && <p>{s.project.desc}</p>}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rm-sc-foot">
                  <button type="button" className={`rm-btn ${s.done ? "ghost" : "pri"} sm`} onClick={(e) => mark(i, e)}>
                    {s.done ? "Mark as not done" : <><Check size={16} strokeWidth={3} /> Mark stage as done</>}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
        {roadmap.capstone?.title && (
          <li className={`rm-stage rm-capli rise${allDone ? " unlocked" : ""}`}>
            <span className="rm-node cap" aria-hidden="true"><Trophy size={20} /></span>
            <article className="rm-card rm-cap">
              <span className="k">Final capstone{allDone ? <em className="ok">Unlocked</em> : <em>Finish all stages</em>}</span>
              <h3>{roadmap.capstone.title}</h3>
              {roadmap.capstone.desc && <p>{roadmap.capstone.desc}</p>}
            </article>
          </li>
        )}
      </ol>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function RoadmapPage({ onBack, onEnrollTrack }) {
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const topicRef = useRef(null);
  useRise(rootRef);

  // theme — shared with the other new pages
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("cmx-theme") || "light"; } catch { return "light"; } });
  useEffect(() => {
    try { localStorage.setItem("cmx-theme", theme); } catch { /* storage blocked */ }
    document.documentElement.dataset.cmxTheme = theme;
  }, [theme]);
  const toggleTheme = (e) => {
    const next = theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition) { setTheme(next); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => flushSync(() => setTheme(next))).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
        { duration: 900, easing: "cubic-bezier(.6,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  };

  const [form, setForm] = useState(() => ({ topic: readTopicParam(), goal: "", experience: "beginner", hoursPerWeek: 5 }));
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);          // null while loading the list
  const [active, setActive] = useState(null);        // { roadmap, builtInTrack }
  const [opening, setOpening] = useState(false);
  const [confirmId, setConfirmId] = useState(null);  // roadmap waiting for "Delete?"
  const [toast, setToast] = useState("");
  const [sparks, setSparks] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const showToast = (text) => { setToast(text); later(() => setToast(""), 2600); };
  const toTop = () => mainRef.current && rootRef.current && window.innerWidth < 980 && mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

  async function loadList() {
    try {
      const data = await apiRequest("/api/roadmaps", { method: "GET" });
      setSaved(data.roadmaps || []);
      return data.roadmaps || [];
    } catch (err) {
      setSaved([]);
      setError(err.message);
      return [];
    }
  }

  async function openRoadmap(id) {
    setOpening(true);
    setError("");
    try {
      setActive(await apiRequest(`/api/roadmaps/${id}`, { method: "GET" }));
      rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    }
    setOpening(false);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await loadList();
      // coming from Choose Path with a topic -> leave the form ready instead of opening an old roadmap
      if (alive && list.length && !readTopicParam()) openRoadmap(list[0]._id);
      if (alive && readTopicParam()) topicRef.current?.focus();
    })();
    return () => { alive = false; };
    // load once on open
  }, []);

  async function generate(e) {
    e.preventDefault();
    const topic = form.topic.trim();
    if (!topic) { setError("Type the language or technology you want to learn."); topicRef.current?.focus(); return; }
    setGenerating(true);
    setGenTopic(topic);
    setError("");
    toTop();
    try {
      const data = await apiRequest("/api/roadmaps", { method: "POST", body: { ...form, topic } });
      setActive(data);
      await loadList();
      setForm((f) => ({ ...f, topic: "", goal: "" }));
      showToast(`Your ${topic} roadmap is ready!`);
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  async function toggleStage(index, done) {
    const id = active.roadmap._id;
    // update straight away; reload if the server refuses
    setActive((a) => ({ ...a, roadmap: { ...a.roadmap, stages: a.roadmap.stages.map((s, i) => (i === index ? { ...s, done } : s)) } }));
    try {
      const data = await apiRequest(`/api/roadmaps/${id}/stages/${index}`, { method: "PATCH", body: { done } });
      setActive((a) => ({ ...a, roadmap: data.roadmap }));
      loadList();
    } catch (err) {
      setError(err.message);
      openRoadmap(id);
    }
  }

  async function remove(id) {
    setConfirmId(null);
    try {
      await apiRequest(`/api/roadmaps/${id}`, { method: "DELETE" });
      const list = await loadList();
      if (active?.roadmap?._id === id) {
        setActive(null);
        if (list.length) openRoadmap(list[0]._id);
      }
      showToast("Roadmap deleted");
    } catch (err) {
      setError(err.message);
    }
  }

  // sparks from the "done" button, confetti when the whole roadmap is finished
  const burst = (rect, finished) => {
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, stamp = Date.now();
    setSparks(Array.from({ length: 14 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 14, dist = 70 + Math.random() * 70;
      return { id: `${stamp}-${i}`, x: cx, y: cy, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, g: SPARK_GLYPHS[i % SPARK_GLYPHS.length], gold: i % 3 === 0 };
    }));
    later(() => setSparks([]), 1100);
    if (finished) {
      setConfetti(Array.from({ length: 90 }, (_, i) => ({ id: `${stamp}-c${i}`, x: Math.random() * 100, d: Math.random() * 0.8, s: 0.7 + Math.random() * 0.8, r: Math.random() * 720 - 360, c: CONFETTI[i % CONFETTI.length], w: 6 + Math.random() * 6 })));
      later(() => setConfetti([]), 3400);
      showToast("Roadmap complete! Your capstone is unlocked.");
    } else {
      showToast("Stage done. Nice work!");
    }
  };

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const pickTopic = (t) => { setForm((f) => ({ ...f, topic: t })); topicRef.current?.focus(); };
  const levelIdx = Math.max(0, LEVELS.findIndex((l) => l.id === form.experience));
  const hoursPct = ((form.hoursPerWeek - 1) / 39) * 100;
  const activeId = active?.roadmap?._id;

  let right;
  if (generating) right = <Generating topic={genTopic} />;
  else if (active?.roadmap) right = <RoadmapView key={activeId} data={active} onToggle={toggleStage} onEnrollTrack={onEnrollTrack} burst={burst} />;
  else if (opening || saved === null) right = <div className="rm-card rm-skel"><i /><i /><i /><i /></div>;
  else right = <EmptyState onPick={pickTopic} />;

  return (
    <div ref={rootRef} className="cmxr" data-theme={theme}>
      <div className="rm-bg" aria-hidden="true"><div className="rm-blob b1" /><div className="rm-blob b2" /><div className="rm-gridbg" /></div>

      <header className="rm-top">
        <div className="rm-brand"><i>&gt;_</i>CodeMentor<span></span></div>
        <div className="rm-tr">
          {onBack && <button type="button" className="rm-btn ghost sm" onClick={onBack}><ArrowLeft size={16} /> Back</button>}
          <button type="button" className="rm-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            <i>{theme === "dark"
              ? <svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
              : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}</i>
          </button>
        </div>
      </header>

      <section className="rm-head">
        <span className="rm-eyebrow"><Compass size={14} /> AI Roadmap · any language</span>
        <BounceTitle a="Learn any language," b="step by step" />
        <p className="rm-sub">Not in our 5 tracks? Tell the AI what you want to learn and how much time you have. It builds a full plan with practice, debugging tasks and projects.</p>
      </section>

      <div className="rm-grid">
        <aside className="rm-side">
          {/* saved roadmaps first, so a returning student finds them straight away (hidden until there is one) */}
          {saved?.length !== 0 && (
            <div className="rm-card rm-saved rise">
              <h3>My roadmaps {saved?.length ? <em>{saved.length}</em> : null}</h3>
              {saved === null && <div className="rm-skel sm"><i /><i /></div>}
              <div className="rm-items">
                {saved?.map((r) => {
                  const p = r.stageCount ? Math.round((r.doneCount / r.stageCount) * 100) : 0;
                  return (
                    <div key={r._id} className={`rm-item${r._id === activeId ? " on" : ""}`}>
                      <button type="button" className="rm-item-main" onClick={() => openRoadmap(r._id)} disabled={opening}>
                        <span className="rm-tile" style={{ background: tileColor(r.topic) }}>{tileText(r.topic)}</span>
                        <span className="rm-item-t"><b>{r.topic}</b><small>{r.doneCount}/{r.stageCount} stages · {levelLabel(r.experience)}</small></span>
                        <Ring pct={p} size={34} stroke={4}><small className="mini">{p}</small></Ring>
                      </button>
                      {confirmId === r._id ? (
                        <span className="rm-confirm">
                          <button type="button" className="yes" onClick={() => remove(r._id)}>Delete</button>
                          <button type="button" onClick={() => setConfirmId(null)}>Keep</button>
                        </span>
                      ) : (
                        <button type="button" className="rm-del" onClick={() => setConfirmId(r._id)} aria-label={`Delete the ${r.topic} roadmap`}><Trash2 size={16} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <form className="rm-card rm-form rise" onSubmit={generate}>
            <h3><Sparkles size={18} /> New roadmap</h3>

            <label className="rm-lbl" htmlFor="rm-topic">What do you want to learn?</label>
            <div className="rm-inp">
              <MapIcon size={18} />
              <input id="rm-topic" ref={topicRef} value={form.topic} onChange={field("topic")} maxLength={60} placeholder="e.g. Go, Kotlin, SQL, Rust" autoComplete="off" />
            </div>
            <div className="rm-sugg">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} className={form.topic.toLowerCase() === s.toLowerCase() ? "on" : ""} onClick={() => pickTopic(s)}>{s}</button>
              ))}
            </div>

            <label className="rm-lbl" htmlFor="rm-goal">Your goal <small>(optional)</small></label>
            <textarea id="rm-goal" className="rm-ta" rows={2} maxLength={200} value={form.goal} onChange={field("goal")} placeholder="e.g. build REST APIs for my final year project" />

            <span className="rm-lbl">Your level</span>
            <div className="rm-seg" style={{ "--x": levelIdx }}>
              <span className="ind" aria-hidden="true" />
              {LEVELS.map((l) => (
                <button type="button" key={l.id} className={form.experience === l.id ? "on" : ""} onClick={() => setForm((f) => ({ ...f, experience: l.id }))} aria-pressed={form.experience === l.id}>{l.label}</button>
              ))}
            </div>

            <label className="rm-lbl" htmlFor="rm-hours">Time per week <b className="rm-hv">{form.hoursPerWeek} h</b></label>
            <input id="rm-hours" type="range" min={1} max={40} value={form.hoursPerWeek} className="rm-range" style={{ "--p": `${hoursPct}%` }}
              onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: Number(e.target.value) }))} />
            <div className="rm-range-l"><span>1 h</span><span>20 h</span><span>40 h</span></div>

            {error && <p className="rm-err" role="alert">{error}</p>}
            <button type="submit" className="rm-btn pri big" disabled={generating}>
              {generating ? <><span className="rm-spin" /> Generating…</> : <><Sparkles size={18} /> Generate my roadmap</>}
            </button>
          </form>

        </aside>

        <main className="rm-main" ref={mainRef}>{right}</main>
      </div>

      <div className={`rm-toast${toast ? " show" : ""}`} role="status">{toast}</div>
      {sparks.map((s) => (
        <span key={s.id} className="rm-spark" style={{ left: s.x, top: s.y, "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, color: s.gold ? "var(--gold)" : undefined }}>{s.g}</span>
      ))}
      {confetti.length > 0 && (
        <div className="rm-confetti" aria-hidden="true">
          {confetti.map((c) => <i key={c.id} style={{ left: `${c.x}%`, "--d": `${c.d}s`, "--s": c.s, "--r": `${c.r}deg`, background: c.c, width: c.w, height: c.w * 0.45 }} />)}
        </div>
      )}
    </div>
  );
}
