import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, BookOpen, PenTool, ClipboardList, Lightbulb, 
  ChevronRight, RefreshCw, Sparkles, CheckCircle, 
  Lock, Star, Users
} from "lucide-react";
import { apiRequest } from "../utils/api";
import { formatAIMarkdown } from "../utils/aiMarkdown";
import { trackMeta } from "../utils/tracks";
import { mentor } from "../utils/mentor";
import HintLadder from "./HintLadder";
import TutorChat from "./TutorChat";
import PairProgramming from "./PairProgramming";

const QUESTION_TYPE = {
  concept: { label: "Concept", cls: "bg-[#EEF3FF] text-[#4F6BD8]" },
  output:  { label: "Predict the output", cls: "bg-[#E7F6EE] text-[#2E9D62]" },
  debug:   { label: "Find the bug", cls: "bg-[#FDEDEE] text-[#C62828]" },
};

const CONFETTI_COLORS = ["#F49B00", "#25367C", "#2e9d62", "#c62828", "#8e44ad", "#f5c842"];

function ConfettiBurst() {
  const pieces = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 6,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "120vh", x: (Math.random() - 0.5) * 200, opacity: [1, 1, 0], rotate: 360 * (Math.random() * 2) }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{ position: "absolute", left: `${p.left}%`, width: p.size, height: p.size, backgroundColor: p.bg, borderRadius: Math.random() > 0.5 ? "50%" : "2px" }}
        />
      ))}
    </div>
  );
}

function FloatingXP({ xp, x, y, onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 1, y, x, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 0, y: y - 100, scale: 1.5, rotate: 10 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className="fixed z-50 font-black text-4xl text-[#8B6FE8] drop-shadow-lg pointer-events-none"
      style={{ left: 0, top: 0 }}
    >
      +{xp} XP
    </motion.div>
  );
}

// Levels now come from the backend curriculum (Module 2.1) via the `levels` prop.

export default function LevelPage({
  username = "Student",
  language = "python",
  levelIndex = 3,
  progress = { doneLevels: [0, 1, 2], stars: { 0: 3, 1: 2, 2: 3 }, currentLevel: 3 },
  levels = [],
  onBack,
  onComplete,
  onNavigate,
}) {
  const meta = trackMeta(language);
  const langLabel = `${meta.icon} ${meta.label}`;

  const [currentIdx, setCurrentIdx]   = useState(levelIndex);
  const [activeTab, setActiveTab]     = useState("lesson");
  const [uiLang, setUiLang]           = useState("English");
  const [aiError, setAiError]         = useState("");

  // Lesson state
  const [lessonContent, setLessonContent]   = useState(null);
  const [lessonLoading, setLessonLoading]   = useState(false);
  const [extraExample, setExtraExample]     = useState(null);
  const [extraLoading, setExtraLoading]     = useState(false);

  // Practice state (Module 3.1: structured exercises from the server)
  const [practice, setPractice]             = useState(null); // { practiceId, exercises }
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceSolutions, setPracticeSolutions] = useState({});
  const [solLoading, setSolLoading]         = useState({});
  const [pairTask, setPairTask]             = useState(null); // exercise opened in pair programming

  // Gamification state
  const [xpPopups, setXpPopups] = useState([]);

  // Quiz state
  const [quizData, setQuizData]     = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizStep, setQuizStep]     = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizDone, setQuizDone]     = useState(false);
  const [quizError, setQuizError]   = useState(null);
  const [quizAttemptId, setQuizAttemptId] = useState(null);
  const [quizReveal, setQuizReveal] = useState({});      // step -> { correct, correctIndex, exp } from the server
  const [quizResult, setQuizResult] = useState(null);    // graded result from the server
  const [quizFinishing, setQuizFinishing] = useState(false);

  const [earnedStars, setEarnedStars] = useState(
    progress.stars[levelIndex] || 0
  );

  const level = levels[currentIdx] || { title: `Level ${currentIdx + 1}`, sub: "" };
  // Module 2.3 — a level opens only after the previous one is completed.
  const isLocked = currentIdx > 0 && !progress.doneLevels.includes(currentIdx - 1);
  const isDone = progress.doneLevels.includes(currentIdx);
  const pct = Math.round(((currentIdx + 1) / 20) * 100);

  useEffect(() => {
    setActiveTab("lesson");
    setLessonContent(null);
    setExtraExample(null);
    setPractice(null);
    setPracticeSolutions({});
    setPairTask(null);
    setQuizData(null);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizDone(false);
    setQuizError(null);
    setQuizAttemptId(null);
    setQuizReveal({});
    setQuizResult(null);
    setAiError("");
    setEarnedStars(progress.stars[currentIdx] || 0);
  }, [currentIdx]);

  useEffect(() => {
    if (isLocked) return;
    if (activeTab === "lesson" && !lessonContent && !lessonLoading) loadLesson();
    if (activeTab === "practice" && !practice && !practiceLoading) loadPractice();
    if (activeTab === "quiz" && !quizData && !quizLoading) loadQuiz();
  }, [activeTab, currentIdx]);

  // Module 3.1 — lessons and practice come from the server mentor (cached per level).
  const ctx = { language, levelIndex: currentIdx, uiLang };

  async function loadLesson(fresh = false) {
    setLessonLoading(true);
    setAiError("");
    try {
      const res = await mentor("lesson", { ...ctx, fresh });
      setLessonContent(res.text);
    } catch (err) {
      setAiError(err.message || "Could not load the lesson.");
    }
    setLessonLoading(false);
  }

  async function loadPractice(fresh = false) {
    setPracticeLoading(true);
    setAiError("");
    try {
      const res = await mentor("practice", { ...ctx, fresh });
      setPractice({ practiceId: res.practiceId, exercises: res.exercises });
      setPracticeSolutions({});
    } catch (err) {
      setAiError(err.message || "Could not load practice exercises.");
    }
    setPracticeLoading(false);
  }

  // Switching English/Urdu reloads the lesson and practice in that language.
  function changeUiLang(next) {
    if (next === uiLang) return;
    setUiLang(next);
    setLessonContent(null);
    setExtraExample(null);
    setPractice(null);
  }
  useEffect(() => {
    if (isLocked) return;
    if (activeTab === "lesson" && !lessonContent && !lessonLoading) loadLesson();
    if (activeTab === "practice" && !practice && !practiceLoading) loadPractice();
    // reload only when the language preference changes
  }, [uiLang]);

  // The quiz is generated and graded on the server: the client only ever sees
  // questions and options, and learns the right answer after locking one in.
  async function loadQuiz() {
    setQuizLoading(true);
    setQuizError(null);
    setQuizData(null);
    setQuizAttemptId(null);
    setQuizReveal({});
    setQuizResult(null);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizDone(false);
    try {
      const data = await apiRequest(`/api/assessment/${language}/${currentIdx}/start`, { method: "POST" });
      setQuizAttemptId(data.attemptId);
      setQuizData(data.questions);
    } catch (err) {
      setQuizError(err.message || "Could not load the quiz. Please try again.");
    }
    setQuizLoading(false);
  }

  async function getExtraExample() {
    setExtraLoading(true);
    setAiError("");
    try {
      setExtraExample((await mentor("example", ctx)).text);
    } catch (err) {
      setAiError(err.message || "Could not load an example.");
    }
    setExtraLoading(false);
  }

  // Module 3.3 — each hint ladder asks the server for step 1, 2 or 3.
  const lessonHint = async (step) => (await mentor("hint", { ...ctx, step, target: { type: "lesson" } })).text;
  const quizHint = (index) => async (step) =>
    (await mentor("hint", { ...ctx, step, target: { type: "quiz", attemptId: quizAttemptId, index } })).text;
  const practiceHint = (index) => async (step) =>
    (await mentor("hint", { ...ctx, step, target: { type: "practice", practiceId: practice.practiceId, index } })).text;

  async function getPracticeSolution(idx) {
    setSolLoading((s) => ({ ...s, [idx]: true }));
    try {
      const res = await mentor("solution", { ...ctx, practiceId: practice.practiceId, index: idx });
      setPracticeSolutions((s) => ({ ...s, [idx]: res.text }));
    } catch (err) {
      setAiError(err.message || "Could not load the solution.");
    }
    setSolLoading((s) => ({ ...s, [idx]: false }));
  }

  function openInPair(exercise) {
    setPairTask(exercise);
    setActiveTab("pair");
  }

  async function answerQ(optIdx, event) {
    const step = quizStep;
    if (quizAnswers[step] !== undefined || !quizAttemptId) return;
    // Read the button position now; the event is gone after the await.
    const rect = event?.currentTarget?.getBoundingClientRect();
    setQuizAnswers(prev => {
      const next = [...prev];
      next[step] = optIdx;
      return next;
    });

    try {
      const data = await apiRequest(`/api/assessment/attempt/${quizAttemptId}/answer`, {
        method: "POST",
        body: { index: step, choice: optIdx },
      });
      setQuizReveal(r => ({ ...r, [step]: { correct: data.correct, correctIndex: data.correctIndex, exp: data.exp } }));
      setQuizError(null);
      if (data.correct && rect) {
        setXpPopups(prev => [...prev, { id: Date.now(), xp: 10, x: rect.left + rect.width / 2, y: rect.top }]);
      }
    } catch (err) {
      // Let the student pick again if the answer did not reach the server.
      setQuizAnswers(prev => {
        const next = [...prev];
        delete next[step];
        return next;
      });
      setQuizError(err.message || "Could not save your answer. Please try again.");
    }
  }

  async function nextQ() {
    if (quizStep < quizData.length - 1) {
      setQuizStep(s => s + 1);
      return;
    }
    setQuizFinishing(true);
    try {
      const result = await apiRequest(`/api/assessment/attempt/${quizAttemptId}/finish`, { method: "POST" });
      setQuizResult(result);
      setEarnedStars(prev => Math.max(prev, result.stars || 0));
      setQuizDone(true);
      if (result.stars > 0 && onComplete) onComplete(currentIdx, result.stars, result.progress);
    } catch (err) {
      setQuizError(err.message || "Could not grade the quiz. Please try again.");
    }
    setQuizFinishing(false);
  }

  function navigateLevel(dir) {
    const next = currentIdx + dir;
    if (next < 0 || next > 19) return;
    setCurrentIdx(next);
    if (onNavigate) onNavigate(next);
  }

  function speakContent() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance((lessonContent || "").replace(/[#*`]/g, "").slice(0, 300));
      u.lang = uiLang === "Urdu" ? "ur-PK" : "en-US";
      window.speechSynthesis.speak(u);
    }
  }

  const correctCount = quizResult?.correct ?? 0;
  const finalScore = quizResult?.score ?? 0;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen bg-background"
    >
      {/* +XP pop-ups for correct answers */}
      {xpPopups.map((p) => (
        <FloatingXP key={p.id} xp={p.xp} x={p.x} y={p.y} onComplete={() => setXpPopups((prev) => prev.filter((z) => z.id !== p.id))} />
      ))}

      {/* HEADER */}
      <div className="h-20 bg-white/70 backdrop-blur-xl border-b border-[#ECE7F4] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onBack && onBack()} 
            className="p-2 rounded-xl border border-[#ECE7F4] hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-500 text-sm tracking-wide uppercase">Level {currentIdx + 1}</span>
              {isDone && <CheckCircle size={16} className="text-success" />}
            </div>
            <h1 className="text-lg font-heading font-black text-accent tracking-tight">{level.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-bold" role="group" aria-label="Explanation language">
            {["English", "Urdu"].map((l) => (
              <button key={l} onClick={() => changeUiLang(l)} className={`px-2.5 py-1 rounded-md transition-colors ${uiLang === l ? "bg-white text-[#8B6FE8] shadow-sm" : "text-gray-500 hover:text-accent"}`}>
                {l === "Urdu" ? "اردو" : "EN"}
              </button>
            ))}
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold text-sm hidden sm:block">
            {langLabel}
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map(n => (
              <Star key={n} size={20} className={n <= earnedStars ? "text-yellow-500 fill-yellow-500" : "text-gray-300 fill-gray-200"} />
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className={`${isLocked ? "hidden" : "flex"} bg-white/70 backdrop-blur-xl border-b border-[#ECE7F4] px-4 sm:px-6 gap-4 sm:gap-6 pt-2 shrink-0 overflow-x-auto`}>
        {[
          { id: "lesson", label: "Lesson", icon: <BookOpen size={18}/> },
          { id: "practice", label: "Practice", icon: <PenTool size={18}/> },
          { id: "pair", label: "Pair Programming", icon: <Users size={18}/> },
          { id: "quiz", label: "Quiz", icon: <ClipboardList size={18}/> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm whitespace-nowrap border-b-4 transition-colors ${activeTab === tab.id ? "border-[#8B6FE8] text-[#8B6FE8]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className={`${activeTab === "pair" && !isLocked ? "max-w-7xl" : "max-w-4xl"} mx-auto space-y-6`}>
          {aiError && !isLocked && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4 font-medium text-sm">{aiError}</div>
          )}
          {isLocked && (
            <div className="bg-white rounded-3xl p-10 border border-[#ECE7F4] text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center"><Lock size={30} /></div>
              <h2 className="font-heading font-black text-2xl text-accent mt-6">Level {currentIdx + 1} is locked</h2>
              <p className="text-gray-500 font-medium mt-2">Pass the Level {currentIdx} assessment to unlock this level.</p>
              <button className="btn-game btn-cute mt-8 inline-flex" onClick={() => navigateLevel(-1)}>
                Go to Level {currentIdx} <ChevronRight size={18}/>
              </button>
            </div>
          )}
          {!isLocked && (
          <AnimatePresence mode="wait">
            
            {/* LESSON TAB */}
            {activeTab === "lesson" && (
              <motion.div key="lesson" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4] shadow-sm min-h-[300px]">
                  {lessonLoading ? (
                    <LoadingDots label="Preparing your lesson..." />
                  ) : lessonContent ? (
                    <div className="max-w-none" dir="auto" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(lessonContent) }} />
                  ) : (
                    <button className="btn-game btn-secondary" onClick={() => loadLesson()}><RefreshCw size={18}/> Load lesson</button>
                  )}
                </div>

                {extraLoading && <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]"><LoadingDots label="Generating extra example..." /></div>}
                {extraExample && !extraLoading && (
                  <div className="bg-info/5 rounded-3xl p-8 border-2 border-info/20">
                    <h3 className="font-heading font-black text-info mb-4 flex items-center gap-2"><Lightbulb size={20}/> Extra Example</h3>
                    <div className="max-w-none" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(extraExample) }} />
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <button className="btn-game btn-secondary" onClick={getExtraExample} disabled={extraLoading}><Sparkles size={18}/> More Examples</button>
                  <button className="btn-game btn-secondary" onClick={() => { setExtraExample(null); loadLesson(true); }} disabled={lessonLoading}><RefreshCw size={18}/> Regenerate</button>
                  <button className="btn-game btn-cute ml-auto" onClick={() => setActiveTab("quiz")}>Take Quiz <ChevronRight size={18}/></button>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#ECE7F4]">
                  <h3 className="font-heading font-black text-accent mb-1">Stuck on this topic?</h3>
                  <p className="text-sm text-gray-500 font-medium mb-4">Hints get more specific each time, so you can work it out yourself.</p>
                  <HintLadder key={`lesson-${currentIdx}-${uiLang}`} fetchHint={lessonHint} compact />
                </div>

                <TutorChat key={`${language}-${currentIdx}`} language={language} levelIndex={currentIdx} uiLang={uiLang} onSpeak={speakContent} />
              </motion.div>
            )}

            {/* PRACTICE TAB */}
            {activeTab === "practice" && (
              <motion.div key="practice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]">
                  <h3 className="font-heading font-black text-xl text-accent mb-2">Practice Exercises</h3>
                  <p className="text-gray-500 font-medium">Solve each exercise yourself. Open it in Pair Programming to code with your AI partner, and use the hints only when you are stuck.</p>
                </div>

                {practiceLoading && (
                  <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]"><LoadingDots label="Preparing practice exercises..." /></div>
                )}

                {!practiceLoading && practice?.exercises?.map((ex, idx) => (
                  <div key={`${practice.practiceId}-${idx}`} className="bg-white rounded-3xl p-6 border border-[#ECE7F4] space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#F0EBFC] text-[#8B6FE8] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <h4 className="font-heading font-black text-accent">{ex.title}</h4>
                        <p className="text-accent/80 font-medium whitespace-pre-wrap mt-1" dir="auto">{ex.description}</p>
                      </div>
                    </div>
                    {ex.expectedOutput && (
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-gray-400 mb-1">Expected output</div>
                        <pre className="bg-[#1E2235] text-[#E6E9F5] rounded-xl p-3 text-sm overflow-x-auto font-mono whitespace-pre-wrap">{ex.expectedOutput}</pre>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button className="btn-game btn-cute text-sm py-2 px-4" onClick={() => openInPair(ex)}><Users size={16}/> Code it with AI partner</button>
                      <button className="btn-game btn-secondary text-sm py-2 px-4" onClick={() => getPracticeSolution(idx)} disabled={solLoading[idx] || !!practiceSolutions[idx]}><CheckCircle size={16}/> Show solution</button>
                    </div>
                    <HintLadder fetchHint={practiceHint(idx)} compact />
                    {solLoading[idx] && <LoadingDots label="Writing the solution..." />}
                    {practiceSolutions[idx] && (
                      <div className="bg-success/10 border-2 border-success/30 rounded-xl p-4">
                        <div className="text-success font-heading font-bold mb-2 flex items-center gap-1.5 text-sm"><CheckCircle size={16}/> Solution</div>
                        <div className="text-sm" dir="auto" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(practiceSolutions[idx]) }} />
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <button className="btn-game btn-secondary" onClick={() => loadPractice(true)} disabled={practiceLoading}><RefreshCw size={18}/> New Exercises</button>
                  <button className="btn-game btn-cute" onClick={() => setActiveTab("quiz")}>Ready for Quiz <ChevronRight size={18}/></button>
                </div>
              </motion.div>
            )}

            {/* PAIR PROGRAMMING TAB — Module 3.2 */}
            {activeTab === "pair" && (
              <motion.div key="pair" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PairProgramming
                  key={`${language}-${currentIdx}-${pairTask?.title || ""}`}
                  language={language}
                  levelIndex={currentIdx}
                  levelTitle={level.title}
                  uiLang={uiLang}
                  task={pairTask}
                  onClearTask={() => setPairTask(null)}
                />
              </motion.div>
            )}

            {/* QUIZ TAB */}
            {activeTab === "quiz" && (
              <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {quizLoading && <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]"><LoadingDots label="Generating quiz questions..." /></div>}

                {quizError && !quizLoading && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <span className="font-medium">{quizError}</span>
                    {!quizData && (
                      <button className="btn-game btn-secondary text-sm py-2 px-4" onClick={loadQuiz}><RefreshCw size={16}/> Try again</button>
                    )}
                  </div>
                )}

                {quizData && !quizDone && !quizLoading && (
                  <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4] shadow-gamified">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-heading font-black text-lg text-accent">Question {quizStep + 1} of {quizData.length}</h3>
                      <div className="flex gap-2">
                        {quizData.map((_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i < quizStep ? 'bg-success' : i === quizStep ? 'bg-[#8B6FE8]' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {QUESTION_TYPE[quizData[quizStep].type] && (
                        <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${QUESTION_TYPE[quizData[quizStep].type].cls}`}>
                          {QUESTION_TYPE[quizData[quizStep].type].label}
                        </span>
                      )}
                      {quizData[quizStep].topic && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500">{quizData[quizStep].topic}</span>
                      )}
                    </div>
                    <p className={`text-lg font-medium text-accent ${quizData[quizStep].code ? "mb-4" : "mb-8"}`}>{quizData[quizStep].q}</p>
                    {quizData[quizStep].code && (
                      <pre className="mb-8 bg-[#1E2235] text-[#E6E9F5] rounded-2xl p-5 text-sm leading-relaxed overflow-x-auto font-mono whitespace-pre"><code>{quizData[quizStep].code}</code></pre>
                    )}

                    <div className="space-y-3">
                      {quizData[quizStep].opts.map((opt, i) => {
                        const reveal = quizReveal[quizStep];
                        const answered = quizAnswers[quizStep] !== undefined;
                        const isCorrect = reveal ? i === reveal.correctIndex : false;
                        const isSelected = i === quizAnswers[quizStep];
                        
                        let btnStyle = "border border-[#ECE7F4] hover:border-[#8B6FE8] hover:bg-[#8B6FE8]/10 bg-white text-gray-700 shadow-[0_4px_0_0_#E6EBF3]";
                        if (answered && !reveal) {
                          btnStyle = isSelected
                            ? "bg-[#8B6FE8]/10 border-2 border-[#8B6FE8] text-[#8B6FE8] shadow-none"
                            : "bg-gray-50 border border-[#ECE7F4] text-gray-400 shadow-none opacity-50";
                        } else if (answered) {
                          if (isCorrect) btnStyle = "bg-green-100 border-2 border-success text-success shadow-[0_4px_0_0_#2E9D62]";
                          else if (isSelected) btnStyle = "bg-red-100 border-2 border-danger text-danger shadow-none translate-y-1";
                          else btnStyle = "bg-gray-50 border border-[#ECE7F4] text-gray-400 shadow-none opacity-50";
                        }

                        return (
                          <button
                            key={i}
                            disabled={answered}
                            onClick={(e) => answerQ(i, e)}
                            className={`w-full text-left p-4 rounded-2xl font-bold transition-all duration-150 flex items-center gap-4 ${btnStyle}`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${answered && isCorrect ? 'bg-success text-white' : answered && isSelected ? 'bg-danger text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizReveal[quizStep] && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-xl border-2 ${quizReveal[quizStep].correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <strong>{quizReveal[quizStep].correct ? "✅ Correct! " : "❌ Incorrect. "}</strong>
                        {quizReveal[quizStep].exp}
                      </motion.div>
                    )}

                    {quizAnswers[quizStep] === undefined && quizAttemptId && (
                      <div className="mt-6">
                        <HintLadder key={`${quizAttemptId}-${quizStep}`} fetchHint={quizHint(quizStep)} compact />
                      </div>
                    )}

                    <div className="flex justify-end items-center mt-8 pt-6 border-t-2 border-gray-100">
                      {quizReveal[quizStep] && (
                        <button className="btn-game btn-cute" onClick={nextQ} disabled={quizFinishing}>
                          {quizFinishing ? "Grading..." : quizStep === quizData.length - 1 ? "Finish" : "Next"} <ChevronRight size={18}/>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {quizDone && quizData && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-10 border-2 border-[#8B6FE8] shadow-gamified text-center relative overflow-hidden">
                    {(quizResult?.stars || 0) >= 2 && <ConfettiBurst />}
                    <div className="text-6xl mb-6">{["💪", "⭐", "⭐⭐", "⭐⭐⭐"][quizResult?.stars || 0]}</div>
                    <h2 className="font-heading font-black text-4xl text-accent mb-2">{finalScore}% Score</h2>
                    <p className="font-bold text-gray-500 mb-6">{correctCount} out of {quizData.length} correct</p>
                    
                    <p className="text-lg text-accent mb-8 font-medium">
                      {finalScore >= 85 ? "Excellent! You mastered this level!"
                        : finalScore >= 70 ? "Great job! Moving to the next level."
                        : finalScore >= 50 ? "You passed — review the lesson for a stronger grip."
                        : "Keep going! Review the lesson and try again."}
                    </p>

                    {quizResult?.report && <AssessmentReport report={quizResult.report} />}

                    <div className="flex flex-wrap justify-center gap-4">
                      <button className="btn-game btn-secondary" onClick={loadQuiz}><RefreshCw size={18}/> New Quiz</button>
                      {(quizResult?.stars || 0) > 0 && currentIdx < 19 && (
                        <button className="btn-game btn-cute" onClick={() => navigateLevel(1)}>Next Level <ChevronRight size={18}/></button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="h-20 bg-white/70 backdrop-blur-xl border-t border-[#ECE7F4] px-6 shrink-0 flex items-center justify-between z-20">
        <button onClick={() => navigateLevel(-1)} disabled={currentIdx === 0} className="btn-game btn-secondary text-sm py-2 disabled:opacity-50 border-gray-200">
          Previous
        </button>
        <div className="flex flex-col items-center flex-1 mx-8 max-w-sm">
          <div className="w-full h-3 bg-gray-100 rounded-full border border-[#ECE7F4] overflow-hidden mb-1">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6E8BF5,#9B7DF0)" }} />
          </div>
          <span className="text-xs font-bold text-gray-400">{currentIdx + 1} / 20</span>
        </div>
        <button onClick={() => navigateLevel(1)} disabled={currentIdx === 19} className="btn-game btn-cute text-sm py-2 disabled:opacity-50">
          Next
        </button>
      </div>
    </motion.div>
  );
}

// Module 2.2 — topic-wise performance report shown after each assessment.
function AssessmentReport({ report }) {
  const types = Object.entries(report.byType || {});
  const topics = Object.entries(report.byTopic || {});
  const pct = (v) => Math.round((v.correct / v.total) * 100);
  const bar = (v) => (pct(v) >= 70 ? "#2E9D62" : pct(v) >= 50 ? "#F49B00" : "#E5484D");
  return (
    <div className="text-left bg-[#FAF8FE] border border-[#ECE7F4] rounded-2xl p-6 mb-8">
      <h3 className="font-heading font-black text-accent mb-4">Your performance report</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">By question type</div>
          <div className="space-y-3">
            {types.map(([key, v]) => (
              <div key={key}>
                <div className="flex justify-between text-sm font-bold text-accent mb-1"><span>{v.label}</span><span>{v.correct}/{v.total}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct(v)}%`, background: bar(v) }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">By topic</div>
          <div className="space-y-3">
            {topics.map(([topic, v]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm font-bold text-accent mb-1"><span className="truncate pr-2">{topic}</span><span>{v.correct}/{v.total}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct(v)}%`, background: bar(v) }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {report.weakTopics?.length > 0 && (
        <div className="mt-5 text-sm font-medium text-accent">
          <span className="font-bold">Revise next: </span>
          {report.weakTopics.map((t) => (
            <span key={t} className="inline-block mr-2 mt-1 px-2.5 py-1 rounded-lg bg-[#FDEDEE] text-[#C62828] font-bold text-xs">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingDots({ label }) {
  return (
    <div className="flex items-center gap-3 text-gray-400 font-bold text-sm">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} className="w-2.5 h-2.5 bg-[#8B6FE8] rounded-full" />
        ))}
      </div>
      {label}
    </div>
  );
}
