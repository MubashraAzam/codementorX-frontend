import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Upload, Lock, Award, PlayCircle, RefreshCw, Star, Printer, XCircle } from "lucide-react";
import { apiRequest } from "../utils/api";

const CONFETTI_COLORS = ["#F49B00", "#25367C", "#2e9d62", "#c62828", "#8e44ad", "#f5c842"];

function ConfettiBurst() {
  const pieces = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
      duration: 1.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "120vh", x: (Math.random() - 0.5) * 300, opacity: [1, 1, 0], rotate: 360 * (Math.random() * 2) }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{ position: "absolute", left: `${p.left}%`, width: p.size, height: p.size, backgroundColor: p.bg, borderRadius: Math.random() > 0.5 ? "50%" : "2px" }}
        />
      ))}
    </div>
  );
}

const PYTHON_PROJECTS = [
  { id: 0, title: "Student Grade Calculator",     desc: "Build a program that takes marks for 5 subjects and calculates GPA, grade, and pass/fail status.",         difficulty: "Easy"   },
  { id: 1, title: "Library Book Manager",          desc: "Create a console app to add, search, remove, and list books using lists and dictionaries.",                difficulty: "Easy"   },
  { id: 2, title: "Simple ATM Machine",            desc: "Simulate an ATM: login with PIN, check balance, deposit, withdraw, with proper validation.",              difficulty: "Easy"   },
  { id: 3, title: "Weather Data Analyzer",         desc: "Read a CSV of daily temperatures, calculate averages, find hottest/coldest days, and plot a chart.",      difficulty: "Medium" },
  { id: 4, title: "Contact Book App",              desc: "Build a contact manager with add/search/edit/delete using file handling to persist data.",                 difficulty: "Medium" },
  { id: 5, title: "Quiz Game",                     desc: "Create a multiple-choice quiz app with a timer, score tracking, and a leaderboard saved to file.",        difficulty: "Medium" },
  { id: 6, title: "Expense Tracker",               desc: "Track daily expenses by category, show monthly summaries, and warn when a budget limit is exceeded.",      difficulty: "Medium" },
  { id: 7, title: "Text-Based Adventure Game",     desc: "Design a story-driven game with branching choices, inventory, and at least 3 different endings.",          difficulty: "Hard"   },
  { id: 8, title: "Student Management System",     desc: "Full OOP project: classes for Student, Course, Teacher with file-based storage and a menu-driven UI.",    difficulty: "Hard"   },
  { id: 9, title: "Chat Bot (Rule-Based)",         desc: "Build a rule-based chatbot that answers FAQs, remembers user name, and logs conversations to a file.",    difficulty: "Hard"   },
];

const CPP_PROJECTS = [
  { id: 0, title: "Temperature Converter",         desc: "Convert between Celsius, Fahrenheit, and Kelvin with input validation and formatted output.",              difficulty: "Easy"   },
  { id: 1, title: "Simple Calculator",             desc: "Build a calculator with all operators, error handling for division by zero, and a history log.",          difficulty: "Easy"   },
  { id: 2, title: "Number Guessing Game",          desc: "Generate a random number; player guesses with hints (higher/lower) and a limited number of tries.",       difficulty: "Easy"   },
  { id: 3, title: "Student Record System",         desc: "OOP project using classes to store, search, sort, and display student records with file I/O.",            difficulty: "Medium" },
  { id: 4, title: "Linked List Implementation",    desc: "Implement a singly linked list with insert, delete, search, and reverse operations from scratch.",        difficulty: "Medium" },
  { id: 5, title: "Bank Account System",           desc: "Simulate accounts with deposit, withdraw, transfer, and statement history using OOP and file handling.",  difficulty: "Medium" },
  { id: 6, title: "Stack & Queue Library",         desc: "Build your own Stack and Queue classes using arrays, then solve 3 real problems using each.",             difficulty: "Medium" },
  { id: 7, title: "Mini Shell Interpreter",        desc: "Parse and execute simple shell commands (ls, cd, echo) using string parsing and system calls.",           difficulty: "Hard"   },
  { id: 8, title: "Binary Search Tree",            desc: "Implement a BST with insert, delete, search, and all three traversals. Visualise output in the console.", difficulty: "Hard"   },
  { id: 9, title: "Inventory Management System",   desc: "Full OOP system: Product, Category, Stock classes with file persistence, search, and low-stock alerts.", difficulty: "Hard"   },
];

const diffColor = {
  Easy:   "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  Hard:   "bg-red-100 text-red-700 border-red-200",
};

async function reviewCodeWithAI(fileContent, fileName, language, projectTitle) {
  try {
    const data = await apiRequest("/api/ai/review-project", {
      method: "POST",
      body: { code: fileContent, fileName, language, projectTitle },
    });
    return data;
  } catch (err) {
    return { stars: 0, feedback: `⚠️ Review failed: ${err.message}` };
  }
}

export default function Certificate({ username = "Student", language = "python", onBack, initialView = "projects" }) {
  const PROJECTS = language === "python" ? PYTHON_PROJECTS : CPP_PROJECTS;
  const acceptExt = language === "python" ? ".py" : ".cpp,.cc,.cxx";
  const langLabel = language === "python" ? "🐍 Python" : "⚡ C++";

  const [view, setView] = useState(initialView); 
  const [projectState, setProjectState] = useState({});
  const [reviewingId, setReviewingId] = useState(null);
  const fileInputRefs = useRef({});

  // Interview state
  const [callState, setCallState] = useState("idle");
  const [interviewResult, setInterviewResult] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const pollingIntervalRef = useRef(null);

  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (initialView === "interview" && !interviewStarted) {
      startInterview();
    }
  }, [initialView, interviewStarted]);

  const solvedIds = Object.keys(projectState).filter(id => (projectState[id]?.stars || 0) >= 2);
  const solvedCount = solvedIds.length;

  function handleFilePicked(projId, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const content = ev.target.result;
      setProjectState(prev => ({
        ...prev,
        [projId]: { status: "submitted", fileName: file.name, stars: 0, feedback: null },
      }));
      setReviewingId(projId);
      const proj = PROJECTS.find(p => p.id === projId);
      const result = await reviewCodeWithAI(content, file.name, language, proj.title);
      setProjectState(prev => ({
        ...prev,
        [projId]: { status: result.stars >= 2 ? "solved" : "needs_retry", fileName: file.name, stars: result.stars, feedback: result.feedback },
      }));
      setReviewingId(null);

      try {
        await apiRequest(`/api/progress/${language}/project`, {
          method: "PUT",
          body: { projectId: projId, stars: result.stars, feedback: result.feedback, fileName: file.name },
        });
      } catch (err) {
        console.error("Failed to save project result:", err.message);
      }
    };
    reader.readAsText(file);
  }

  const DOGRAH_TOKENS = {
    python: "emb_FZ1Vl_NeqUiqFoYrXbGs3r9TxGPMBaEKuy9s7wGgytE",
    cpp: "emb_kGxkMJ2Bxt6r5S7e4xMiQW1XMzyuytt4IWNsEm30QvE"
  };

  React.useEffect(() => {
    if (!interviewStarted) return;

    let pollForWidget;
    
    const initWidget = () => {
      let retries = 0;
      const maxRetries = 50;
      
      pollForWidget = setInterval(() => {
        if (typeof window.DograhWidget !== "undefined") {
          clearInterval(pollForWidget);
          
          if (window.DograhWidget.onCallConnected) {
            window.DograhWidget.onCallConnected(async ({ workflowRunId }) => {
              console.log("TEMPORARY: Captured real Dograh workflowRunId:", workflowRunId);
              try {
                await apiRequest(`/api/interview/link/${language}`, {
                  method: "POST",
                  body: { workflowRunId },
                });
              } catch (err) {
                console.error("Failed to link run ID:", err);
              }
            });
          }
          
          if (window.DograhWidget.onCallDisconnected) {
            window.DograhWidget.onCallDisconnected(() => {
              setCallState("grading");
              pollForGrade();
            });
          }
          
          if (window.DograhWidget.onError) {
            window.DograhWidget.onError((err) => {
              console.error("Dograh error:", err?.message || err);
            });
          }
        } else if (retries >= maxRetries) {
          clearInterval(pollForWidget);
          console.error("Dograh widget failed to load after 5 seconds.");
          setCallState("idle");
          alert("Voice agent failed to load. Please refresh and try again.");
        }
        retries++;
      }, 100);
    };

    if (document.readyState === 'complete') {
      initWidget();
    } else {
      window.addEventListener('load', initWidget);
      return () => window.removeEventListener('load', initWidget);
    }
    
    return () => {
      if (pollForWidget) clearInterval(pollForWidget);
    };
  }, [interviewStarted, language]);

  async function startInterview() {
    setView("interview");
    setInterviewStarted(true);
    setCallState("starting");
    setInterviewResult(null);

    try {
      await apiRequest(`/api/interview/start/${language}`, { method: "GET" });

      const existingScript = document.getElementById("dograh-widget");
      if (existingScript) existingScript.remove();

      const token = DOGRAH_TOKENS[language];
      const script = document.createElement("script");
      script.id = "dograh-widget";
      script.src = `https://app.dograh.com/embed/dograh-widget.js?token=${token}&environment=production&apiEndpoint=https://api.dograh.com`;
      script.async = true;
      
      script.onload = () => {
        setCallState("connected");
      };

      document.body.appendChild(script);

    } catch (err) {
      console.error("Failed to start interview", err);
      setCallState("idle");
      alert("Failed to connect to the voice agent.");
    }
  }

  function pollForGrade() {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const progress = await apiRequest(`/api/interview/progress/${language}`, { method: "GET" });
        if (progress?.interview?.percentage !== null && progress?.interview?.percentage !== undefined) {
          clearInterval(pollingIntervalRef.current);
          setInterviewResult({
            percentage: progress.interview.percentage,
            feedback: progress.interview.feedback
          });
        }
      } catch (err) {
        console.error("Error polling for grade", err);
      }
    }, 3000);
  }

  // UI LAYOUT HELPERS
  const PageWrapper = ({ children }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-screen bg-background">
      {children}
    </motion.div>
  );

  const TopBar = ({ title, showBack = true, actionLabel, actionIcon, isSuccess }) => (
    <div className="h-20 bg-white/80 backdrop-blur-md border-b-2 border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => view === 'interview' ? setView('projects') : onBack()} className="p-2 rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-heading font-black text-accent tracking-tight">{title}</h1>
      </div>
      {actionLabel && (
        <div className={`px-4 py-2 rounded-xl font-bold text-sm border-2 flex items-center gap-2 ${isSuccess ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
          {actionIcon} {actionLabel}
        </div>
      )}
    </div>
  );

  if (view === "projects") return (
    <PageWrapper>
      <TopBar 
        title={`Practice Projects — ${langLabel}`} 
        actionLabel={`${solvedCount} / 5 solved`} 
        actionIcon={solvedCount >= 5 ? <CheckCircle size={16}/> : <Lock size={16}/>}
        isSuccess={solvedCount >= 5}
      />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* PROGRESS STRIP */}
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm flex flex-col items-center">
            <h2 className="font-heading font-black text-xl text-accent mb-2">Solve 5 projects to unlock the AI Interview</h2>
            <div className="w-full max-w-lg mt-6">
              <div className="h-4 bg-gray-100 rounded-full border-2 border-gray-200 overflow-hidden mb-4 relative">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((solvedCount / 5) * 100, 100)}%` }} className="h-full bg-primary absolute left-0 top-0" />
              </div>
              <div className="flex justify-between px-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm \${solvedCount > i ? 'bg-success border-success text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {solvedCount > i ? <CheckCircle size={14} /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
            {solvedCount >= 5 && (
              <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={startInterview} className="btn-game btn-primary mt-8 px-8 py-4 text-lg">
                <PlayCircle size={20} className="mr-2"/> Conduct AI Interview Now
              </motion.button>
            )}
          </div>

          {/* PROJECT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map(proj => {
              const st = projectState[proj.id] || { status: "unsolved" };
              const isSolved = st.status === "solved";
              const isReviewing = reviewingId === proj.id;
              const needsRetry = st.status === "needs_retry";

              return (
                <div key={proj.id} className={`bg-white rounded-3xl p-6 border-4 shadow-gamified flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 \${isSolved ? 'border-success' : needsRetry ? 'border-danger' : 'border-gray-200'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white \${language === "python" ? "bg-blue-500" : "bg-indigo-600"}`}>
                        {proj.id + 1}
                      </div>
                      {isSolved && <div className="bg-success text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle size={12}/> SOLVED</div>}
                    </div>
                    <h3 className="font-heading font-black text-lg text-accent mb-2">{proj.title}</h3>
                    <div className={`inline-block border-2 px-3 py-1 rounded-lg text-xs font-bold mb-4 \${diffColor[proj.difficulty]}`}>
                      {proj.difficulty}
                    </div>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
                      {proj.desc}
                    </p>

                    {(isSolved || needsRetry) && (
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3].map(n => <Star key={n} size={16} className={n <= st.stars ? "text-yellow-500 fill-yellow-500" : "text-gray-200 fill-gray-100"} />)}
                        <span className="text-xs text-gray-400 font-bold ml-2 truncate">{st.fileName}</span>
                      </div>
                    )}

                    {st.feedback && (
                      <div className={`p-3 rounded-xl border-2 text-sm font-medium mb-6 \${isSolved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {isSolved ? "✅ " : "⚠️ "}{st.feedback}
                      </div>
                    )}
                  </div>

                  <div>
                    <input type="file" accept={acceptExt} ref={el => (fileInputRefs.current[proj.id] = el)} style={{ display: "none" }} onChange={e => handleFilePicked(proj.id, e)} />
                    <button 
                      disabled={isReviewing} 
                      onClick={() => fileInputRefs.current[proj.id]?.click()} 
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-b-4 \${isReviewing ? 'bg-gray-100 text-gray-400 border-gray-200' : isSolved ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : needsRetry ? 'bg-red-50 text-danger border-red-200 hover:bg-red-100' : 'bg-primary text-white border-[#e08e00] hover:bg-[#e08e00]'}`}
                    >
                      {isReviewing ? <RefreshCw size={16} className="animate-spin"/> : isSolved ? <CheckCircle size={16}/> : needsRetry ? <XCircle size={16}/> : <Upload size={16}/>}
                      {isReviewing ? "Reviewing..." : isSolved ? "Re-upload Solution" : needsRetry ? "Try Again" : "Upload Solution"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  if (view === "interview") return (
    <PageWrapper>
      <TopBar title={`🎤 AI Voice Interview — ${langLabel}`} />
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-2xl bg-white rounded-[2rem] border-4 border-gray-100 shadow-gamified p-10 text-center">
          
          {!interviewResult ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-6xl mb-8">{callState === "starting" ? "⏳" : callState === "connected" ? "🎙️" : "🧠"}</div>
              <h2 className="font-heading font-black text-3xl text-accent mb-4">
                {callState === "starting" ? "Connecting to Agent..." : callState === "connected" ? "Interview in Progress" : "Grading your Interview..."}
              </h2>
              <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed mb-8">
                {callState === "starting" ? "Please ensure your microphone is allowed. The AI will speak shortly."
                  : callState === "connected" ? "Speak naturally. The AI agent will ask you questions about your selected course. It is listening now."
                  : "The agent has ended the call. Please wait a moment while we evaluate your answers and finalize your score."}
              </p>
              
              {callState !== "connected" && (
                <div className="flex justify-center"><RefreshCw className="animate-spin text-primary" size={32} /></div>
              )}

              {callState === "connected" && (
                <div className="flex justify-center relative w-24 h-24 mx-auto">
                  <motion.div animate={{ scale: [1, 2], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 rounded-full bg-primary/20" />
                  <motion.div animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="absolute inset-0 rounded-full bg-primary/30" />
                  <div className="absolute inset-0 rounded-full bg-primary m-6 shadow-gamified" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="text-6xl mb-6">{interviewResult.percentage >= 85 ? "🎉" : "💪"}</div>
              <h2 className={`font-heading font-black text-5xl mb-4 \${interviewResult.percentage >= 85 ? "text-success" : "text-primary"}`}>
                {interviewResult.percentage}% Score
              </h2>
              <p className="text-gray-600 font-medium leading-relaxed max-w-lg mx-auto mb-10 bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                {interviewResult.feedback}
              </p>

              {interviewResult.percentage >= 85 ? (
                <button onClick={async () => {
                  try {
                    await apiRequest(`/api/certificate/${language}/issue`, { method: "POST" });
                    setView("certificate");
                  } catch (err) {
                    alert(`Could not issue certificate: ${err.message}`);
                  }
                }} className="btn-game btn-primary w-full max-w-xs py-4 text-lg mx-auto shadow-gamified">
                  <Award className="mr-2"/> Claim Certificate
                </button>
              ) : (
                <button onClick={startInterview} className="btn-game btn-secondary w-full max-w-xs py-4 text-lg mx-auto shadow-sm">
                  <RefreshCw className="mr-2"/> Retry Interview
                </button>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </PageWrapper>
  );

  if (view === "certificate") return (
    <PageWrapper>
      <TopBar title="Your Certificate" showBack={true} />
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 py-12 overflow-y-auto">
        <div className="w-full max-w-3xl">
          <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }} className="text-center text-4xl mb-8 tracking-[1rem]">
            🎉🏆🎓✨🚀
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] border-8 border-primary p-12 text-center shadow-gamified relative overflow-hidden">
            <ConfettiBurst />
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-100 rounded-full" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-50 rounded-full" />
            
            <div className="relative z-10">
              <Award size={64} className="text-primary mx-auto mb-6" />
              <div className="text-sm font-black tracking-[0.2em] text-gray-400 uppercase mb-6">Certificate of Completion</div>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mb-8" />
              
              <div className="text-gray-500 font-medium mb-2">This certifies that</div>
              <div className="font-heading font-black text-5xl text-accent mb-6">{username}</div>
              <div className="text-gray-500 font-medium mb-6">has successfully completed</div>
              
              <div className="inline-flex items-center gap-3 bg-blue-50 border-2 border-blue-100 px-6 py-3 rounded-full mb-8 shadow-sm">
                <span className="text-2xl">{language === 'python' ? '🐍' : '⚡'}</span>
                <span className="font-bold text-accent text-xl">{language === "python" ? "Python Programming" : "C++ Programming"}</span>
              </div>
              
              <p className="text-gray-500 font-medium mb-12 max-w-lg mx-auto leading-relaxed">
                including <strong className="text-accent">20 progressive levels</strong>, <strong className="text-accent">{solvedCount} practice projects</strong>, and a technical interview scoring <strong className="text-primary">{interviewResult?.percentage}%</strong> on the <strong className="text-accent">CodeMentorX</strong> AI-powered learning platform.
              </p>

              <div className="flex justify-between items-end border-t-2 border-gray-100 pt-8 text-left">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Issued</div>
                  <div className="font-bold text-accent">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={24} className="text-yellow-500 fill-yellow-500" />)}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Issued By</div>
                  <div className="font-bold text-accent">CodeMentorX</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-4 mt-8 justify-center">
            <button onClick={() => window.print()} className="btn-game btn-primary px-8 py-3">
              <Printer size={18} className="mr-2"/> Print / Save PDF
            </button>
            <button onClick={onBack} className="btn-game btn-secondary px-8 py-3">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  return null;
}
