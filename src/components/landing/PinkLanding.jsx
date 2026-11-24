import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import codementorLogo from "../../assets/codementor-logo.png";
import "./pinkLanding.css";

/* =====================================================================
   CodeMentor-X landing page (pink light theme / soft plum dark theme)
   - onOpenAuth("login" | "register") opens the existing login popup.
   - All texts are in the arrays and JSX below, so they are easy to edit.
   ===================================================================== */

// Colours used for the gradient words in headings (must match pinkLanding.css)
const GRADIENTS = {
  light: ["#A3245A", "#E2577F", "#F29A7E"],
  dark: ["#F2A7C0", "#F6BFB0", "#E7A0D6"],
};

const MARQUEE_WORDS = ["Python", "C++", "Java", "JavaScript", "React", "AI Roadmaps", "Voice Viva", "QR Certificate", "Hint Ladder", "Live Code"];

// Roadmap slide: first 6 levels of each track.
// TODO: replace Java, JavaScript and React with your real level names.
const TRACKS = {
  Python: ["Hello World & Setup", "Variables & Types", "Input & Output", "Conditions", "Loops", "Functions"],
  "C++": ["Setup & First Program", "Variables & Types", "Input & Output", "Conditions", "Loops", "Functions"],
  Java: ["Setup & First Program", "Variables & Data Types", "Input with Scanner", "Conditions", "Loops", "Methods"],
  JavaScript: ["Hello World & Console", "Variables: let & const", "Operators", "Conditions", "Loops", "Functions"],
  React: ["Setup & JSX", "Components", "Props", "State with useState", "Events", "Lists & Keys"],
};
const TRACK_NAMES = Object.keys(TRACKS);
const TRACK_PROGRESS = [15, 25, 10, 20, 30]; // % bar shown on the card for each track
const TRACK_REACHED = [2, 4, 1, 3, 5];      // how many of the 20 dots are done for each track
const DONE_STARS = [3, 2];                   // stars on level 1 and level 2
const CURRENT_LEVEL = 2;                     // index of the "IN PROGRESS" row
const SLIDE_MS = 4000;                       // time per track on the roadmap slide

// Live code typing: [css class, text]. Classes: c = comment, f = function, s = string
const CODE = [
  ["c", "# Level 2: Variables & Input\n"], ["", "name = "], ["f", "input"], ["", "("], ["s", '"Your name: "'], ["", ")\n"],
  ["", "age = "], ["f", "int"], ["", "("], ["f", "input"], ["", "("], ["s", '"Your age: "'], ["", "))\n\n"],
  ["f", "print"], ["", "("], ["s", 'f"Hello, {name}! You are {age}."'], ["", ")"],
];
const CODE_CHARS = CODE.flatMap(([cls, text]) => [...text].map((ch) => [cls, ch]));

const FEATURES = [
  { title: "AI Mentor", text: "Lessons, hints in three steps and pair programming that guides you without giving the answer.", icon: "bulb" },
  { title: "Live Code Lab", text: "Run Python, C++, Java, JavaScript and React right in your browser.", icon: "bolt" },
  { title: "Step Visualiser", text: "Watch your code run line by line and see every variable change.", icon: "eye" },
  { title: "AI Roadmaps", text: "A personal plan built from the topics you got wrong.", icon: "list" },
  { title: "Voice Viva", text: "A live AI interview at the end of every track. Score 75% to pass.", icon: "mic" },
  { title: "QR Certificate", text: "A certificate with a QR code that anyone can verify online.", icon: "qr" },
];

const LANGUAGES = [
  { name: "Python", tile: "py", tag: "Beginner friendly" },
  { name: "C++", tile: "C++", tag: "High performance" },
  { name: "Java", tile: "{ }", tag: "Object oriented" },
  { name: "JavaScript", tile: "JS", tag: "Language of the web" },
  { name: "React", tile: "⚛", tag: "Build real interfaces" },
];

const STEPS = [
  { title: "Pick a track", text: "Choose one of 5 languages and set up in a minute." },
  { title: "Learn with your mentor", text: "Short lessons, practice and 3-step hints." },
  { title: "Clear levels and build", text: "Pass 20 levels and build 5 projects." },
  { title: "Defend and certify", text: "Pass the AI viva and get your QR certificate." },
];

/* ---------------- helpers ---------------- */
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",")})`;
function gradientAt(colors, t) {
  const [a, b, c] = colors.map(hexToRgb);
  return t < 0.5 ? mix(a, b, t * 2) : mix(b, c, (t - 0.5) * 2);
}

/** One line of text split into bouncing letters. `start` keeps the delay running across lines. */
function BounceLine({ text, start = 0, gradient }) {
  const letters = text.replace(/ /g, "").length;
  let i = 0;
  const words = text.split(" ");
  return (
    <span className="line">
      {words.map((word, wi) => (
        <span key={wi}>
          <span className="word">
            {[...word].map((ch) => {
              const idx = i++;
              const style = { "--i": start + idx };
              if (gradient) style.color = gradientAt(gradient, letters > 1 ? idx / (letters - 1) : 0);
              return <span className="ch" style={style} key={idx}>{ch}</span>;
            })}
          </span>
          {wi < words.length - 1 && <span className="sp" />}
        </span>
      ))}
    </span>
  );
}

/** Section heading: first line plain, second line in gradient colours. */
function BounceHeading({ line1, line2, gradient, style }) {
  return (
    <h2 className="split" style={style}>
      <BounceLine text={line1} />
      {line2 && <BounceLine text={line2} start={line1.replace(/ /g, "").length} gradient={gradient} />}
    </h2>
  );
}

function Icon({ name }) {
  const paths = {
    bulb: <><path d="M12 3a6 6 0 0 0-6 6c0 2.2 1.2 3.7 2.5 4.8V17h7v-3.2C16.8 12.7 18 11.2 18 9a6 6 0 0 0-6-6z" /><path d="M9.5 21h5" /></>,
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    list: <path d="M3 6h18M3 12h12M3 18h7" />,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></>,
    qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v7M14 20h3" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

const Star = ({ on }) => (
  <svg viewBox="0 0 24 24" className={on ? "on" : ""} aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" /></svg>
);
const Sparkle = ({ style }) => (
  <svg className="spark" style={style} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" /></svg>
);

/** The original CodeMentor-X teacher + whiteboard drawing (unchanged). */
function ClassroomScene() {
  return (
    <svg className="main" viewBox="0 0 500 400" role="img" aria-label="Teacher mascot next to a whiteboard">
      <ellipse cx="250" cy="380" rx="220" ry="18" fill="#000" opacity="0.06" />
      <g className="wb"><g transform="translate(88, 0)">
        <line x1="100" y1="200" x2="60" y2="350" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
        <line x1="380" y1="200" x2="420" y2="350" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
        <line x1="100" y1="200" x2="130" y2="350" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
        <line x1="380" y1="200" x2="350" y2="350" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
        <rect x="80" y="40" width="320" height="200" rx="12" fill="#fff" stroke="#cbd5e1" strokeWidth="8" />
        <rect x="90" y="240" width="300" height="8" rx="4" fill="#94a3b8" />
        <text x="110" y="90" fontFamily="'JetBrains Mono', Consolas, monospace" fontSize="18" fill="#F49B00" fontWeight="bold">
          def <tspan fill="#14325D">mastery</tspan>(student):
        </text>
        <text x="140" y="120" fontFamily="'JetBrains Mono', Consolas, monospace" fontSize="16" fill="#14325D">
          return <tspan fill="#2e9d62">"Success"</tspan>
        </text>
        <rect x="120" y="150" width="180" height="6" fill="#f1f5f9" rx="3" />
        <rect x="120" y="170" width="140" height="6" fill="#f1f5f9" rx="3" />
        <rect x="120" y="190" width="200" height="6" fill="#f1f5f9" rx="3" />
      </g></g>
      <g className="teacher"><g transform="translate(-32, 150)"><g className="teacher-bob">
        <rect x="46" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
        <rect x="72" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
        <rect x="48" y="168" width="16" height="44" rx="5" fill="#25367C" />
        <rect x="76" y="168" width="16" height="44" rx="5" fill="#25367C" />
        <path d="M34 106 Q33 88 70 84 Q107 88 106 106 L110 172 Q70 182 30 172 Z" fill="#25367C" />
        <path d="M58 90 L70 108 L82 90" fill="#fff" />
        <path d="M67 92 L70 100 L73 92 L71.5 97 L70 118 L68.5 97 Z" fill="#F49B00" />
        <path d="M58 90 L46 116 L60 108 Z" fill="#1a2558" />
        <path d="M82 90 L94 116 L80 108 Z" fill="#1a2558" />
        <rect x="20" y="104" width="15" height="54" rx="7" fill="#25367C" />
        <circle cx="27" cy="160" r="10" fill="#f4c9a0" />
        <path d="M104 100 Q122 96 128 76 Q130 68 124 65 Q118 63 115 72 Q110 86 100 98Z" fill="#25367C" />
        <circle cx="126" cy="66" r="10" fill="#f4c9a0" />
        <rect x="128" y="48" width="28" height="36" rx="3" fill="#e0473a" transform="rotate(-15 128 48)" />
        <rect x="130" y="50" width="3" height="36" rx="1" fill="#c03428" transform="rotate(-15 128 48)" />
        <line x1="133" y1="56" x2="152" y2="50" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)" />
        <line x1="133" y1="62" x2="152" y2="56" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)" />
        <rect x="63" y="74" width="14" height="14" fill="#f4c9a0" />
        <circle cx="70" cy="52" r="30" fill="#f4c9a0" />
        <path d="M41 46 Q40 18 70 16 Q100 18 99 46 L99 34 Q99 22 70 20 Q41 22 41 34Z" fill="#4a3526" />
        <circle cx="40" cy="54" r="5" fill="#f4c9a0" />
        <circle cx="100" cy="54" r="5" fill="#f4c9a0" />
        <ellipse cx="57" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
        <ellipse cx="83" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
        <line x1="44" y1="55" x2="35" y2="52" stroke="#2b2b2b" strokeWidth="2.4" />
        <line x1="96" y1="55" x2="105" y2="52" stroke="#2b2b2b" strokeWidth="2.4" />
        <circle cx="57" cy="55" r="2.8" fill="#2b2b2b" />
        <circle cx="83" cy="55" r="2.8" fill="#2b2b2b" />
        <path d="M48 43 Q57 39 66 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M74 43 Q83 39 92 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M58 68 Q70 76 82 68" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g></g></g>
    </svg>
  );
}

/* ===================================================================== */
export default function PinkLanding({ onOpenAuth }) {
  const rootRef = useRef(null);
  const heroTitleRef = useRef(null);

  // ----- theme (remembered in this browser) -----
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("cmx-theme") || "light"; } catch { return "light"; }
  });
  useEffect(() => { try { localStorage.setItem("cmx-theme", theme); } catch { /* storage blocked */ } }, [theme]);
  // Share the theme with the login / register popup (authModal.css reads html[data-cmx-theme])
  useEffect(() => {
    document.documentElement.dataset.cmxTheme = theme;
    return () => { delete document.documentElement.dataset.cmxTheme; };
  }, [theme]);
  const grad = GRADIENTS[theme];

  const toggleTheme = (e) => {
    const next = theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition) { setTheme(next); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => flushSync(() => setTheme(next)));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 900, easing: "cubic-bezier(.6,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ----- section triggers (set when a section scrolls into view) -----
  const [roadOn, setRoadOn] = useState(false);
  const [codeOn, setCodeOn] = useState(false);
  const [stepsOn, setStepsOn] = useState(false);

  // Hero headline: drop in, then hop every 5.2 s
  useEffect(() => {
    const h1 = heroTitleRef.current;
    const t = setTimeout(() => h1?.classList.add("go"), 150);
    const iv = setInterval(() => {
      if (!h1) return;
      h1.classList.remove("hop"); void h1.offsetWidth; h1.classList.add("hop");
    }, 5200);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  // Reveal on scroll + headings that bounce again each time you scroll back
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const triggers = { road: setRoadOn, code: setCodeOn, steps: setStepsOn };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        if (el.classList.contains("split")) {
          el.classList.add("go");
          setTimeout(() => el.classList.add("hop"), 1600);
        } else el.classList.add("in");
        if (el.dataset.trigger) triggers[el.dataset.trigger]?.(true);
        io.unobserve(el);
      });
    }, { threshold: 0.25 });
    root.querySelectorAll(".reveal:not([data-auto]), h2.split, [data-trigger]").forEach((el) => io.observe(el));

    const seen = new WeakSet();
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const el = e.target;
        if (e.isIntersecting && el.classList.contains("go") && seen.has(el)) {
          el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
        }
        if (e.isIntersecting) seen.add(el);
      });
    }, { threshold: 0.6 });
    root.querySelectorAll("h2.split").forEach((el) => io2.observe(el));

    const t = setTimeout(() => root.querySelectorAll("[data-auto]").forEach((el) => el.classList.add("in")), 700);
    return () => { io.disconnect(); io2.disconnect(); clearTimeout(t); };
  }, []);

  // ----- roadmap slide -----
  const [trackIdx, setTrackIdx] = useState(0);
  const [rowsShown, setRowsShown] = useState(0);
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    if (!roadOn) return;
    setRowsShown(0); setBarPct(0);
    const ts = [setTimeout(() => setBarPct(TRACK_PROGRESS[trackIdx]), 320)];
    for (let k = 0; k < 6; k++) ts.push(setTimeout(() => setRowsShown(k + 1), 340 + k * 110));
    ts.push(setTimeout(() => setTrackIdx((i) => (i + 1) % TRACK_NAMES.length), SLIDE_MS));
    return () => ts.forEach(clearTimeout);
  }, [roadOn, trackIdx]);
  const trackName = TRACK_NAMES[trackIdx];
  const reached = TRACK_REACHED[trackIdx];

  // ----- live code typing + mentor chat -----
  const [typed, setTyped] = useState(0);
  const [chatStage, setChatStage] = useState(0); // 1 output, 2 question, 3 typing dots, 4 answer
  useEffect(() => {
    if (!codeOn) return;
    if (typed < CODE_CHARS.length) {
      const t = setTimeout(() => setTyped((n) => Math.min(n + 2, CODE_CHARS.length)), 28);
      return () => clearTimeout(t);
    }
    const ts = [400, 1100, 1700, 3000].map((ms, i) => setTimeout(() => setChatStage(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, [codeOn, typed]);

  const codeSpans = [];
  CODE_CHARS.slice(0, typed).forEach(([cls, ch]) => {
    const last = codeSpans[codeSpans.length - 1];
    if (last && last.cls === cls) last.text += ch; else codeSpans.push({ cls, text: ch });
  });

  // ----- how it works -----
  const [litSteps, setLitSteps] = useState(0);
  useEffect(() => {
    if (!stepsOn) return;
    const ts = STEPS.map((_, k) => setTimeout(() => setLitSteps(k + 1), 300 + k * 600));
    return () => ts.forEach(clearTimeout);
  }, [stepsOn]);

  // ----- feature cards: glow + tilt that follow the mouse -----
  const tilt = useCallback((e) => {
    const c = e.currentTarget, r = c.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    c.style.setProperty("--mx", `${x}px`); c.style.setProperty("--my", `${y}px`);
    c.style.setProperty("--ry", `${(x / r.width - 0.5) * 10}deg`); c.style.setProperty("--rx", `${(0.5 - y / r.height) * 10}deg`);
  }, []);
  const untilt = useCallback((e) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); }, []);

  const heroLines = ["Learn to code", "with a mentor", "that never clocks out."];
  const heroStarts = [0, 11, 22]; // letters before each line (no spaces)

  return (
    <div className="cmxp" data-theme={theme} ref={rootRef}>
      <div className="bgfx" aria-hidden="true">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" /><div className="gridbg" />
      </div>

      {/* ------------------------------ NAV ------------------------------ */}
      <header className="cmxp-header">
        <nav className="nav">
          <button type="button" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="logo"><img src={codementorLogo} alt="CodeMentor-X logo" /></span>
            <span style={{ color: "var(--text)" }}>CodeMentor<span>-X</span></span>
          </button>
          <div className="links">
            <button type="button" onClick={() => scrollTo("features")}>Features</button>
            <button type="button" onClick={() => scrollTo("roadmap")}>Roadmap</button>
            <button type="button" onClick={() => scrollTo("languages")}>Languages</button>
            <button type="button" onClick={() => scrollTo("how-it-works")}>How it works</button>
          </div>
          <div className="navr">
            <button type="button" className="toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              <i>
                {theme === "dark"
                  ? <svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
                  : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}
              </i>
            </button>
            <button type="button" className="btn ghost" onClick={() => onOpenAuth("login")}>Log in</button>
            <button type="button" className="btn pri" onClick={() => onOpenAuth("register")}>Start learning</button>
          </div>
        </nav>
      </header>

      <main>
        {/* ------------------------------ HERO ------------------------------ */}
        <section id="home" className="wrap hero">
          <div>
            <span className="chip reveal in"><span className="dot" />AI coding mentor · UOG FYP</span>
            <h1 className="split" ref={heroTitleRef}>
              {heroLines.map((t, i) => <BounceLine key={i} text={t} start={heroStarts[i]} gradient={i === 1 ? grad : null} />)}
            </h1>
            <p className="lead reveal d3" data-auto>
              Short lessons, <b>20 levels per track</b>, an AI mentor that explains in English or Urdu, live code in your browser, and a viva that proves you really understand it.
            </p>
            <div className="cta reveal d4" data-auto>
              <button type="button" className="btn pri" onClick={() => onOpenAuth("register")}>Start learning free <span className="arr">→</span></button>
              <button type="button" className="btn ghost" onClick={() => scrollTo("live")}>Watch demo</button>
            </div>
            <div className="trust reveal d5" data-auto>
              <div><b>5</b><span>language tracks</span></div>
              <div><b>20</b><span>levels each</span></div>
              <div><b>10</b><span>projects each</span></div>
              <div><b>1</b><span>AI viva</span></div>
            </div>
          </div>
          <div className="scene">
            <Sparkle style={{ left: "6%", top: "6%" }} />
            <Sparkle style={{ right: "14%", top: "-2%", animationDelay: ".8s" }} />
            <Sparkle style={{ left: "44%", bottom: "4%", animationDelay: "1.6s", width: 14, height: 14 }} />
            <ClassroomScene />
            <div className="fcard fc1"><span className="ic"><svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg></span>+50 XP Earned</div>
            <div className="fcard fc2"><span className="ic"><svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" /></svg></span>Python Master</div>
            <div className="fcard fc3"><span className="ic"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg></span>Hint 1 of 3</div>
          </div>
        </section>

        {/* ------------------------------ MARQUEE ------------------------------ */}
        <div className="marq" aria-label="Languages and features">
          <div className="track">
            {[0, 1].flatMap((r) => MARQUEE_WORDS.map((w, i) => [
              <span key={`${r}-${i}`} className={i % 3 === 1 ? "hl" : ""}>{w}</span>,
              <i key={`${r}-${i}-dot`} />,
            ]))}
          </div>
        </div>

        {/* ------------------------------ ROADMAP ------------------------------ */}
        <section className="wrap block" id="roadmap">
          <div className="road">
            <div>
              <div className="eyebrow reveal">The roadmap</div>
              <BounceHeading line1="20 levels." line2="One clear path." gradient={grad} />
              <p className="sub reveal d2">Pass each level’s 10-question check to unlock the next. Earn up to 3 stars, build projects, then face the AI viva for your certificate.</p>
              <div className="tabs reveal d3">
                {TRACK_NAMES.map((n, i) => (
                  <button type="button" key={n} className={`tab${i === trackIdx ? " on" : ""}`} onClick={() => setTrackIdx(i)}>
                    {n}{i === trackIdx && roadOn && <span className="bar" key={`bar-${trackIdx}`} />}
                  </button>
                ))}
              </div>
              <div className="stats reveal d4">
                <div><b>20</b><span>levels</span></div>
                <div><b>10</b><span>projects</span></div>
                <div><b>3</b><span>hint steps</span></div>
                <div><b>75%</b><span>to pass the viva</span></div>
              </div>
            </div>
            <div className="rcard reveal d2" data-trigger="road">
              <div className="rhead">
                <b style={{ fontSize: 18 }}>{trackName} roadmap</b>
                <span className="mono">{trackName.toLowerCase().replace(/[^a-z]+/g, "")}_roadmap</span>
              </div>
              <div className="pbar"><i style={{ width: `${barPct}%` }} /></div>
              <div className="rows">
                {TRACKS[trackName].map((title, k) => (
                  <div key={`${trackName}-${k}`} className={`row${k < rowsShown ? " show" : ""}${k === CURRENT_LEVEL ? " cur" : ""}${k > CURRENT_LEVEL ? " locked" : ""}`}>
                    <span className="n">{String(k + 1).padStart(2, "0")}</span>
                    <span className="t">{title}</span>
                    {k < CURRENT_LEVEL && <span className="stars">{[0, 1, 2].map((s) => <Star key={s} on={s < DONE_STARS[k]} />)}</span>}
                    {k === CURRENT_LEVEL && <span className="badge prog">IN PROGRESS</span>}
                    {k > CURRENT_LEVEL && (
                      <span className="badge lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>LOCKED</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="path" aria-label={`${reached} of 20 levels done`}>
                {Array.from({ length: 20 }, (_, k) => (
                  <span key={k} style={{ display: "contents" }}>
                    <span className={`node${k < reached ? " done" : ""}${k === reached ? " cur" : ""}`} />
                    {k < 19 && <span className={`seg${k < reached ? " done" : ""}`} />}
                  </span>
                ))}
                <span className="trophy"><svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /></svg></span>
              </div>
              <div className="pathlbl"><span>Level 1</span><span>Level 20 → AI viva → Certificate</span></div>
            </div>
          </div>
        </section>

        {/* ------------------------------ LIVE CODE ------------------------------ */}
        <section className="wrap block" id="live">
          <div className="eyebrow reveal">Live code lab</div>
          <BounceHeading line1="Write it. Run it." line2="Ask why." gradient={grad} />
          <div className="live">
            <div className="editor reveal d1" data-trigger="code">
              <div className="ebar">
                <div className="dots3"><i style={{ background: "#FF6B6B" }} /><i style={{ background: "#FFC24B" }} /><i style={{ background: "#3DD68C" }} /></div>
                <span className="mono">level_02.py</span>
                <button type="button" className="run">▶ Run</button>
              </div>
              <pre className="code">
                {codeSpans.map((p, i) => (p.cls ? <span key={i} className={p.cls}>{p.text}</span> : <span key={i}>{p.text}</span>))}
                <span className="caret" />
              </pre>
              <div className={`out${chatStage >= 1 ? " show" : ""}`}>▶ Hello, Ayesha! You are 21.</div>
            </div>
            <div className="chat reveal d2">
              <h4><span className="av">&gt;_</span>AI mentor <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>English · اردو</span></h4>
              <div className={`msg me${chatStage >= 2 ? " show" : ""}`}>Why do we use input() here?</div>
              {chatStage < 4
                ? <div className={`msg ai typing${chatStage >= 3 ? " show" : ""}`}><i /><i /><i /></div>
                : <div className="msg ai show">input() pauses the program and waits for the user to type. What do you think int() does to that text?</div>}
              <div className="hints">
                <span className={chatStage >= 4 ? "on" : ""}>Hint 1 · a question</span>
                <span>Hint 2 · where to look</span>
                <span>Hint 3 · the idea</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ FEATURES ------------------------------ */}
        <section className="wrap block" id="features">
          <div className="eyebrow reveal">Features</div>
          <BounceHeading line1="Everything from" line2="“Hello” to certified." gradient={grad} />
          <div className="fgrid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`feat reveal d${i % 3}`} onMouseMove={tilt} onMouseLeave={untilt}>
                <div className="ico"><Icon name={f.icon} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------ LANGUAGES ------------------------------ */}
        <section className="wrap block" id="languages">
          <div className="eyebrow reveal">Languages</div>
          <BounceHeading line1="Pick your track." line2="Same mentor." gradient={grad} />
          <div className="lgrid">
            {LANGUAGES.map((l, i) => (
              <button type="button" key={l.name} className={`lang reveal d${i}`} onClick={() => onOpenAuth("register")}>
                <div className="ltile">{l.tile}</div>
                <h3>{l.name}</h3>
                <p>{l.tag}</p>
                <p>20 levels · 10 projects</p>
                <span className="go">Start {l.name} →</span>
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------ HOW IT WORKS ------------------------------ */}
        <section className="wrap block" id="how-it-works">
          <div className="eyebrow reveal" style={{ textAlign: "center" }}>How it works</div>
          <BounceHeading line1="Four steps to" line2="your certificate." gradient={grad} style={{ textAlign: "center" }} />
          <div className="steps" data-trigger="steps">
            <div className="sline"><i className={stepsOn ? "full" : ""} /></div>
            {STEPS.map((s, k) => (
              <div key={s.title} className={`step${k < litSteps ? " lit" : ""}`}>
                <div className="num">{k + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------ CALL TO ACTION ------------------------------ */}
        <section className="wrap">
          <div className="ctab reveal">
            <span className="ring" style={{ width: 300, height: 300, left: -60, top: -80 }} />
            <span className="ring" style={{ width: 300, height: 300, right: -60, bottom: -120, animationDelay: "-3s" }} />
            <BounceHeading line1="Your first lesson takes" line2="five minutes." />
            <p>Free to start. Pick a language and press play.</p>
            <button type="button" className="btn" onClick={() => onOpenAuth("register")}>Create free account <span className="arr">→</span></button>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <span>CodeMentor-X Your Intelligent learning platform.</span>
            <span>Learn. Code. Grow.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
