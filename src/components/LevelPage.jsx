import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, BookOpen, PenTool, ClipboardList, Lightbulb, 
  ChevronRight, RefreshCw, Sparkles, Mic, Play, CheckCircle, 
  Lock, Star, PlayCircle, StopCircle
} from "lucide-react";
import { apiRequest } from "../utils/api";
import { formatAIMarkdown } from "../utils/aiMarkdown";

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

const PYTHON_LEVELS = [
  { title: "Hello World & Setup",   cat: "beginner",     sub: "print · comments · indentation" },
  { title: "Variables & Types",     cat: "beginner",     sub: "int · float · string · bool · type()" },
  { title: "Input & Output",        cat: "beginner",     sub: "input() · output · f-strings" },
  { title: "Conditions",            cat: "beginner",     sub: "if · elif · else · comparison operators" },
  { title: "Loops",                 cat: "beginner",     sub: "for · while · break · continue · range()" },
  { title: "Functions",             cat: "intermediate", sub: "def · parameters · return · scope" },
  { title: "Lists & Arrays",        cat: "intermediate", sub: "list creation · indexing · slicing · methods" },
  { title: "Strings",               cat: "intermediate", sub: "string methods · slicing · formatting" },
  { title: "Dictionaries",          cat: "intermediate", sub: "key-value pairs · dict methods · iteration" },
  { title: "File Handling",         cat: "intermediate", sub: "open() · read · write · with statement" },
  { title: "Error Handling",        cat: "intermediate", sub: "try · except · finally · custom exceptions" },
  { title: "OOP — Classes",         cat: "intermediate", sub: "class · __init__ · self · methods" },
  { title: "OOP — Inheritance",     cat: "intermediate", sub: "inheritance · super() · polymorphism" },
  { title: "Modules",               cat: "intermediate", sub: "import · pip · os · math · random" },
  { title: "Problem Solving I",     cat: "intermediate", sub: "algorithms · Big-O · common patterns" },
  { title: "Recursion",             cat: "advanced",     sub: "recursive functions · base case · call stack" },
  { title: "Data Structures",       cat: "advanced",     sub: "stacks · queues · linked lists" },
  { title: "Algorithms",            cat: "advanced",     sub: "sorting · searching · binary search" },
  { title: "Mini Project",          cat: "advanced",     sub: "design · implementation · testing" },
  { title: "Final Challenge",       cat: "advanced",     sub: "capstone problems · review · certification" },
];

const CPP_LEVELS = [
  { title: "Setup & First Program", cat: "beginner",     sub: "cout · cin · #include · main()" },
  { title: "Variables & Types",     cat: "beginner",     sub: "int · float · string · bool · auto" },
  { title: "Input & Output",        cat: "beginner",     sub: "cin · cout · endl · formatting" },
  { title: "Conditions",            cat: "beginner",     sub: "if · else if · else · switch" },
  { title: "Loops",                 cat: "beginner",     sub: "for · while · do-while · break · continue" },
  { title: "Functions",             cat: "intermediate", sub: "declaration · parameters · return · overloading" },
  { title: "Arrays",                cat: "intermediate", sub: "1D/2D arrays · indexing · sorting" },
  { title: "Strings",               cat: "intermediate", sub: "string class · methods · c-strings" },
  { title: "Pointers",              cat: "intermediate", sub: "& · * · pointer arithmetic · references" },
  { title: "File Handling",         cat: "intermediate", sub: "fstream · ifstream · ofstream · modes" },
  { title: "Error Handling",        cat: "intermediate", sub: "try · catch · throw · exception classes" },
  { title: "OOP — Classes",         cat: "intermediate", sub: "class · constructor · destructor · access specifiers" },
  { title: "OOP — Inheritance",     cat: "intermediate", sub: "inheritance · virtual · polymorphism · override" },
  { title: "Templates",             cat: "intermediate", sub: "function templates · class templates · generic programming" },
  { title: "STL",                   cat: "intermediate", sub: "vector · map · set · algorithms · iterators" },
  { title: "Recursion",             cat: "advanced",     sub: "recursive functions · base case · memoization" },
  { title: "Data Structures",       cat: "advanced",     sub: "linked list · stack · queue · tree" },
  { title: "Algorithms",            cat: "advanced",     sub: "sorting · searching · complexity · dynamic programming" },
  { title: "Mini Project",          cat: "advanced",     sub: "design · implementation · testing · documentation" },
  { title: "Final Challenge",       cat: "advanced",     sub: "capstone problems · review · certification" },
];

async function callAI(prompt) {
  try {
    const data = await apiRequest("/api/ai/ask", {
      method: "POST",
      body: { prompt },
    });
    return data.text;
  } catch (err) {
    return `⚠️ AI request failed: ${err.message}`;
  }
}

export default function LevelPage({
  username = "Student",
  language = "python",
  levelIndex = 3,
  progress = { doneLevels: [0, 1, 2], stars: { 0: 3, 1: 2, 2: 3 }, currentLevel: 3 },
  onBack,
  onComplete,
  onNavigate,
}) {
  const levels = language === "python" ? PYTHON_LEVELS : CPP_LEVELS;
  const langLabel = language === "python" ? "🐍 Python" : "⚡ C++";

  const [currentIdx, setCurrentIdx]   = useState(levelIndex);
  const [activeTab, setActiveTab]     = useState("lesson");
  const [uiLang, setUiLang]           = useState("English");
  const [hintOpen, setHintOpen]       = useState(false);
  const [generalHint, setGeneralHint] = useState(null);
  const [generalHintLoading, setGeneralHintLoading] = useState(false);

  // Lesson state
  const [lessonContent, setLessonContent]   = useState(null);
  const [lessonLoading, setLessonLoading]   = useState(false);
  const [extraExample, setExtraExample]     = useState(null);
  const [extraLoading, setExtraLoading]     = useState(false);

  // Practice state
  const [practiceContent, setPracticeContent] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceHints, setPracticeHints]   = useState({});
  const [practiceSolutions, setPracticeSolutions] = useState({});
  const [hintLoading, setHintLoading]       = useState({});
  const [solLoading, setSolLoading]         = useState({});

  // Gamification state
  const [xpPopups, setXpPopups] = useState([]);

  // Quiz state
  const [quizData, setQuizData]     = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizStep, setQuizStep]     = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizDone, setQuizDone]     = useState(false);
  const [quizError, setQuizError]   = useState(null);
  const [quizHints, setQuizHints]   = useState({});       // keyed by quizStep
  const [quizHintLoading, setQuizHintLoading] = useState({});

  const [earnedStars, setEarnedStars] = useState(
    progress.stars[levelIndex] || 0
  );

  const level = levels[currentIdx];
  const isDone = progress.doneLevels.includes(currentIdx);
  const pct = Math.round(((currentIdx + 1) / 20) * 100);

  useEffect(() => {
    setActiveTab("lesson");
    setLessonContent(null);
    setExtraExample(null);
    setPracticeContent(null);
    setPracticeHints({});
    setPracticeSolutions({});
    setQuizData(null);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizDone(false);
    setQuizError(null);
    setQuizHints({});
    setQuizHintLoading({});
    setHintOpen(false);
    setGeneralHint(null);
    setGeneralHintLoading(false);
    setEarnedStars(progress.stars[currentIdx] || 0);
  }, [currentIdx]);

  useEffect(() => {
    if (activeTab === "lesson" && !lessonContent && !lessonLoading) loadLesson();
    if (activeTab === "practice" && !practiceContent && !practiceLoading) loadPractice();
    if (activeTab === "quiz" && !quizData && !quizLoading) loadQuiz();
  }, [activeTab, currentIdx]);

  async function loadLesson() {
    setLessonLoading(true);
    const prompt = `You are an expert ${language === "python" ? "Python" : "C++"} tutor. Create a comprehensive lesson on "${level.title}" covering: ${level.sub}. Include: clear explanation, key concepts, syntax examples with code blocks using \`\`\`${language === "python" ? "python" : "cpp"} and \`\`\`, and a summary. ${uiLang === "Urdu" ? "Include brief Urdu explanations after key points." : ""}`;
    const text = await callAI(prompt);
    setLessonContent(text);
    setLessonLoading(false);
  }

  async function loadPractice() {
    setPracticeLoading(true);
    const prompt = `Create 3 practice exercises for ${language === "python" ? "Python" : "C++"} "${level.title}" (${level.sub}). For each: give a numbered title, problem description, and expected output. Do NOT give the solution. ${uiLang === "Urdu" ? "Include Urdu instructions." : ""}`;
    const text = await callAI(prompt);
    setPracticeContent(text);
    setPracticeLoading(false);
  }

  async function loadQuiz() {
    setQuizLoading(true);
    setQuizError(null);
    const prompt = `Create a quiz with exactly 5 multiple-choice questions for ${language === "python" ? "Python" : "C++"} "${level.title}" (${level.sub}). Return ONLY valid JSON like: [{"q":"Question?","opts":["A","B","C","D"],"ans":0,"exp":"Why A is correct"}]. The ans field is 0-based index. No markdown, no extra text.`;
    const raw = await callAI(prompt);
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuizData(parsed);
    } catch {
      setQuizData([
        { q: `What is the correct way to write a conditional in ${language === "python" ? "Python" : "C++"}?`, opts: ["if x > 0 {}", "if (x > 0):", "if x > 0:", "when x > 0:"], ans: language === "python" ? 2 : 1, exp: `Practice makes perfect.` },
        { q: `Which of the following is a valid comparison operator?`, opts: ["===", "==", "<>", "=!"], ans: 1, exp: "== is the equality comparison operator." },
        { q: "What does an if-else block do?", opts: ["Loops through data", "Executes code conditionally", "Defines a function", "Imports a module"], ans: 1, exp: "Runs different code depending on condition." },
        { q: "What happens when an if condition is False and there is no else?", opts: ["Error occurs", "Program crashes", "The block is skipped", "It runs anyway"], ans: 2, exp: "The if block is simply skipped." },
        { q: "Which operator requires BOTH conditions to be True?", opts: ["or", "not", "and", "xor"], ans: 2, exp: "The 'and' operator." },
      ]);
    }
    setQuizLoading(false);
  }

  async function getExtraExample() {
    setExtraLoading(true);
    const prompt = `Give one additional creative real-world ${language === "python" ? "Python" : "C++"} example for "${level.title}". Use a code block. Keep it concise. ${uiLang === "Urdu" ? "Add Urdu explanation." : ""}`;
    const text = await callAI(prompt);
    setExtraExample(text);
    setExtraLoading(false);
  }

  async function getGeneralHint() {
    if (generalHint || generalHintLoading) {
      setHintOpen(!hintOpen);
      return;
    }
    setHintOpen(true);
    setGeneralHintLoading(true);
    const prompt = `Give a short, encouraging hint for a student learning ${language === "python" ? "Python" : "C++"} "${level.title}". Do NOT give code solutions. Keep it to 2-3 sentences.`;
    const text = await callAI(prompt);
    setGeneralHint(text);
    setGeneralHintLoading(false);
  }

  async function getQuizHint() {
    const step = quizStep;
    // Toggle closed if this question's hint is already loaded
    if (quizHints[step] !== undefined) {
      setQuizHints(h => {
        const next = { ...h };
        delete next[step];
        return next;
      });
      return;
    }
    if (quizHintLoading[step]) return;
    setQuizHintLoading(h => ({ ...h, [step]: true }));
    const q = quizData[step];
    const optionList = q.opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("; ");
    const prompt = `A student is answering this ${language === "python" ? "Python" : "C++"} multiple-choice question about "${level.title}": "${q.q}" Options: ${optionList}. Give a short 1-2 sentence hint that nudges them toward the right reasoning. Do NOT reveal or name the correct answer.`;
    const text = await callAI(prompt);
    setQuizHints(h => ({ ...h, [step]: text }));
    setQuizHintLoading(h => ({ ...h, [step]: false }));
  }

  async function getPracticeHint(idx) {
    setHintLoading(h => ({ ...h, [idx]: true }));
    const prompt = `Give a helpful step-by-step hint for practice exercise ${idx + 1} about ${language === "python" ? "Python" : "C++"} "${level.title}". Do NOT give the full solution — just guide the student.`;
    const text = await callAI(prompt);
    setPracticeHints(h => ({ ...h, [idx]: text }));
    setHintLoading(h => ({ ...h, [idx]: false }));
  }

  async function getPracticeSolution(idx) {
    setSolLoading(s => ({ ...s, [idx]: true }));
    const prompt = `Provide the complete solution for practice exercise ${idx + 1} about ${language === "python" ? "Python" : "C++"} "${level.title}" with explanation.`;
    const text = await callAI(prompt);
    setPracticeSolutions(s => ({ ...s, [idx]: text }));
    setSolLoading(s => ({ ...s, [idx]: false }));
  }

  function answerQ(optIdx, event) {
    if (quizAnswers[quizStep] !== undefined) return;
    setQuizAnswers(prev => {
      const next = [...prev];
      next[quizStep] = optIdx;
      return next;
    });
    
    // Gamification XP pop if correct
    if (quizData[quizStep].ans === optIdx && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;
      setXpPopups(prev => [...prev, { id: Date.now(), xp: 10, x, y }]);
    }
  }

  async function nextQ() {
    if (quizStep < quizData.length - 1) {
      setQuizStep(s => s + 1);
    } else {
      setQuizDone(true);
      const correct = quizAnswers.filter((a, i) => a === quizData[i].ans).length;
      const score = Math.round((correct / quizData.length) * 100);
      let stars = 0;
      if (score >= 85) stars = 3;
      else if (score >= 70) stars = 2;
      else if (score >= 50) stars = 1;
      setEarnedStars(stars);

      if (stars > 0) {
        try {
          await apiRequest(`/api/progress/${language}/level`, {
            method: "PUT",
            body: { levelIndex: currentIdx, stars },
          });
        } catch (err) {}
        if (onComplete) onComplete(currentIdx, stars);
      }
    }
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

  const correctCount = quizDone ? quizAnswers.filter((a, i) => quizData && a === quizData[i].ans).length : 0;
  const finalScore = quizData ? Math.round((correctCount / quizData.length) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen bg-background"
    >
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
        <div className="flex items-center gap-4">
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
      <div className="flex bg-white/70 backdrop-blur-xl border-b border-[#ECE7F4] px-6 gap-6 pt-2 shrink-0">
        {[
          { id: "lesson", label: "Lesson", icon: <BookOpen size={18}/> },
          { id: "practice", label: "Practice", icon: <PenTool size={18}/> },
          { id: "quiz", label: "Quiz", icon: <ClipboardList size={18}/> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setHintOpen(false); }}
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm border-b-4 transition-colors ${activeTab === tab.id ? "border-[#8B6FE8] text-[#8B6FE8]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            
            {/* LESSON TAB */}
            {activeTab === "lesson" && (
              <motion.div key="lesson" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4] shadow-sm min-h-[300px]">
                  {lessonLoading ? (
                    <LoadingDots label="Generating your lesson..." />
                  ) : lessonContent ? (
                    <div className="max-w-none" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(lessonContent) }} />
                  ) : (
                    <div className="text-gray-500 font-medium">Click Regenerate to load lesson.</div>
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
                  <button className="btn-game btn-secondary" onClick={getGeneralHint} disabled={generalHintLoading}>
                    {generalHintLoading ? <RefreshCw className="animate-spin" size={18}/> : <Lightbulb size={18}/>} Hint
                  </button>
                  <button className="btn-game btn-secondary" onClick={getExtraExample} disabled={extraLoading}><Sparkles size={18}/> More Examples</button>
                  <button className="btn-game btn-secondary" onClick={() => { setLessonContent(null); setExtraExample(null); loadLesson(); }}><RefreshCw size={18}/> Regenerate</button>
                  <button className="btn-game btn-cute ml-auto" onClick={() => setActiveTab("quiz")}>Take Quiz <ChevronRight size={18}/></button>
                </div>

                {hintOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-warning/10 border-2 border-warning/30 rounded-2xl p-6 flex gap-3 items-start">
                    <Lightbulb size={18} className="text-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-warning mb-1 uppercase text-xs tracking-wider">Hint from AI Tutor</h4>
                      {generalHintLoading ? (
                        <div className="text-sm text-warning font-medium flex items-center gap-2"><RefreshCw className="animate-spin" size={14}/> Generating hint...</div>
                      ) : (
                        <div className="text-accent/80 font-medium text-sm" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(generalHint || "") }} />
                      )}
                    </div>
                  </motion.div>
                )}

                <VoiceBar onSpeak={speakContent} uiLang={uiLang} onLangChange={setUiLang} level={level} language={language} />
              </motion.div>
            )}

            {/* PRACTICE TAB */}
            {activeTab === "practice" && (
              <motion.div key="practice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]">
                  <h3 className="font-heading font-black text-xl text-accent mb-2">Practice Exercises</h3>
                  <p className="text-gray-500 font-medium">Work through these exercises in your code editor. Use hints if you get stuck!</p>
                </div>

                {practiceLoading ? (
                  <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]"><LoadingDots label="Generating practice exercises..." /></div>
                ) : practiceContent && (
                  <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]">
                    <div className="max-w-none" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(practiceContent) }} />
                  </div>
                )}

                {[0, 1, 2].map(idx => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border border-[#ECE7F4]">
                    <h4 className="font-bold text-accent mb-4">Exercise {idx + 1} Helpers</h4>
                    <div className="flex gap-4 mb-4">
                      <button className="btn-game btn-secondary text-sm py-2 px-4" onClick={() => getPracticeHint(idx)} disabled={hintLoading[idx]}><Lightbulb size={16}/> Hint</button>
                      <button className="btn-game btn-secondary text-sm py-2 px-4" onClick={() => getPracticeSolution(idx)} disabled={solLoading[idx]}><CheckCircle size={16}/> Solution</button>
                    </div>
                    {hintLoading[idx] && <LoadingDots label="Generating hint..." />}
                    {practiceHints[idx] && (
                      <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4 mt-2">
                        <div className="text-warning font-heading font-bold mb-2 flex items-center gap-1.5 text-sm"><Lightbulb size={16}/> Hint</div>
                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(practiceHints[idx]) }} />
                      </div>
                    )}
                    {solLoading[idx] && <LoadingDots label="Generating solution..." />}
                    {practiceSolutions[idx] && (
                      <div className="bg-success/10 border-2 border-success/30 rounded-xl p-4 mt-2">
                        <div className="text-success font-heading font-bold mb-2 flex items-center gap-1.5 text-sm"><CheckCircle size={16}/> Solution</div>
                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(practiceSolutions[idx]) }} />
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <button className="btn-game btn-secondary" onClick={() => { setPracticeContent(null); loadPractice(); }}><RefreshCw size={18}/> More Exercises</button>
                  <button className="btn-game btn-cute" onClick={() => setActiveTab("quiz")}>Ready for Quiz <ChevronRight size={18}/></button>
                </div>
              </motion.div>
            )}

            {/* QUIZ TAB */}
            {activeTab === "quiz" && (
              <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {quizLoading && <div className="bg-white rounded-3xl p-8 border border-[#ECE7F4]"><LoadingDots label="Generating quiz questions..." /></div>}

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

                    <p className="text-lg font-medium text-accent mb-8">{quizData[quizStep].q}</p>

                    <div className="space-y-3">
                      {quizData[quizStep].opts.map((opt, i) => {
                        const answered = quizAnswers[quizStep] !== undefined;
                        const isCorrect = i === quizData[quizStep].ans;
                        const isSelected = i === quizAnswers[quizStep];
                        
                        let btnStyle = "border border-[#ECE7F4] hover:border-[#8B6FE8] hover:bg-[#8B6FE8]/10 bg-white text-gray-700 shadow-[0_4px_0_0_#E6EBF3]";
                        if (answered) {
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

                    {quizAnswers[quizStep] !== undefined && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-xl border-2 ${quizAnswers[quizStep] === quizData[quizStep].ans ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <strong>{quizAnswers[quizStep] === quizData[quizStep].ans ? "✅ Correct! " : "❌ Incorrect. "}</strong>
                        {quizData[quizStep].exp}
                      </motion.div>
                    )}

                    {quizHintLoading[quizStep] && (
                      <div className="mt-6"><LoadingDots label="Generating hint..." /></div>
                    )}
                    {quizHints[quizStep] && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-warning/10 border-2 border-warning/30 rounded-xl p-4">
                        <div className="text-warning font-heading font-bold mb-2 flex items-center gap-1.5 text-sm"><Lightbulb size={16}/> Hint</div>
                        <div className="text-sm text-accent/80 font-medium" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(quizHints[quizStep]) }} />
                      </motion.div>
                    )}

                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-100">
                      <button className="btn-game btn-secondary text-sm py-2 px-4" onClick={getQuizHint} disabled={quizHintLoading[quizStep] || quizAnswers[quizStep] !== undefined}>
                        {quizHintLoading[quizStep] ? <RefreshCw className="animate-spin" size={16}/> : <Lightbulb size={16}/>} Hint
                      </button>
                      {quizAnswers[quizStep] !== undefined && (
                        <button className="btn-game btn-cute" onClick={nextQ}>
                          {quizStep === quizData.length - 1 ? "Finish" : "Next"} <ChevronRight size={18}/>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {quizDone && quizData && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-10 border-2 border-[#8B6FE8] shadow-gamified text-center relative overflow-hidden">
                    {earnedStars >= 2 && <ConfettiBurst />}
                    <div className="text-6xl mb-6">{["💪", "⭐", "⭐⭐", "⭐⭐⭐"][earnedStars]}</div>
                    <h2 className="font-heading font-black text-4xl text-accent mb-2">{finalScore}% Score</h2>
                    <p className="font-bold text-gray-500 mb-6">{correctCount} out of {quizData.length} correct</p>
                    
                    <p className="text-lg text-accent mb-8 font-medium">
                      {finalScore >= 85 ? "Excellent! You mastered this level!"
                        : finalScore >= 70 ? "Great job! Moving to the next level."
                        : finalScore >= 50 ? "You passed — review the lesson for a stronger grip."
                        : "Keep going! Review the lesson and try again."}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                      <button className="btn-game btn-secondary" onClick={() => { setQuizStep(0); setQuizAnswers([]); setQuizDone(false); }}><RefreshCw size={18}/> Retry</button>
                      {finalScore >= 50 && currentIdx < 19 && (
                        <button className="btn-game btn-cute" onClick={() => navigateLevel(1)}>Next Level <ChevronRight size={18}/></button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
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

function VoiceBar({ onSpeak, uiLang, onLangChange, level, language }) {
  const [question, setQuestion]   = useState("");
  const [answer, setAnswer]       = useState(null);
  const [asking, setAsking]       = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, []);

  function toggleRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recording) {
      recognitionRef.current && recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = uiLang === "Urdu" ? "ur-PK" : "en-US";
    recognition.onresult = (e) => setQuestion(prev => `${prev} ${e.results[0][0].transcript}`);
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function submitQuestion() {
    if (!question.trim() || asking) return;
    setAsking(true);
    setAnswer(null);
    const text = await callAI(`Student asks about "${level.title}": "${question}". Explain simply.`);
    setAnswer(text);
    setAsking(false);
  }

  return (
    <div className="bg-[#8B6FE8]/5 border-2 border-[#8B6FE8]/20 rounded-3xl p-6 mt-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-[#8B6FE8]" />
        <h3 className="font-heading font-black text-accent text-sm uppercase tracking-wide">Ask the AI Tutor</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="flex gap-2">
          <button onClick={onSpeak} className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-[#8B6FE8]/30 text-accent hover:scale-105 hover:bg-[#8B6FE8]/10 transition-all shadow-sm">
            <Play size={20} className="ml-1"/>
          </button>
          <button onClick={toggleRecording} className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${recording ? 'bg-danger border-danger text-white animate-pulse' : 'bg-white border-[#8B6FE8]/30 text-accent hover:scale-105 hover:bg-[#8B6FE8]/10'}`}>
            {recording ? <StopCircle size={20}/> : <Mic size={20}/>}
          </button>
        </div>
        <div className="flex-1 w-full flex bg-white rounded-2xl border-2 border-[#8B6FE8]/20 overflow-hidden shadow-inner">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitQuestion()}
            placeholder="Ask AI tutor..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-medium text-accent"
          />
          <button onClick={submitQuestion} disabled={asking || !question.trim()} className="bg-[#8B6FE8] text-white font-bold px-6 py-3 text-sm hover:bg-[#7B5FE0] disabled:opacity-50 transition-colors">
            Ask
          </button>
        </div>
      </div>

      {asking && <LoadingDots label="Tutor is thinking..." />}
      {answer && !asking && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border-2 border-[#8B6FE8]/15 mt-4 relative">
          <div className="absolute -top-3 left-4 bg-[#8B6FE8] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg shadow-sm">AI Response</div>
          <div className="max-w-none pt-1" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(answer) }} />
        </motion.div>
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
