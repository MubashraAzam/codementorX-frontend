import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { apiRequest } from "../utils/api";
import "./choose/choosePath.css";

/**
 * ChoosePath — card-deck version
 * ------------------------------
 * Shown after login/registration (and whenever a student adds another track).
 *
 * Props (all optional except onSelectPath):
 *   username      string    shown in the top bar
 *   onSelectPath  fn(user)  called after the choice is saved, with the updated user from
 *                           POST /api/courses/enroll (Module 1.3). App.jsx applies it and opens the dashboard.
 *   enrollments   string[]  tracks the student already has. If not passed, the page reads them
 *                           from GET /api/auth/me. Enrolled cards show a badge and "Continue ...".
 *   onBack        fn        "← Dashboard" button. If not passed, the button appears by itself
 *                           when the student already has a track, and opens /dashboard.
 */

// ---------- track data (edit texts here) ----------
const LANGS = [
  {
    id: "python", name: "Python", tile: "py", tag: "Beginner friendly", diff: 1, runs: "Runs in your browser",
    line: "The perfect first language: readable, powerful and in demand everywhere.",
    about: "Start from print() and finish with files, classes and real projects. Python reads almost like English, so you can focus on thinking like a programmer.",
    levels: ["Hello World & Setup", "Variables & Types", "Input & Output", "Conditions", "Loops", "Functions"],
    projects: ["Quiz game", "Grade calculator", "Expense tracker"], // TODO: your real project names
    code: [["kw", "def"], ["", " greet(name):\n    "], ["kw", "return"], ["", " "], ["st", 'f"Hello, {name}!"'], ["", "\n\nprint(greet("], ["st", '"Ayesha"'], ["", "))"]],
  },
  {
    id: "cpp", name: "C++", tile: "C++", tag: "High performance", diff: 3, runs: "Runs on a cloud sandbox",
    line: "Master speed and control: the language behind games, systems and engines.",
    about: "Learn how computers really run your code: memory, types and speed. Great for problem solving and competitive programming.",
    levels: ["Setup & First Program", "Variables & Types", "Input & Output", "Conditions", "Loops", "Functions"],
    projects: ["Bank account system", "Tic-tac-toe", "Student records"],
    code: [["kw", "#include"], ["", " <iostream>\n"], ["kw", "int"], ["", " main() {\n    std::cout << "], ["st", '"Hello, Ayesha!"'], ["", ";\n}"]],
  },
  {
    id: "java", name: "Java", tile: "{ }", tag: "Object oriented", diff: 2, runs: "Runs on a cloud sandbox",
    line: "Classes, objects and clean structure: the language of Android and big companies.",
    about: "Build strong object-oriented habits: classes, inheritance and interfaces, the way large teams write software.",
    levels: ["Setup & First Program", "Variables & Data Types", "Input with Scanner", "Conditions", "Loops", "Methods"], // TODO: real level names
    projects: ["Library manager", "ATM simulator", "Shape calculator"],
    code: [["kw", "class"], ["", " Main {\n  "], ["kw", "public static void"], ["", " main(String[] a) {\n    System.out.println("], ["st", '"Hi, Ayesha!"'], ["", ");\n  }\n}"]],
  },
  {
    id: "javascript", name: "JavaScript", tile: "JS", tag: "Language of the web", diff: 2, runs: "Runs in your browser",
    line: "Make web pages think: functions, arrays and events, right in your browser.",
    about: "The language every website speaks. Learn variables, functions, arrays, objects and async code, then make pages interactive.",
    levels: ["Hello World & Console", "Variables: let & const", "Operators", "Conditions", "Loops", "Functions"], // TODO: real level names
    projects: ["To-do list", "Tip calculator", "Weather card"],
    code: [["kw", "const"], ["", " greet = (name) =>\n  "], ["st", "`Hello, ${name}!`"], ["", ";\n\nconsole.log(greet("], ["st", '"Ayesha"'], ["", "));"]],
  },
  {
    id: "react", name: "React", tile: "atom", tag: "Build real interfaces", diff: 3, runs: "Live preview in your browser",
    line: "Components, state and props, with a live preview of your app as you type.",
    about: "Build real user interfaces from small reusable components. Best after JavaScript basics.",
    levels: ["Setup & JSX", "Components", "Props", "State with useState", "Events", "Lists & Keys"], // TODO: real level names
    projects: ["Counter app", "Profile card", "Movie search"],
    code: [["kw", "export default function"], ["", " App() {\n  "], ["kw", "return"], ["", " <h1>Hello, Ayesha!</h1>;\n}"]],
  },
];
const DIFF_NAMES = ["", "Easy", "Medium", "Hard"];
const SPARK_GLYPHS = ["</>", "{ }", "★", "( )", "=>", "★", ";", "★"];

// ---------- small pieces ----------
const Atom = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.6" fill="#fff" />
  </svg>
);

function BounceTitle({ a, b }) {
  const ref = useRef(null);
  useEffect(() => {
    const iv = setInterval(() => {
      const h = ref.current; if (!h) return;
      h.classList.remove("hop"); void h.offsetWidth; h.classList.add("hop");
    }, 5200);
    return () => clearInterval(iv);
  }, []);
  let i = 0;
  const words = (text, accent) => text.split(" ").map((w, wi, arr) => (
    <span key={`${text}-${wi}`}>
      <span className="word">
        {[...w].map((c) => <span key={i} className="ch" style={{ "--i": i++, ...(accent ? { color: "var(--accent)" } : {}) }}>{c}</span>)}
      </span>
      {wi < arr.length - 1 && <span className="sp" />}
    </span>
  ));
  return <h1 ref={ref}>{words(a)}<span className="sp" />{words(b, true)}</h1>;
}

function Mascot() {
  return (
    <svg viewBox="0 0 140 240" aria-hidden="true">
      <ellipse cx="70" cy="232" rx="34" ry="6" fill="#000" opacity="0.08" />
      <rect x="46" y="210" width="22" height="10" rx="4" fill="#1a1a2e" /><rect x="72" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
      <rect x="48" y="168" width="16" height="44" rx="5" fill="#25367C" /><rect x="76" y="168" width="16" height="44" rx="5" fill="#25367C" />
      <path d="M34 106 Q33 88 70 84 Q107 88 106 106 L110 172 Q70 182 30 172 Z" fill="#25367C" />
      <path d="M58 90 L70 108 L82 90" fill="#fff" /><path d="M67 92 L70 100 L73 92 L71.5 97 L70 118 L68.5 97 Z" fill="#F49B00" />
      <rect x="20" y="104" width="15" height="54" rx="7" fill="#25367C" /><circle cx="27" cy="160" r="10" fill="#f4c9a0" />
      <path d="M104 100 Q122 96 128 76 Q130 68 124 65 Q118 63 115 72 Q110 86 100 98Z" fill="#25367C" /><circle cx="126" cy="66" r="10" fill="#f4c9a0" />
      <rect x="63" y="74" width="14" height="14" fill="#f4c9a0" /><circle cx="70" cy="52" r="30" fill="#f4c9a0" />
      <path d="M41 46 Q40 18 70 16 Q100 18 99 46 L99 34 Q99 22 70 20 Q41 22 41 34Z" fill="#4a3526" />
      <ellipse cx="57" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
      <ellipse cx="83" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
      <circle cx="57" cy="55" r="2.8" fill="#2b2b2b" /><circle cx="83" cy="55" r="2.8" fill="#2b2b2b" />
      <path d="M58 68 Q70 76 82 68" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Saves the choice. Uses /api/courses/enroll (multi-course) and falls back to the old profile route.
async function saveChoice(id) {
  try {
    return await apiRequest("/api/courses/enroll", { method: "POST", body: { language: id } });
  } catch (err) {
    const msg = String(err?.message || "");
    if (err?.status === 404 || /not found|cannot post/i.test(msg)) {
      return apiRequest("/api/auth/profile", { method: "PUT", body: { language: id } });
    }
    throw err;
  }
}

// Smooth scroll inside an element (used when a card is picked)
function glideScroll(el, to, ms) {
  if (!el) return;
  const from = el.scrollTop;
  let t0 = null;
  const f = (t) => {
    if (t0 === null) t0 = t;
    const p = Math.min(1, (t - t0) / ms), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    el.scrollTop = from + (to - from) * e;
    if (p < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

// Code symbols that burst out of the button after a track is saved
let sparkBatch = 0;
function makeSparks(rect) {
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, batch = ++sparkBatch;
  return Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 16, dist = 90 + Math.random() * 90;
    return { id: `${batch}-${i}`, x: cx, y: cy, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, r: Math.random() * 90 - 45, g: SPARK_GLYPHS[i % SPARK_GLYPHS.length], gold: i % 3 === 0 };
  });
}

/* ===================================================================== */
// Reads the student's tracks from the server (used when App.jsx does not pass `enrollments`)
async function fetchEnrollments() {
  try {
    const me = await apiRequest("/api/auth/me");
    const list = me?.enrollments || me?.user?.enrollments || [];
    return Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.language)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Goes to the dashboard without reloading (React Router listens to popstate)
function goToDashboard() {
  window.history.pushState({}, "", "/dashboard");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function ChoosePath({ username = "Student", onSelectPath, enrollments: enrollmentsProp, onBack }) {
  const [fetched, setFetched] = useState([]);   // tracks read from the server
  const [added, setAdded] = useState([]);       // tracks saved on this page
  useEffect(() => {
    if (enrollmentsProp) return undefined;
    let alive = true;
    fetchEnrollments().then((list) => { if (alive) setFetched(list); });
    return () => { alive = false; };
  }, [enrollmentsProp]);
  const enrollments = [...new Set([...(enrollmentsProp || fetched), ...added])];
  const handleBack = onBack || (enrollments.length ? goToDashboard : null);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const timers = useRef([]);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // theme — shared with the landing page
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

  // stage width -> scale factor for the fan (k) and phone layout (narrow)
  const [k, setK] = useState(1);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const measure = () => {
      const w = stageRef.current?.clientWidth || 1280;
      setK(Math.max(0.42, Math.min(1, (w - 40) / 1180)));
      setNarrow(w < 960);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // deck state
  const [order, setOrder] = useState(LANGS.map((l) => l.id));
  const [dealt, setDealt] = useState([]);          // ids that have landed in the fan
  const [mode, setMode] = useState("fan");          // "fan" | "detail"
  const [current, setCurrent] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [spinning, setSpinning] = useState({});      // id -> true while flipping
  const [shuffle, setShuffle] = useState(null);      // null or { phase, jitter }
  const [shuffleSpin, setShuffleSpin] = useState(0);
  const [panelOn, setPanelOn] = useState(false);
  const [bubble, setBubble] = useState({ text: "Pick a card!", key: 0 });
  const say = (text) => setBubble((b) => ({ text, key: b.key + 1 }));

  const spin = useCallback((id) => {
    setSpinning((s) => ({ ...s, [id]: false }));
    requestAnimationFrame(() => setSpinning((s) => ({ ...s, [id]: true })));
    setTimeout(() => setSpinning((s) => ({ ...s, [id]: false })), 1000);
  }, []);

  // deal the cards in, one by one
  useEffect(() => {
    LANGS.forEach((l, slot) => later(() => { setDealt((d) => [...d, l.id]); spin(l.id); }, 500 + slot * 160));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glide = (to, ms = 700) => glideScroll(rootRef.current, to, ms);

  const doShuffle = () => {
    if (shuffle || mode !== "fan") return;
    setShuffleSpin((n) => n + 1);
    const jitter = LANGS.map(() => [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 26]);
    setShuffle({ phase: 1, jitter });
    later(() => setShuffle({ phase: 2, jitter }), 420);
    later(() => setShuffle({ phase: 3, jitter: LANGS.map(() => [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20]) }), 800);
    later(() => {
      setOrder((o) => {
        const n = [...o];
        for (let i = n.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [n[i], n[j]] = [n[j], n[i]]; }
        return n;
      });
      setShuffle(null);
      say("New order! Which one feels right?");
    }, 1200);
  };

  const pick = (id) => {
    if (shuffle || id === current || saving) return;
    setCurrent(id); setMode("detail"); setHovered(null); setSaveState(null); setError("");
    setPanelOn(false); later(() => setPanelOn(true), 220);
    spin(id);
    say("Great choice! Have a look inside.");
    const top = stageRef.current ? stageRef.current.offsetTop - 70 : 0;
    glide(narrow ? 0 : top);
  };
  const backToCards = () => {
    setMode("fan"); setPanelOn(false); later(() => setCurrent(null), 400); setSaveState(null); setError("");
    glide(0);
  };

  // card positions
  const poseOf = (id) => {
    const slot = order.indexOf(id), n = order.length, mid = (n - 1) / 2, d = slot - mid;
    if (!dealt.includes(id)) return { t: "translate(0px,520px) scale(.6)", z: 1 };
    if (shuffle) {
      const [jx, jr] = shuffle.jitter[slot];
      if (shuffle.phase === 2) return { t: `translate(${(slot % 2 ? 1 : -1) * 120 * k}px,${30 + slot * 4}px) rotate(${(slot % 2 ? 1 : -1) * 14}deg) scale(${0.95 * Math.max(k, 0.6)})`, z: 10 + slot };
      return { t: `translate(${jx}px,${40 - slot * 3}px) rotate(${jr}deg) scale(${0.92 * Math.max(k, 0.6)})`, z: 10 + slot };
    }
    if (mode === "detail") {
      if (id === current) return narrow ? { t: "translate(0px,-30px) scale(.85)", z: 50 } : { t: "translate(-400px,40px) rotate(-3deg) scale(1.18)", z: 50 };
      const others = order.filter((x) => x !== current), j = others.indexOf(id);
      if (narrow) return { t: "translate(0px,-30px) scale(.6)", z: 5, hidden: true };
      return { t: `translate(${-400 + (j - 1.5) * 104}px,322px) rotate(${(j - 1.5) * 4}deg) scale(.4)`, z: 20 + j };
    }
    const s = Math.max(k, 0.55);
    if (hovered === id) return { t: `translate(${d * 190 * k}px,${(Math.abs(d) * 22 + 30) * k - 40}px) rotate(0deg) scale(${1.07 * s})`, z: 40 };
    return { t: `translate(${d * 190 * k}px,${(Math.abs(d) * 22 + 30) * k}px) rotate(${d * 6}deg) scale(${s})`, z: 10 + slot };
  };

  // saving
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState(null); // null | "saved"
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [sparks, setSparks] = useState([]);
  const goBtnRef = useRef(null);

  const burst = () => {
    const r = goBtnRef.current?.getBoundingClientRect(); if (!r) return;
    setSparks(makeSparks(r));
    later(() => setSparks([]), 1200);
  };

  const confirm = async (lang) => {
    if (saving) return;
    setSaving(true); setError("");
    try {
      const data = await saveChoice(lang.id);
      setSaveState("saved");
      setAdded((list) => (list.includes(lang.id) ? list : [...list, lang.id]));
      setToast(`Welcome to the ${lang.name} track! Level 1 is open.`);
      burst();
      later(() => setToast(""), 2600);
      // App.jsx expects the updated user ({ language, enrollments, ... }) from the server.
      const user = data && typeof data === "object" && data.language ? data : { ...(data || {}), language: lang.id };
      later(() => onSelectPath && onSelectPath(user), 1500);
    } catch (err) {
      setError(err?.message || "Could not save your choice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const lang = LANGS.find((l) => l.id === current);
  const isEnrolled = (id) => enrollments.includes(id);

  // "/choose-path?track=java" (from the AI Roadmap page) opens that card once the deck is dealt
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("track");
    if (!LANGS.some((l) => l.id === preset)) return undefined;
    const t = setTimeout(() => pick(preset), 500 + LANGS.length * 160 + 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className={`cmxc${mode === "detail" ? " is-detail" : ""}${narrow ? " narrow" : ""}`} data-theme={theme}>
      <div className="bgfx" aria-hidden="true"><div className="blob b1" /><div className="blob b2" /><div className="gridbg" /></div>

      <div className="topwrap">
        <header className="top">
          <div className="brand"><i>&gt;_</i>CodeMentor<span>-X</span></div>
          <div className="tr">
            {handleBack && <button type="button" className="btn ghost back-btn" onClick={handleBack}>← Dashboard</button>}
            <button type="button" className="toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              <i>{theme === "dark"
                ? <svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
                : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}</i>
            </button>
            <span>Hi, {username || "Student"}</span>
            <span className="av">{(username || "S")[0].toUpperCase()}</span>
          </div>
        </header>
      </div>

      <div className="head">
        <span className="eyebrow">Pick a track</span>
        <BounceTitle a="Choose your" b="learning path" />
        <p className="sub">
          {lang && mode === "detail" ? `Here is everything inside the ${lang.name} track.` : "Every track has 20 levels, 10 projects and an AI viva. Shuffle the deck, then tap a card to see everything inside it."}
        </p>
        <div className={`tools${mode === "detail" ? " hide" : ""}`}>
          <button type="button" className={`btn ghost${shuffleSpin ? " spin" : ""}`} key={shuffleSpin} onClick={doShuffle}>
            <svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>Shuffle the deck
          </button>
        </div>
      </div>

      <div className="stage" ref={stageRef}>
        <div className="mascot" aria-hidden="true">
          <div className="bob"><Mascot /></div>
          <div className="bubble" key={bubble.key}>{bubble.text}</div>
        </div>

        {LANGS.map((l, idx) => {
          const p = poseOf(l.id);
          return (
            <button
              type="button"
              key={l.id}
              className={`card c-${l.id}${spinning[l.id] ? " spinning" : ""}${l.id === current ? " picked" : ""}`}
              style={{ transform: p.t, zIndex: p.z, opacity: p.hidden ? 0 : 1, pointerEvents: p.hidden ? "none" : undefined }}
              onClick={() => pick(l.id)}
              onMouseEnter={() => mode === "fan" && !shuffle && setHovered(l.id)}
              onMouseLeave={() => setHovered((h) => (h === l.id ? null : h))}
              aria-label={`${l.name} track${isEnrolled(l.id) ? " (enrolled)" : ""}`}
            >
              <span className="inner">
                <span className="face front">
                  <span className="num">0{idx + 1}</span>
                  {isEnrolled(l.id) && <span className="badge-in">Enrolled</span>}
                  <span className="glyph">{l.tile === "atom" ? <Atom /> : l.tile}</span>
                  <span className="h3">{l.name}</span>
                  <span className="tag">{l.tag}</span>
                  <span className="line">{l.line}</span>
                  <span className="meta">
                    <span>20 levels · 10 projects</span>
                    <span className="diff">{[1, 2, 3].map((n) => <i key={n} className={n <= l.diff ? "on" : ""} />)}</span>
                  </span>
                </span>
                <span className="face back"><b>&gt;_</b></span>
              </span>
            </button>
          );
        })}

        <div className={`panel${lang && panelOn ? " show" : ""}`}>
          {lang && (
            <>
              <div className="k">{lang.tag} · {lang.runs}</div>
              <h2>Learn <span>{lang.name}</span></h2>
              <p className="d">{lang.about}</p>
              <div className="stats">
                <div className="stat"><b>20</b><span>levels</span></div>
                <div className="stat"><b>10</b><span>projects</span></div>
                <div className="stat"><b>{DIFF_NAMES[lang.diff]}</b><span>difficulty</span></div>
                <div className="stat"><b>1</b><span>AI viva</span></div>
              </div>
              <div className="cols">
                <div>
                  <h4>First levels</h4>
                  <div className="lvls">
                    {lang.levels.map((t, i) => (
                      <div className="lv" key={t} style={{ "--i": i }}><b>{String(i + 1).padStart(2, "0")}</b>{t}{i === 0 && <em>open</em>}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>Example projects</h4>
                  <div className="chips">{lang.projects.map((t, i) => <span key={t} style={{ "--i": i }}>{t}</span>)}</div>
                  <h4 style={{ marginTop: 14 }}>A taste of {lang.name}</h4>
                  <pre>{lang.code.map(([cls, text], i) => (cls ? <span key={i} className={cls}>{text}</span> : <span key={i}>{text}</span>))}</pre>
                </div>
              </div>
              {error && <p className="err">{error}</p>}
              <div className="acts">
                <button type="button" ref={goBtnRef} className="btn pri" disabled={saving || saveState === "saved"} onClick={() => confirm(lang)}>
                  {saving ? "Saving your choice..." : saveState === "saved" ? `✓ ${lang.name} added to your tracks` : isEnrolled(lang.id) ? `Continue ${lang.name} →` : `Start learning ${lang.name} →`}
                </button>
                <button type="button" className="btn ghost" onClick={backToCards}>All cards</button>
              </div>
            </>
          )}
        </div>
        <div className={`dock-label${mode === "detail" ? "" : " hide"}`}>Other tracks · tap to switch</div>
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status">{toast}</div>
      {sparks.map((s) => (
        <span key={s.id} className="spark" style={{ left: s.x, top: s.y, "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, "--r": `${s.r}deg`, color: s.gold ? "#F5B83D" : undefined }}>{s.g}</span>
      ))}
    </div>
  );
}
