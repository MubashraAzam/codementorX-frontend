import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { apiRequest } from "../utils/api";
import { LANGS, LEVELS, topicsOf } from "./level/levelData";
import { loadExercises, loadFullLesson, loadOverview, loadQuiz } from "./level/levelAI";
import { plainText } from "./level/markup";
import { useTutor } from "./level/useTutor";
import { Icon, Star } from "./level/ui";
import LessonTab from "./level/LessonTab";
import CodeTab from "./level/CodeTab";
import ExercisesTab from "./level/ExercisesTab";
import QuizTab from "./level/QuizTab";
import TutorPanel from "./level/TutorPanel";
import "./level/levelPage.css";

/* ------------------------------------------------------------------ */
/* helpers (outside the component so ESLint's purity rules stay happy) */
/* ------------------------------------------------------------------ */

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
function readTheme() {
  try {
    return localStorage.getItem("cmx-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

const TABS = [
  { id: "lesson", icon: "book", label: "Lesson", sub: "Theory · examples" },
  { id: "code", icon: "code", label: "Code", sub: "Write & run" },
  { id: "practice", icon: "pen", label: "Exercises", sub: "3 tasks with tests" },
  { id: "quiz", icon: "check", label: "MCQs", sub: "10 questions · earn ★" },
];

// Loads one kind of AI content for this level (with cache), and lets you reload it.
function useAIData(loader, ctx, enabled) {
  const [state, setState] = useState({ key: "", value: null, error: "" });
  const [nonce, setNonce] = useState(0);
  const key = `${ctx.language}|${ctx.levelIndex}|${ctx.uiLang}|${nonce}`;
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    loader(ctx, { fresh: nonce > 0 })
      .then((v) => {
        if (alive) setState({ key, value: v || null, error: v ? "" : "The AI did not answer this time. Please try again." });
      })
      .catch((err) => {
        if (alive) setState({ key, value: null, error: err?.message || "Network error." });
      });
    return () => {
      alive = false;
    };
  }, [loader, ctx, enabled, nonce, key]);
  const ready = state.key === key;
  return { value: ready ? state.value : null, error: ready ? state.error : "", reload: () => setNonce((n) => n + 1) };
}

function BounceTitle({ text }) {
  const [hop, setHop] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHop((h) => h + 1), 6000);
    return () => clearInterval(id);
  }, []);
  return (
    <h1 key={hop} className={hop ? "hop" : ""} aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} className="ch" style={{ "--i": i }} aria-hidden="true">{c === " " ? " " : c}</span>
      ))}
    </h1>
  );
}

/* ------------------------------------------------------------------ */

export default function LevelPage(props) {
  // a new key per level resets everything when the student moves to another level
  return <LevelInner key={`${props.language}-${props.levelIndex}`} {...props} />;
}

function LevelInner({
  username = "Student",
  language = "python",
  levelIndex = 0,
  progress = { doneLevels: [], stars: {}, currentLevel: 0 },
  onBack,
  onComplete,
  onNavigate,
}) {
  const lang = LEVELS[language] ? language : "python";
  const idx = Math.min(Math.max(Number(levelIndex) || 0, 0), LEVELS[lang].length - 1);
  const level = LEVELS[lang][idx];
  const L = LANGS[lang];
  const lsBase = `cmx_lvl:${lang}:${idx}`;

  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const readRef = useRef(null);

  const [theme, setTheme] = useState(readTheme);
  const [uiLang, setUiLangState] = useState(() => readLS("cmx-ui-lang", "en"));
  const [tab, setTab] = useState("lesson");
  const [visited, setVisited] = useState({ lesson: true });
  const [doneTabs, setDoneTabs] = useState(() => readLS(`${lsBase}:done`, []));
  const [solved, setSolved] = useState(() => readLS(`${lsBase}:solved`, []));
  const [earnedStars, setEarnedStars] = useState(Number(progress?.stars?.[idx]) || 0);
  const [starPop, setStarPop] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const ctx = useMemo(() => ({ language: lang, levelIndex: idx, uiLang, level }), [lang, idx, uiLang, level]);

  const overview = useAIData(loadOverview, ctx, true);
  const lesson = useAIData(loadFullLesson, ctx, true);
  const exercises = useAIData(loadExercises, ctx, !!visited.practice);
  const quiz = useAIData(loadQuiz, ctx, !!visited.quiz);

  const tutor = useTutor(ctx, username);

  /* ----- theme (shared with the other pages) ----- */
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

  function setUiLang(l) {
    setUiLangState(l);
    writeLS("cmx-ui-lang", l);
  }

  /* ----- cards rise in when they scroll into view (works for every tab) ----- */
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
    const scan = () => root.querySelectorAll(".rise:not(.in)").forEach((c) => io.observe(c));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  /* ----- reading progress line + mouse glow on cards ----- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight;
      if (readRef.current) readRef.current.style.width = `${max > 0 ? (root.scrollTop / max) * 100 : 0}%`;
    };
    const onMove = (e) => {
      const c = e.target.closest?.(".card");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${e.clientX - r.left}px`);
      c.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("mousemove", onMove);
    return () => {
      root.removeEventListener("scroll", onScroll);
      root.removeEventListener("mousemove", onMove);
    };
  }, []);

  /* ----- actions ----- */
  function openTab(id) {
    setTab(id);
    setVisited((v) => (v[id] ? v : { ...v, [id]: true }));
    rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
  function markDone(id) {
    setDoneTabs((d) => {
      if (d.includes(id)) return d;
      const next = [...d, id];
      writeLS(`${lsBase}:done`, next);
      return next;
    });
  }
  function goNext(from, to) {
    markDone(from);
    openTab(to);
  }
  function onSolved(i) {
    setSolved((s) => {
      if (s.includes(i)) return s;
      const next = [...s, i];
      writeLS(`${lsBase}:solved`, next);
      setSessionXP((x) => x + 20);
      return next;
    });
  }
  async function onQuizFinish({ stars }) {
    if (stars <= 0) return;
    markDone("quiz");
    if (stars > earnedStars) {
      setEarnedStars(stars);
      setStarPop(true);
    }
    try {
      await apiRequest(`/api/progress/${lang}/level`, { method: "PUT", body: { levelIndex: idx, stars } });
    } catch {
      /* the page still works offline; progress is saved next time */
    }
    onComplete?.(idx, stars);
  }
  function goLevel(i) {
    if (i < 0 || i >= LEVELS[lang].length) return;
    onNavigate?.(i);
  }

  const baseXP = (progress?.doneLevels?.length || 0) * 50 + Object.values(progress?.stars || {}).reduce((a, b) => a + (Number(b) || 0), 0) * 10;
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const speakText = tab === "lesson" ? (lesson.value ? plainText(lesson.value) : plainText(overview.value?.bigIdea || "")) : "";
  const isDone = progress?.doneLevels?.includes(idx);

  return (
    <div className={`cmxl${tab === "lesson" ? " on-lesson" : ""}`} data-theme={theme} ref={rootRef}>
      <div className="bgfx" aria-hidden="true"><div className="blob b1" /><div className="blob b2" /><div className="gridbg" /></div>
      <canvas id="confetti" ref={canvasRef} />

      <div className="wrap">
        {/* ---------------- HEADER ---------------- */}
        <header className="head">
          <button type="button" className="back" onClick={() => onBack?.()}><Icon name="back" />Dashboard</button>
          <div className="ttl">
            <div className="kk">
              {L.name} · <b>Level {idx + 1}</b> of {LEVELS[lang].length} · {level.cat}
              {isDone && <span style={{ color: "var(--ok)" }}>✓</span>}
              <span className="lvnav">
                <button type="button" onClick={() => goLevel(idx - 1)} disabled={idx === 0} aria-label="Previous level"><Icon name="left" /></button>
                <button type="button" onClick={() => goLevel(idx + 1)} disabled={idx === LEVELS[lang].length - 1} aria-label="Next level"><Icon name="right" /></button>
              </span>
            </div>
            <BounceTitle text={level.title} />
          </div>
          <div className="topics">{topicsOf(level).slice(0, 4).map((t) => <span key={t}>{t}</span>)}</div>
          <div className="hr">
            <div className="stars" aria-label={`${earnedStars} of 3 stars`}>
              {[0, 1, 2].map((s) => <Star key={s} on={s < earnedStars} pop={starPop && s < earnedStars ? "pop" : ""} />)}
            </div>
            <span className="pill">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" fill="#F5B83D" /></svg>
              {baseXP + sessionXP} XP
            </span>
            <button type="button" className="toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              <i><svg viewBox="0 0 24 24" aria-hidden="true">{theme === "dark" ? <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /> : <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}</svg></i>
            </button>
          </div>
          <div className="readbar"><i ref={readRef} /></div>
        </header>

        {/* ---------------- 4 STEPS ---------------- */}
        <nav className="stepper" aria-label="Level steps">
          <span className="sind" style={{ transform: `translateX(calc(${tabIndex * 100}% + ${tabIndex * 10}px))` }} />
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`step${tab === t.id ? " on" : ""}${doneTabs.includes(t.id) ? " done" : ""}`} onClick={() => openTab(t.id)} aria-current={tab === t.id ? "step" : undefined}>
              <span className="n"><Icon name={t.icon} /></span>
              <span><b>{t.label}</b><small>{t.sub}</small></span>
              <span className="tick">✓</span>
            </button>
          ))}
        </nav>

        <div className="layout">
          <main>
            <section className="view on" key={tab}>
              {tab === "lesson" && (
                <LessonTab
                  ctx={ctx}
                  langName={L.name}
                  langFence={L.fence}
                  overview={overview.value}
                  lesson={lesson.value}
                  lessonError={lesson.error}
                  rootRef={rootRef}
                  uiLang={uiLang}
                  setUiLang={setUiLang}
                  onRegenOverview={overview.reload}
                  onRegenLesson={lesson.reload}
                  onAsk={tutor.ask}
                  onNext={() => goNext("lesson", "code")}
                />
              )}
              {tab === "code" && (
                <CodeTab ctx={ctx} langFence={L.fence} langName={L.name} example={overview.value?.example} onNext={() => goNext("code", "practice")} />
              )}
              {tab === "practice" && (
                <ExercisesTab
                  ctx={ctx}
                  langFence={L.fence}
                  langName={L.name}
                  exercises={exercises.value}
                  error={exercises.error}
                  onReload={exercises.reload}
                  solved={solved}
                  onSolved={onSolved}
                  rootRef={rootRef}
                  onNext={() => goNext("practice", "quiz")}
                />
              )}
              {tab === "quiz" && (
                <QuizTab
                  ctx={ctx}
                  langFence={L.fence}
                  quiz={quiz.value}
                  error={quiz.error}
                  onReload={quiz.reload}
                  rootRef={rootRef}
                  canvasRef={canvasRef}
                  username={username}
                  hintsUsed={hintsUsed}
                  onHint={() => setHintsUsed((h) => h + 1)}
                  onXP={(n) => setSessionXP((x) => x + n)}
                  onFinish={onQuizFinish}
                  onReview={() => openTab("lesson")}
                  onNextLevel={() => goLevel(idx + 1)}
                  isLastLevel={idx === LEVELS[lang].length - 1}
                  ur={uiLang === "ur"}
                />
              )}
            </section>
          </main>

          <aside className="aside">
            <TutorPanel tutor={tutor} uiLang={uiLang} setUiLang={setUiLang} speakText={speakText} langFence={L.fence} levelTitle={level.title} />
          </aside>
        </div>
      </div>
    </div>
  );
}
