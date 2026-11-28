import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { apiRequest } from "../../utils/api";
import { mentor } from "../../utils/mentor";
import { LEVELS, PROJECTS, TIPS, TRACKS } from "./dashData";
import { addStudyMinute, dayKey, readStudy } from "./studyTime";
import "./pinkDashboard.css";

/* ------------------------------------------------------------------ */
/* Small helpers (kept outside the component so ESLint stays happy)    */
/* ------------------------------------------------------------------ */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function lastSevenDays() {
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({ key: dayKey(d), label: DAY_NAMES[d.getDay()] });
  }
  return out;
}

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function readTheme() {
  try {
    return localStorage.getItem("cmx-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

async function fetchEnrollments() {
  try {
    const me = await apiRequest("/api/auth/me");
    const list = me?.enrollments || me?.user?.enrollments || [];
    const ids = Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.language)).filter(Boolean) : [];
    if (ids.length) return ids;
    return me?.language ? [me.language] : [];
  } catch {
    return [];
  }
}

function goTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function smoothPath(p) {
  if (!p.length) return "";
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length; i += 1) {
    const a = p[i - 1];
    const b = p[i];
    const mx = (a.x + b.x) / 2;
    d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* Tiny building blocks                                                 */
/* ------------------------------------------------------------------ */

const ICONS = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  map: <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  bulb: <><path d="M12 3a6 6 0 0 0-6 6c0 2.2 1.2 3.7 2.5 4.8V17h7v-3.2C16.8 12.7 18 11.2 18 9a6 6 0 0 0-6-6z" /><path d="M9.5 21h5" /></>,
  case: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></>,
  medal: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  chart: <path d="M4 20h16M6 16V9M12 16V4M18 16v-5" />,
  star: <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v7M14 20h3" /></>,
  sun: <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
};

function Icon({ name, size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function Star({ on }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" style={{ fill: on ? "var(--gold)" : "var(--line)" }} />
    </svg>
  );
}

function Stars({ n }) {
  return [0, 1, 2].map((s) => <Star key={s} on={s < n} />);
}

// Counts a number up from 0 with an ease-out curve.
function useCountUp(target, ms = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function Count({ to, suffix = "", ms }) {
  const v = useCountUp(to, ms);
  return <>{v}{suffix}</>;
}

// Greeting with the bouncing letters used on the landing page.
function BounceTitle({ text, highlightFrom }) {
  const [hop, setHop] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHop((h) => h + 1), 6000);
    return () => clearInterval(id);
  }, []);
  const words = text.split(" ");
  const starts = words.map((_, wi) => words.slice(0, wi).reduce((n, w) => n + w.length, 0));
  return (
    <h1 key={hop} className={`dz-h1${hop ? " hop" : ""}`} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true">
          {wi > 0 && <span className="dz-sp" />}
          <span className="dz-w">
            {[...w].map((c, ci) => {
              const i = starts[wi] + ci;
              return (
                <span key={ci} className={`dz-ch${i >= highlightFrom ? " hl" : ""}`} style={{ "--i": i }}>
                  {c}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </h1>
  );
}

function Teacher() {
  return (
    <svg viewBox="0 0 140 240" aria-hidden="true">
      <ellipse cx="70" cy="232" rx="34" ry="6" fill="#000" opacity="0.12" />
      <rect x="46" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
      <rect x="72" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
      <rect x="48" y="168" width="16" height="44" rx="5" fill="#25367C" />
      <rect x="76" y="168" width="16" height="44" rx="5" fill="#25367C" />
      <path d="M34 106 Q33 88 70 84 Q107 88 106 106 L110 172 Q70 182 30 172 Z" fill="#25367C" />
      <path d="M58 90 L70 108 L82 90" fill="#fff" />
      <path d="M67 92 L70 100 L73 92 L71.5 97 L70 118 L68.5 97 Z" fill="#F49B00" />
      <rect x="20" y="104" width="15" height="54" rx="7" fill="#25367C" />
      <circle cx="27" cy="160" r="10" fill="#f4c9a0" />
      <path d="M104 100 Q122 96 128 76 Q130 68 124 65 Q118 63 115 72 Q110 86 100 98Z" fill="#25367C" />
      <circle cx="126" cy="66" r="10" fill="#f4c9a0" />
      <rect x="128" y="48" width="28" height="36" rx="3" fill="#e0473a" transform="rotate(-15 128 48)" />
      <rect x="63" y="74" width="14" height="14" fill="#f4c9a0" />
      <circle cx="70" cy="52" r="30" fill="#f4c9a0" />
      <path d="M41 46 Q40 18 70 16 Q100 18 99 46 L99 34 Q99 22 70 20 Q41 22 41 34Z" fill="#4a3526" />
      <ellipse cx="57" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
      <ellipse cx="83" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
      <circle cx="57" cy="55" r="2.8" fill="#2b2b2b" />
      <circle cx="83" cy="55" r="2.8" fill="#2b2b2b" />
      <path d="M58 68 Q70 76 82 68" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ProgressRing({ pct }) {
  const gid = useId().replace(/:/g, "");
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 200);
    return () => clearTimeout(t);
  }, []);
  const shown = on ? Math.max(pct, 2) : 0;
  return (
    <div className="dz-ringbox">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id={`rg${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent2)" }} />
          </linearGradient>
        </defs>
        <circle className="t" cx="60" cy="60" r="50" />
        <circle className="v" cx="60" cy="60" r="50" stroke={`url(#rg${gid})`} strokeDasharray="314" strokeDashoffset={314 - (314 * shown) / 100} />
      </svg>
      <div className="lbl">
        <div>
          <b><Count to={pct} suffix="%" ms={1400} /></b>
          <small>complete</small>
        </div>
      </div>
    </div>
  );
}

// The winding road of 20 levels, ending at the AI viva and the certificate.
function LevelPath({ names, doneSet, stars, current, initial, avatarUrl, onOpen }) {
  const gid = useId().replace(/:/g, "");
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    const t = setTimeout(() => setShow(true), 250);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const W = Math.max(width, 760);
  const gap = (W - 150) / 21.2;
  const pts = names.map((_, i) => ({ x: 28 + i * gap, y: 96 + Math.sin(i * 0.75) * 40 }));
  const end = [{ x: W - 95, y: 96 }, { x: W - 30, y: 96 }];
  const full = smoothPath([...pts, ...end]);
  const reached = Math.min(current, pts.length - 1);
  const donePath = smoothPath(pts.slice(0, reached + 1));
  const me = pts[reached];

  return (
    <div className="dz-pathwrap" ref={wrapRef}>
      {width > 0 && (
        <div className="dz-pathin" style={{ width: W }}>
          <svg className="dz-road" viewBox={`0 0 ${W} 178`} aria-hidden="true">
            <defs>
              <linearGradient id={`pg${gid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" style={{ stopColor: "var(--accent)" }} />
                <stop offset="1" style={{ stopColor: "var(--accent2)" }} />
              </linearGradient>
            </defs>
            <path className="base" d={full} />
            {reached > 0 && (
              <path className="done" d={donePath} pathLength="1" stroke={`url(#pg${gid})`} strokeDasharray="1" strokeDashoffset={show ? 0 : 1} />
            )}
          </svg>
          {pts.map((p, i) => {
            const isDone = doneSet.has(i);
            const isCur = i === current && !isDone;
            const open = isDone || isCur;
            const tip = isDone ? `${names[i]} · ${stars[i] || 0}★` : isCur ? `${names[i]} · up next` : `${names[i]} · locked`;
            return (
              <button
                key={i}
                type="button"
                className={`dz-nd${show ? " show" : ""}${isDone ? " done" : ""}${isCur ? " cur" : ""}`}
                style={{ left: p.x, top: p.y, transitionDelay: show ? `${i * 45}ms` : "0ms" }}
                onClick={() => open && onOpen?.(i)}
                aria-label={`Level ${i + 1}: ${tip}`}
                disabled={!open}
              >
                {String(i + 1).padStart(2, "0")}
                {isDone && <span className="st"><Stars n={stars[i] || 0} /></span>}
                <span className="dz-tip">{tip}</span>
              </button>
            );
          })}
          <div className={`dz-flag${show ? " show" : ""}`} style={{ left: end[0].x, top: end[0].y + 24 }}>
            <i><Icon name="mic" /></i>
            <span>AI viva</span>
          </div>
          <div className={`dz-flag${show ? " show" : ""}`} style={{ left: end[1].x, top: end[1].y + 24 }}>
            <i><Icon name="medal" /></i>
            <span>Certificate</span>
          </div>
          <div className="dz-me" style={{ left: me.x, top: me.y }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekBars({ username }) {
  const [days] = useState(lastSevenDays);
  const [study, setStudy] = useState(() => readStudy(username));
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 350);
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      addStudyMinute(username);
      setStudy(readStudy(username));
    }, 60000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [username]);

  const mins = days.map((d) => study[d.key] || 0);
  const max = Math.max(...mins, 30);
  const total = mins.reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="dz-row">
        <h3>This week</h3>
        <span className="dz-total">Total <b><Count to={total} suffix=" min" /></b></span>
      </div>
      <div className="dz-bars">
        {days.map((d, i) => (
          <div key={d.key} className={`dz-bar${i === 6 ? " today" : ""}`}>
            <i style={{ height: show ? Math.max(6, (mins[i] / max) * 120) : 0, transitionDelay: `${i * 70}ms` }}>
              <em>{mins[i]}m</em>
            </i>
            <span>{i === 6 ? "Today" : d.label}</span>
          </div>
        ))}
      </div>
      {total === 0 && <p className="dz-nodata">Your study minutes will show up here as you learn.</p>}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The dashboard                                                        */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: "home", icon: "home", label: "Home" },
  { id: "roadmap", icon: "map", label: "My path" },
  { id: "airoadmap", icon: "compass", label: "AI Roadmap" },
  { id: "lab", icon: "code", label: "Code Lab" },
  { id: "mentor", icon: "bulb", label: "AI Mentor" },
  { id: "projects", icon: "case", label: "Projects" },
  { id: "viva", icon: "mic", label: "AI Viva" },
  { id: "cert", icon: "medal", label: "Certificate" },
];

export default function PinkDashboard({
  username = "Student",
  email = "",
  levels = [],
  projectList = [],
  rules = null,
  enrollments = [],
  emailVerified = true,
  onOpenRoadmaps,
  onOpenViva,
  onOpenCertificate,
  language = "python",
  profile = {},
  progress = { doneLevels: [], stars: {}, currentLevel: 0 },
  streak = 0,
  onLevelOpen,
  onOpenProjects,
  onOpenProfile,
  onOpenAbout,
  onLogout,
  onSwitchTrack,
  onAddTrack,
  onUpdateProfile,
}) {
  // Levels and projects come from the backend curriculum (Module 2.1) for all 5 tracks.
  const lang = TRACKS[language] ? language : "python";
  const names = levels.length ? levels.map((l) => l.title) : LEVELS[lang] || LEVELS.python;
  const projects = projectList.length ? projectList.map((p) => p.title) : PROJECTS[lang] || PROJECTS.python;
  const projectIds = projectList.length ? projectList.map((p, i) => p.id ?? i) : projects.map((_, i) => i);
  const trackInfo = TRACKS[lang];
  // Same rules as the server (data/curriculum.js RULES)
  const R = {
    totalLevels: rules?.levelsRequired || names.length || 20,
    projectsNeeded: rules?.projectsRequired ?? 5,
    projectPassStars: rules?.projectPassStars ?? 2,
    vivaPassMark: rules?.interviewPassPercent ?? 75,
  };
  const enrollKey = (enrollments || []).map((e) => (typeof e === "string" ? e : e?.language)).filter(Boolean).join(",");

  const rootRef = useRef(null);
  const navRef = useRef(null);
  const indRef = useRef(null);
  const mentorRef = useRef(null);
  const pathRef = useRef(null);
  const askRef = useRef(null);

  const [theme, setTheme] = useState(readTheme);
  const [activeNav, setActiveNav] = useState("home");
  const [greeting] = useState(greetingWord);
  const [extraState, setExtraState] = useState({ lang: null, data: null });
  const [tracks, setTracks] = useState({ list: [], done: {} });
  const [switching, setSwitching] = useState(null);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState({ lang: null, q: "", a: "", loading: false });
  const [verify, setVerify] = useState({ busy: false, msg: "" });

  /* ----- theme (shared with the landing page through localStorage) ----- */
  useEffect(() => {
    document.documentElement.dataset.cmxTheme = theme;
    try {
      localStorage.setItem("cmx-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  function toggleTheme(e) {
    const next = theme === "dark" ? "light" : "dark";
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      setTheme(next);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = document.startViewTransition(() => flushSync(() => setTheme(next)));
    vt.ready
      .then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
          { duration: 900, easing: "cubic-bezier(.6,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
        ),
      )
      .catch(() => {});
  }

  /* ----- extra progress data: projects, viva, certificate ----- */
  useEffect(() => {
    let alive = true;
    apiRequest(`/api/progress/${lang}`)
      .then((data) => alive && setExtraState({ lang, data }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [lang]);

  /* ----- the student's other tracks (for the sidebar) ----- */
  useEffect(() => {
    let alive = true;
    (enrollKey ? Promise.resolve(enrollKey.split(",")) : fetchEnrollments())
      .then((list) =>
        Promise.all(
          list.map((l) =>
            apiRequest(`/api/progress/${l}`)
              .then((d) => [l, (d?.doneLevels || []).length])
              .catch(() => [l, 0]),
          ),
        ).then((entries) => ({ list, done: Object.fromEntries(entries) })),
      )
      .then((info) => alive && setTracks(info));
    return () => {
      alive = false;
    };
  }, [lang, enrollKey]);

  /* ----- cards rise in when they scroll into view ----- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { root, threshold: 0.12 },
    );
    root.querySelectorAll(".dz-card:not(.in)").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  /* ----- sliding pill behind the active menu item ----- */
  useLayoutEffect(() => {
    const btn = navRef.current?.querySelector(`[data-nav="${activeNav}"]`);
    if (btn && indRef.current) indRef.current.style.transform = `translateY(${btn.offsetTop}px)`;
  }, [activeNav]);

  /* ----- numbers ----- */
  const doneLevels = progress?.doneLevels || [];
  const starsMap = progress?.stars || {};
  const doneSet = new Set(doneLevels);
  const doneCount = doneSet.size;
  const total = R.totalLevels;
  const current = Math.min(progress?.currentLevel || 0, total - 1);
  const allLevelsDone = doneCount >= total;
  const starTotal = Object.values(starsMap).reduce((a, b) => a + (Number(b) || 0), 0);
  const pct = Math.round((doneCount / total) * 100);

  const extra = extraState.lang === lang ? extraState.data : null;
  const solvedProjects = extra?.solvedProjects || {};
  const projectRec = (i) => solvedProjects[projectIds[i]] || solvedProjects[String(projectIds[i])] || null;
  const projectStars = (i) => Number(projectRec(i)?.stars ?? 0);
  // Flagged (possibly copied) projects do not count, same as the server rule.
  const solvedCount = projects.filter((_, i) => projectStars(i) >= R.projectPassStars && !projectRec(i)?.flagged).length;
  const projectStarTotal = projects.reduce((n, _, i) => n + projectStars(i), 0);
  const interview = extra?.interview || {};
  const vivaScore = typeof interview.percentage === "number" ? interview.percentage : null;
  const vivaPassed = Boolean(interview.passed) || (vivaScore !== null && vivaScore >= R.vivaPassMark);
  const certificate = extra?.certificate || null;
  const vivaOpen = solvedCount >= R.projectsNeeded;
  const xp = doneCount * 50 + starTotal * 10 + projectStarTotal * 20;

  const firstName = profile?.firstName || username;
  const titleText = `${greeting}, ${firstName}`;
  const initial = (firstName || "S").charAt(0).toUpperCase();

  const trackIds = [...new Set([...tracks.list, lang])].filter((id) => TRACKS[id]);

  // Revise next = weak topics from the latest MCQ reports (Module 2.2); else levels with fewer than 3 stars.
  const reports = Object.entries(extra?.levelReports || {})
    .map(([i, r]) => ({ i: Number(i), r }))
    .filter((x) => x.r && Array.isArray(x.r.weakTopics) && x.r.weakTopics.length)
    .sort((a, b) => new Date(b.r.at || 0) - new Date(a.r.at || 0));
  const weak = reports.flatMap((x) => x.r.weakTopics.map((topic) => ({ i: x.i, topic, score: x.r.score || 0 }))).slice(0, 3);
  const revise = weak.length
    ? weak
    : doneLevels
        .filter((i) => (Number(starsMap[i]) || 0) < 3)
        .sort((a, b) => (Number(starsMap[a]) || 0) - (Number(starsMap[b]) || 0))
        .slice(0, 3)
        .map((i) => ({ i, topic: null, score: ((Number(starsMap[i]) || 0) / 3) * 100 }));

  let milestone;
  if (!allLevelsDone) milestone = `${total - doneCount} level${total - doneCount === 1 ? "" : "s"} to go for your certificate`;
  else if (!vivaOpen) milestone = `Solve ${R.projectsNeeded - solvedCount} more project${R.projectsNeeded - solvedCount === 1 ? "" : "s"} with 2★ to open the AI viva`;
  else if (!vivaPassed) milestone = `The AI viva is open. Score ${R.vivaPassMark}% to pass`;
  else milestone = certificate ? "Certificate issued. Well done!" : "You passed! Claim your certificate";

  let bubble;
  if (allLevelsDone) bubble = "All 20 levels done! Time for projects.";
  else if (doneCount === 0) bubble = "Let's write your first line of code!";
  else if (current === total - 1) bubble = "Last level. You can do it!";
  else bubble = `Finish this one and Level ${current + 2} opens!`;

  const tipList = TIPS[lang] || TIPS.general;
  const tip = tipList[doneCount % tipList.length];
  const chatHere = chat.lang === lang ? chat : null;

  /* ----- actions ----- */
  function scrollToEl(el) {
    const root = rootRef.current;
    if (!root || !el) return;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 16;
    root.scrollTo({ top, behavior: "smooth" });
  }

  function handleNav(id) {
    setActiveNav(id);
    if (id === "home") rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    else if (id === "roadmap") scrollToEl(pathRef.current);
    else if (id === "mentor") {
      scrollToEl(mentorRef.current);
      setTimeout(() => askRef.current?.focus({ preventScroll: true }), 500);
    } else if (id === "lab") onLevelOpen?.(current);
    else if (id === "airoadmap") onOpenRoadmaps?.();
    else if (id === "viva") (onOpenViva || onOpenProjects)?.();
    else if (id === "cert") (onOpenCertificate || onOpenProjects)?.();
    else onOpenProjects?.();
  }

  async function switchTrack(id) {
    if (id === lang || switching) return;
    if (onSwitchTrack) {
      // Module 1.3 — PUT /api/courses/active through App.jsx
      setSwitching(id);
      Promise.resolve(onSwitchTrack(id)).finally(() => setSwitching(null));
      return;
    }
    setSwitching(id);
    try {
      const res = await apiRequest("/api/auth/profile", { method: "PUT", body: { language: id } });
      onUpdateProfile?.(res?.user || res || { language: id });
    } catch {
      onUpdateProfile?.({ language: id });
    } finally {
      setSwitching(null);
    }
  }

  function addTrack() {
    if (onAddTrack) onAddTrack();
    else goTo("/choose-path");
  }

  async function ask(text) {
    const q = (text ?? question).trim();
    if (!q || chatHere?.loading) return;
    setQuestion("");
    setChat({ lang, q, a: "", loading: true });
    try {
      // Module 3.3 tutor (the server builds the prompt for the student's current level)
      const data = await mentor("ask", { language: lang, levelIndex: current, uiLang: "English", question: q, history: [] });
      setChat({ lang, q, a: data?.text || "Sorry, I could not answer that right now.", loading: false });
    } catch (err) {
      setChat({ lang, q, a: err?.message || "The mentor is busy right now. Please try again in a moment.", loading: false });
    }
  }

  async function resendVerification() {
    setVerify({ busy: true, msg: "" });
    try {
      const res = await apiRequest("/api/auth/resend-verification", { method: "POST" });
      setVerify({ busy: false, msg: res?.message || "Verification email sent." });
    } catch (err) {
      setVerify({ busy: false, msg: err?.message || "Could not send the email." });
    }
  }

  function onMouseMove(e) {
    const card = e.target.closest?.(".dz-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const tiles = [
    { icon: "chart", value: doneCount, of: `/ ${total}`, label: "Levels done", chip: `Level ${current + 1} now` },
    { icon: "star", value: starTotal, of: `/ ${total * 3}`, label: "Stars earned", chip: `${xp} XP` },
    { icon: "case", value: solvedCount, of: `/ ${R.projectsNeeded}`, label: "Projects with 2★+", chip: vivaOpen ? "done" : "for viva" },
    { icon: "mic", value: vivaScore ?? 0, of: "%", label: "AI viva score", chip: vivaScore === null ? "not taken" : vivaPassed ? "passed" : `need ${R.vivaPassMark}%`, empty: vivaScore === null },
  ];

  return (
    <div className="cmxd" data-theme={theme} ref={rootRef} onMouseMove={onMouseMove}>
      <div className="dz-bg" aria-hidden="true">
        <div className="dz-blob dz-b1" />
        <div className="dz-blob dz-b2" />
        <div className="dz-gridbg" />
      </div>

      <div className="dz-app">
        {/* ---------------- SIDEBAR ---------------- */}
        <aside className="dz-side">
          <div className="dz-brand"><i>&gt;_</i><b>CodeMentor<span></span></b></div>

          <nav className="dz-nav" ref={navRef} aria-label="Dashboard">
            <span className="dz-ind" ref={indRef} />
            {NAV.map((n) => (
              <button key={n.id} type="button" data-nav={n.id} className={activeNav === n.id ? "on" : ""} onClick={() => handleNav(n.id)}>
                <Icon name={n.icon} />
                {n.label}
                {n.id === "viva" && !vivaOpen && <span className="dz-lock">LOCKED</span>}
              </button>
            ))}
          </nav>

          <div className="dz-sh">My tracks</div>
          <div className="dz-tracks">
            {trackIds.map((id) => {
              const t = TRACKS[id];
              const d = id === lang ? doneCount : tracks.done[id] || 0;
              return (
                <button key={id} type="button" className={`dz-tk${id === lang ? " on" : ""}`} onClick={() => switchTrack(id)} disabled={switching === id}>
                  <span className="dz-tl" style={{ background: t.color }}>{t.tile}</span>
                  <span>
                    {t.name}
                    <small>{switching === id ? "Switching…" : `${d} / ${total} levels`}</small>
                  </span>
                  <svg className="dz-mini" viewBox="0 0 36 36" aria-hidden="true">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--track)" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent2)" strokeWidth="4" strokeLinecap="round" strokeDasharray="88" strokeDashoffset={88 - (88 * d) / total} transform="rotate(-90 18 18)" />
                  </svg>
                </button>
              );
            })}
            <button type="button" className="dz-tk add" onClick={addTrack}>+ Add a track</button>
          </div>

          <div className="dz-more">
            <button type="button" onClick={() => onOpenProfile?.()}><Icon name="gear" />Profile settings</button>
            <button type="button" onClick={() => onOpenAbout?.()}><Icon name="info" />About CodeMentorX</button>
            <button type="button" className="danger" onClick={() => onLogout?.()}><Icon name="out" />Log out</button>
          </div>

          <div className="dz-sfoot">
            <span className="dz-av">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initial}</span>
            <div>
              <b>{username}</b>
              <small>Level {current + 1} · {trackInfo.name}</small>
            </div>
            <button type="button" className="dz-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              <i>
                <svg viewBox="0 0 24 24" aria-hidden="true">{theme === "dark" ? ICONS.moon : ICONS.sun}</svg>
              </i>
            </button>
          </div>
        </aside>

        {/* ---------------- MAIN ---------------- */}
        <main className="dz-main">
          <div className="dz-top">
            <div>
              <BounceTitle text={titleText} highlightFrom={greeting.length + 1} />
              <p className="dz-hello">
                {streak > 0 ? <>You&apos;re on a <b>{streak}-day streak</b>. Keep it going, your next level is waiting.</> : "Welcome back! Your next level is waiting."}
              </p>
            </div>
            <div className="dz-pills">
              <span className="dz-pill">
                <svg className="dz-flame" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3-1-3 0-7 1-9.5z" fill="#F28A3D" />
                  <path d="M12 13c.8 1.5 2 2 2 3.5a2 2 0 0 1-4 0c0-1 .6-1.8 1-2.3.3.8.6 1 1 1-.2-1 0-1.6 0-2.2z" fill="#FFD166" />
                </svg>
                <Count to={streak} ms={900} /> day streak
              </span>
              <span className="dz-pill">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" fill="#F5B83D" /></svg>
                <Count to={xp} ms={1400} /> XP
              </span>
            </div>
          </div>

          {/* Module 1.1 — email verification */}
          {!emailVerified && (
            <div className="dz-verify" role="status">
              <span className="dz-vi"><Icon name="mail" /></span>
              <div>
                <b>Verify your email address</b>
                <small>{verify.msg || `We sent a link to ${email || "your email"}. You need a verified email to get your certificate.`}</small>
              </div>
              <button type="button" className="dz-vbtn" onClick={resendVerification} disabled={verify.busy}>{verify.busy ? "Sending…" : "Resend email"}</button>
            </div>
          )}

          <div className="dz-grid dz-g1">
            {/* continue card */}
            <section className="dz-card dz-cont" style={{ "--d": ".1s" }}>
              <span className="dz-ring" style={{ width: 260, height: 260, left: -80, top: -110 }} />
              <span className="dz-ring" style={{ width: 260, height: 260, right: 120, bottom: -140, animationDelay: "-3.5s" }} />
              <div key={lang} className="dz-swap">
                <div className="dz-kk">{trackInfo.name} · Level {current + 1} of {total}</div>
                <h2>{allLevelsDone ? "Track complete!" : names[current]}</h2>
                <p>
                  {allLevelsDone
                    ? "You finished all 20 levels. Build your projects and take the AI viva."
                    : `Pick up where you left off. ${total - doneCount} level${total - doneCount === 1 ? "" : "s"} left in this track.`}
                </p>
              </div>
              {!allLevelsDone && (
                <div className="dz-steps"><span className="next">1 · Lesson</span><span>2 · Practice</span><span>3 · Quiz</span></div>
              )}
              <div className="dz-cbtns">
                {allLevelsDone ? (
                  <button type="button" className="dz-cbtn" onClick={() => onOpenProjects?.()}>Go to projects <span>→</span></button>
                ) : (
                  <button type="button" className="dz-cbtn" onClick={() => onLevelOpen?.(current)}>Continue level <span>→</span></button>
                )}
                <button type="button" className="dz-cbtn gh" onClick={() => handleNav("mentor")}>Ask mentor</button>
              </div>
              <div key={`b-${lang}`} className="dz-tbub">{bubble}</div>
              <div className="dz-teach"><Teacher /></div>
            </section>

            {/* progress ring */}
            <section className="dz-card" style={{ "--d": ".2s" }}>
              <div className="dz-row"><h3>Track progress</h3><span className="dz-kk">{trackInfo.name}</span></div>
              <div className="dz-big">
                <ProgressRing key={lang} pct={pct} />
                <div className="dz-kv">
                  <div><span>Levels</span>{doneCount} / {total}</div>
                  <div><span>Stars</span>{starTotal} / {total * 3}</div>
                  <div><span>Projects (2★+)</span>{solvedCount} / {R.projectsNeeded}</div>
                  <div><span>AI viva</span>{vivaPassed ? `${vivaScore ?? ""}% ✓` : vivaOpen ? "Open" : "Locked"}</div>
                </div>
              </div>
              <div className="dz-unlock"><Icon name={vivaPassed ? "medal" : "lock"} />{milestone}</div>
            </section>
          </div>

          {/* stat tiles */}
          <div className="dz-grid dz-g2">
            {tiles.map((t, k) => (
              <section key={t.label} className="dz-card dz-tile" style={{ "--d": `${0.25 + k * 0.08}s` }}>
                <span className="dz-delta">{t.chip}</span>
                <span className="dz-ti"><Icon name={t.icon} /></span>
                <b>{t.empty ? "—" : <Count key={`${lang}-${t.value}`} to={t.value} />}{!t.empty && <small>{t.of}</small>}</b>
                <span className="lab">{t.label}</span>
              </section>
            ))}
          </div>

          {/* path */}
          <section className="dz-card" style={{ "--d": ".2s", marginTop: 18 }} ref={pathRef}>
            <div className="dz-row"><h3>Your path</h3><span className="dz-kk">{trackInfo.name} · 20 levels → AI viva → certificate</span></div>
            <LevelPath
              key={lang}
              names={names}
              doneSet={doneSet}
              stars={starsMap}
              current={current}
              initial={initial}
              avatarUrl={profile?.avatarUrl}
              onOpen={(i) => onLevelOpen?.(i)}
            />
          </section>

          <div className="dz-grid dz-g3">
            <section className="dz-card" style={{ "--d": ".1s" }}>
              <WeekBars username={username} />
            </section>

            <section className="dz-card" style={{ "--d": ".2s" }}>
              <div className="dz-row"><h3>Revise next</h3><button type="button" className="dz-link" onClick={() => onOpenRoadmaps?.()}>AI roadmap →</button></div>
              <div className="dz-rev" key={lang}>
                {revise.length === 0 ? (
                  <div className="dz-empty">
                    {doneCount === 0 ? "Take your first level's MCQs and your weak topics will show up here." : "No weak topics right now. Amazing work!"}
                  </div>
                ) : (
                  revise.map((x, k) => (
                    <button key={`${x.i}-${x.topic || k}`} type="button" className="dz-rv" style={{ "--d": `${0.3 + k * 0.12}s` }} onClick={() => onLevelOpen?.(x.i)}>
                      <div className="dz-row">
                        <b>{x.topic ? x.topic : `L${x.i + 1} · ${names[x.i]}`}</b>
                        <span>{x.topic ? `L${x.i + 1} · ${x.score}%` : `${Number(starsMap[x.i]) || 0}★ → 3★`}</span>
                      </div>
                      <div className="dz-mb"><i style={{ width: `${Math.max(8, x.score)}%` }} /></div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="dz-card" style={{ "--d": ".3s" }} ref={mentorRef}>
              <div className="dz-row">
                <h3><span className="dz-av mono" style={{ width: 30, height: 30, fontSize: 12 }}>&gt;_</span>AI mentor</h3>
                <span className="dz-kk">{trackInfo.name}</span>
              </div>
              <div className="dz-mbub" aria-live="polite">
                {chatHere ? (
                  <>
                    <small>YOU ASKED: {chatHere.q.toUpperCase()}</small>
                    {chatHere.loading ? <span className="dz-dots"><i /><i /><i /></span> : chatHere.a}
                  </>
                ) : (
                  <>
                    <small>QUICK TIP</small>
                    {tip}
                  </>
                )}
              </div>
              <form className="dz-ask" onSubmit={(e) => { e.preventDefault(); ask(); }}>
                <input ref={askRef} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={`Ask anything about ${trackInfo.name}...`} />
                <button type="submit" aria-label="Send" disabled={chatHere?.loading}><Icon name="send" /></button>
              </form>
              <div className="dz-qs">
                <button type="button" onClick={() => ask(`Explain ${names[current]} in simple words`)}>Explain {names[current]}</button>
                <button type="button" onClick={() => ask(`Give me one hint for practising ${names[current]}`)}>Give me a hint</button>
                <button type="button" onClick={() => ask(`Ask me one short quiz question about ${names[current]}`)}>Quiz me</button>
              </div>
            </section>
          </div>

          <div className="dz-grid dz-g4">
            <section className="dz-card" style={{ "--d": ".1s" }}>
              <div className="dz-row"><h3>Projects</h3><span className="dz-kk">Solve {R.projectsNeeded} with 2★ or more</span></div>
              <div className="dz-projs">
                {projects.map((p, i) => {
                  const s = projectStars(i);
                  return (
                    <button key={p} type="button" className={`dz-pj${s >= R.projectPassStars ? " solved" : ""}`} onClick={() => onOpenProjects?.()}>
                      <span className="mono">P{String(i + 1).padStart(2, "0")}</span>
                      <b>{p}</b>
                      <span className="ps"><Stars n={s} /></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="dz-card" style={{ "--d": ".2s" }}>
              <div className="dz-row"><h3>AI viva &amp; certificate</h3><span className="dz-kk">Pass mark {R.vivaPassMark}%</span></div>
              <div className="dz-req">
                <div className={`dz-rq${allLevelsDone ? " ok" : ""}`}>
                  <div className="dz-row">20 levels completed<span>{doneCount} / {total}</span></div>
                  <div className="dz-mb"><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
                </div>
                <div className={`dz-rq${vivaOpen ? " ok" : ""}`}>
                  <div className="dz-row">{R.projectsNeeded} projects with 2★+<span>{solvedCount} / {R.projectsNeeded}</span></div>
                  <div className="dz-mb"><i style={{ width: `${Math.max(2, (solvedCount / R.projectsNeeded) * 100)}%` }} /></div>
                </div>
                <div className={`dz-rq${vivaPassed ? " ok" : ""}`}>
                  <div className="dz-row">AI viva score<span>{vivaScore === null ? "not taken" : `${vivaScore}%`}</span></div>
                  <div className="dz-mb"><i style={{ width: `${Math.max(2, Math.min(100, ((vivaScore || 0) / R.vivaPassMark) * 100))}%` }} /></div>
                </div>
              </div>
              <button type="button" className="dz-cert" onClick={() => onOpenProjects?.()}>
                <div className="dz-qr"><Icon name="qr" /></div>
                <b>{certificate ? "Your certificate is ready" : vivaPassed ? "Claim your QR certificate" : "Your QR certificate"}</b>
                <small>{certificate ? "Open it, download it or share the QR link" : vivaPassed ? "You passed the AI viva. Tap to claim it" : "Unlocks after you pass the AI viva"}</small>
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
