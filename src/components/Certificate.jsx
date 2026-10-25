import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Upload, Lock, Award, PlayCircle, RefreshCw, Star, Printer, XCircle, ShieldCheck, QrCode as QrIcon, ExternalLink, Calendar, Mail, Phone } from "lucide-react";
import QRCode from "qrcode";
import { apiRequest } from "../utils/api";
import codementorLogo from "../assets/codementor-logo.png";

const CONFETTI_COLORS = ["#F49B00", "#25367C", "#2e9d62", "#c62828", "#8e44ad", "#f5c842"];

// Minimum interview score (%) required to pass and unlock the certificate.
const PASS_THRESHOLD = 75;

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

// The server reviews the code against its own copy of the project requirements
// and saves the result itself; the browser never sends a star rating.
async function reviewCodeWithAI(fileContent, fileName, language, projectId) {
  try {
    const data = await apiRequest("/api/ai/review-project", {
      method: "POST",
      body: { code: fileContent, fileName, language, projectId },
    });
    return { ...data, ok: true };
  } catch (err) {
    return { ok: false, stars: 0, feedback: `⚠️ Review failed: ${err.message}` };
  }
}

export default function Certificate({ username = "Student", email = "", profile = {}, language = "python", onBack, initialView = "projects" }) {
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
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [interviewPassed, setInterviewPassed] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const pollingIntervalRef = useRef(null);

  // Generate QR Code pointing to public verification link
  React.useEffect(() => {
    const certNo = certificate?.certificateNumber;
    if (certNo) {
      const frontendBaseUrl = import.meta.env.VITE_APP_URL || "https://codementor-x-frontend.vercel.app";
      const verifyUrl = `${frontendBaseUrl}/verify/${certNo}`;
      QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: "#25367C",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [certificate]);

  // Removes the injected Dograh widget script and tears down any active widget
  // so the interview can never silently restart once it has been completed.
  function teardownDograh() {
    try {
      const w = window.DograhWidget;
      if (w) {
        if (typeof w.endCall === "function") w.endCall();
        if (typeof w.destroy === "function") w.destroy();
        if (typeof w.close === "function") w.close();
      }
    } catch (err) {
      console.error("Error tearing down Dograh widget:", err);
    }
    const existingScript = document.getElementById("dograh-widget");
    if (existingScript) existingScript.remove();
  }

  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      teardownDograh();
    };
  }, []);

  // Rehydrate previously saved projects and interview result so uploads (and a
  // completed interview) persist across navigation instead of resetting to empty.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const progress = await apiRequest(`/api/progress/${language}`, { method: "GET" });
        if (cancelled) return;

        const saved = progress?.solvedProjects || {};
        const restored = {};
        for (const [projId, p] of Object.entries(saved)) {
          restored[projId] = {
            status: (p?.stars || 0) >= 2 ? "solved" : "needs_retry",
            stars: p?.stars || 0,
            feedback: p?.feedback || null,
            fileName: p?.fileName || null,
          };
        }
        setProjectState(restored);

        const iv = progress?.interview;
        if (iv && iv.percentage !== null && iv.percentage !== undefined) {
          if (iv.passed) {
            // Already passed — restore the result and mark it complete so we
            // never re-conduct the interview; the user goes straight to claim.
            setInterviewResult({ percentage: iv.percentage, feedback: iv.feedback });
            setInterviewPassed(true);
            setInterviewCompleted(true);
          } else if (initialView !== "interview") {
            // A past (failed) score — show it, but not when opening straight into
            // a fresh interview, so the stale score doesn't flash over the new call.
            setInterviewResult({ percentage: iv.percentage, feedback: iv.feedback });
          }
        }

        if (progress?.certificate) {
          setCertificate(progress.certificate);
        } else {
          try {
            const certData = await apiRequest(`/api/certificate/${language}`, { method: "GET" });
            if (certData && certData.certificateNumber) {
              setCertificate(certData);
            }
          } catch {
            // Certificate not issued yet
          }
        }
      } catch (err) {
        console.error("Failed to load saved progress:", err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [language, initialView]);

  React.useEffect(() => {
    if (initialView === "interview" && !interviewStarted && !interviewCompleted && !interviewPassed && !certificate) {
      startInterview();
    }
  }, [initialView, interviewStarted, interviewCompleted, interviewPassed, certificate]);

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
      const result = await reviewCodeWithAI(content, file.name, language, projId);
      // The saved (best) result decides whether the project counts as solved;
      // this upload's own rating and feedback are still shown to the student.
      const bestStars = result.ok ? Math.max(result.best?.stars || 0, result.stars) : (projectState[projId]?.stars || 0);
      setProjectState(prev => ({
        ...prev,
        [projId]: {
          status: bestStars >= 2 ? "solved" : "needs_retry",
          fileName: file.name,
          stars: bestStars,
          lastStars: result.stars,
          feedback: result.feedback,
        },
      }));
      setReviewingId(null);
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  const DOGRAH_TOKENS = {
    python: import.meta.env.VITE_DOGRAH_PYTHON_TOKEN || "emb_FZ1Vl_NeqUiqFoYrXbGs3r9TxGPMBaEKuy9s7wGgytE",
    cpp: import.meta.env.VITE_DOGRAH_CPP_TOKEN || "emb_kGxkMJ2Bxt6r5S7e4xMiQW1XMzyuytt4IWNsEm30QvE",
  };

  React.useEffect(() => {
    if (!interviewStarted || interviewCompleted) return;

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
  }, [interviewStarted, language, interviewCompleted]);

  async function startInterview() {
    if (certificate) {
      setView("certificate");
      return;
    }
    // A passed interview is final — never re-conduct it. Send the user straight
    // to the result screen where they can claim their certificate.
    if (interviewPassed || (interviewResult?.percentage || 0) >= PASS_THRESHOLD) {
      setView("interview");
      return;
    }

    setView("interview");
    setInterviewStarted(true);
    setInterviewCompleted(false);
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
      script.setAttribute(
        "data-dograh-context",
        JSON.stringify({
          page_url: window.location.href,
          today: new Date().toISOString().slice(0, 10),
        })
      );
      script.async = true;
      
      script.onload = () => {
        setCallState("connected");
      };

      document.body.appendChild(script);

    } catch (err) {
      console.error("Failed to start interview", err);
      setCallState("idle");
      setInterviewStarted(false);
      const blockers = err?.data?.blockers;
      alert(blockers?.length
        ? `You can't start the interview yet:\n\n• ${blockers.join("\n• ")}`
        : `Failed to connect to the voice agent. ${err?.message || ""}`);
    }
  }

  function pollForGrade() {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const progress = await apiRequest(`/api/interview/progress/${language}`, { method: "GET" });
        if (progress?.interview?.percentage !== null && progress?.interview?.percentage !== undefined) {
          clearInterval(pollingIntervalRef.current);
          // Interview is graded — stop and remove the widget so it can't restart.
          teardownDograh();
          setInterviewCompleted(true);
          setInterviewStarted(false);
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-screen bg-background print:h-auto print:bg-white print:overflow-visible">
      {children}
    </motion.div>
  );

  const TopBar = ({ title, showBack = true, actionLabel, actionIcon, isSuccess }) => (
    <div className="h-20 bg-white/70 backdrop-blur-xl border-b border-[#E8EDF5] flex items-center justify-between px-6 shrink-0 z-20 print:hidden">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => view === 'interview' ? setView('projects') : onBack()} className="p-2 rounded-xl border border-[#E8EDF5] hover:bg-gray-50 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-heading font-black text-accent tracking-tight">{title}</h1>
      </div>
      {actionLabel && (
        <div className={`px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${isSuccess ? 'bg-[#E7F6EE] text-[#2E9D62] border-[#BDE7CE]' : 'bg-[#F0EBFC] text-[#8B6FE8] border-[#E0D5F7]'}`}>
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
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((solvedCount / 5) * 100, 100)}%` }} className="h-full absolute left-0 top-0 rounded-full" style={{ background: "linear-gradient(90deg,#6E8BF5,#9B7DF0)" }} />
              </div>
              <div className="flex justify-between px-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${solvedCount > i ? 'bg-success border-success text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {solvedCount > i ? <CheckCircle size={14} /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
            {solvedCount >= 5 && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => {
                  if (certificate) {
                    setView("certificate");
                  } else if (interviewPassed || (interviewResult?.percentage || 0) >= PASS_THRESHOLD) {
                    setView("interview");
                  } else {
                    startInterview();
                  }
                }}
                className="btn-game btn-cute mt-8 px-8 py-4 text-lg"
              >
                {certificate ? (
                  <><Award size={20} className="mr-2"/> View & Download Certificate</>
                ) : (interviewPassed || (interviewResult?.percentage || 0) >= PASS_THRESHOLD) ? (
                  <><Award size={20} className="mr-2"/> View Result & Claim Certificate</>
                ) : (
                  <><PlayCircle size={20} className="mr-2"/> Conduct AI Interview Now</>
                )}
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
                <div key={proj.id} className={`bg-white rounded-3xl p-6 border-4 shadow-gamified flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isSolved ? 'border-success' : needsRetry ? 'border-danger' : 'border-gray-200'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white ${language === "python" ? "bg-blue-500" : "bg-indigo-600"}`}>
                        {proj.id + 1}
                      </div>
                      {isSolved && <div className="bg-success text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle size={12}/> SOLVED</div>}
                    </div>
                    <h3 className="font-heading font-black text-lg text-accent mb-2">{proj.title}</h3>
                    <div className={`inline-block border-2 px-3 py-1 rounded-lg text-xs font-bold mb-4 ${diffColor[proj.difficulty]}`}>
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
                      <div className={`p-3 rounded-xl border-2 text-sm font-medium mb-6 ${isSolved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {isSolved ? "✅ " : "⚠️ "}{st.feedback}
                      </div>
                    )}
                  </div>

                  <div>
                    <input type="file" accept={acceptExt} ref={el => (fileInputRefs.current[proj.id] = el)} style={{ display: "none" }} onChange={e => handleFilePicked(proj.id, e)} />
                    <button 
                      disabled={isReviewing} 
                      onClick={() => fileInputRefs.current[proj.id]?.click()} 
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-b-4 ${isReviewing ? 'bg-gray-100 text-gray-400 border-gray-200' : isSolved ? 'bg-green-50 text-success border-green-200 hover:bg-green-100' : needsRetry ? 'bg-red-50 text-danger border-red-200 hover:bg-red-100' : 'bg-[#8B6FE8] text-white border-[#7B5FE0] hover:bg-[#7B5FE0]'}`}
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
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-[#E8EDF5] shadow-gamified p-10 text-center">
          
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
                <div className="flex justify-center"><RefreshCw className="animate-spin text-[#8B6FE8]" size={32} /></div>
              )}

              {callState === "connected" && (
                <div className="flex justify-center relative w-24 h-24 mx-auto">
                  <motion.div animate={{ scale: [1, 2], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 rounded-full bg-[#8B6FE8]/20" />
                  <motion.div animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="absolute inset-0 rounded-full bg-[#8B6FE8]/30" />
                  <div className="absolute inset-0 rounded-full bg-[#8B6FE8] m-6 shadow-gamified" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="text-6xl mb-6">{interviewResult.percentage >= PASS_THRESHOLD ? "🎉" : "💪"}</div>
              <h2 className={`font-heading font-black text-5xl mb-2 ${interviewResult.percentage >= PASS_THRESHOLD ? "text-success" : "text-[#8B6FE8]"}`}>
                {interviewResult.percentage}% Score
              </h2>
              <p className={`font-heading font-black text-xl mb-4 ${interviewResult.percentage >= PASS_THRESHOLD ? "text-success" : "text-danger"}`}>
                {interviewResult.percentage >= PASS_THRESHOLD
                  ? "Congratulations — you passed the interview!"
                  : "You did not pass the interview"}
              </p>
              <p className="text-gray-600 font-medium leading-relaxed max-w-lg mx-auto mb-6 bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                {interviewResult.feedback}
              </p>
              <p className="text-gray-500 font-medium max-w-lg mx-auto mb-10">
                {interviewResult.percentage >= PASS_THRESHOLD
                  ? "Your certificate is now unlocked. Claim it below to complete the course."
                  : `You need at least ${PASS_THRESHOLD}% to pass. Review the lessons and your projects, then retake the interview when you're ready — your progress is saved.`}
              </p>

              {interviewResult.percentage >= PASS_THRESHOLD ? (
                <button onClick={async () => {
                  if (certificate) {
                    setView("certificate");
                    return;
                  }
                  try {
                    const cert = await apiRequest(`/api/certificate/${language}/issue`, { method: "POST" });
                    if (cert) setCertificate(cert);
                    setView("certificate");
                  } catch (err) {
                    alert(err?.data?.code === "EMAIL_NOT_VERIFIED"
                      ? "Please verify your email address first. Use the \"Resend email\" button on your dashboard if you can't find the link."
                      : `Could not issue certificate: ${err.message}`);
                  }
                }} className="btn-game btn-cute w-full max-w-xs py-4 text-lg mx-auto shadow-gamified">
                  <Award className="mr-2"/> {certificate ? "View & Download Certificate" : "Claim Certificate"}
                </button>
              ) : (
                <button onClick={startInterview} className="btn-game btn-secondary w-full max-w-xs py-4 text-lg mx-auto shadow-sm">
                  <RefreshCw className="mr-2"/> Retake Interview
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-background overflow-y-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
        {/* Print Stylesheet for 100% Isolated Certificate Print */}
        <style>{`
          @media print {
            @page {
              size: landscape;
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              height: 100% !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden;
            }
            #cmx-certificate-card,
            #cmx-certificate-card * {
              visibility: visible;
            }
            #cmx-certificate-card {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              max-width: none !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 24px 36px !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              border: 8px solid #25367C !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              background: #ffffff !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>

        <div className="w-full max-w-[920px] mx-auto flex flex-col items-center">
          <motion.div animate={{ y: [-3, 3, -3] }} transition={{ duration: 2, repeat: Infinity }} className="text-center text-3xl mb-3 tracking-[0.8rem] print:hidden">
            🎉🏆🎓✨🚀
          </motion.div>

          <motion.div
            id="cmx-certificate-card"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-gradient-to-b from-white via-[#FCFBF7] to-[#F8F9FD] rounded-2xl border-[6px] border-[#25367C] p-6 sm:p-8 text-center shadow-gamified relative overflow-hidden flex flex-col justify-between"
            style={{ aspectRatio: "1.42 / 1", minHeight: "560px" }}
          >
            <div className="print:hidden">
              <ConfettiBurst />
            </div>

            {/* Inner Gold Frame */}
            <div className="absolute inset-2.5 sm:inset-3 border border-[#D4AF37]/60 rounded-xl pointer-events-none" />
            <div className="absolute inset-3.5 sm:inset-4 border border-[#25367C]/15 rounded-lg pointer-events-none" />

            {/* Corner Decorative Accents */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none" />

            {/* Subtle Watermark Accents */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#8B6FE8]/5 rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#F49B00]/5 rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* TOP HEADER */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img src={codementorLogo} alt="CodeMentorX" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg shadow-xs" />
                    <div className="text-left leading-tight">
                      <div className="font-heading font-black text-sm sm:text-base text-[#25367C] tracking-tight">CodeMentor•X</div>
                      <div className="text-[9px] uppercase tracking-widest text-[#8B6FE8] font-bold">Academy of Computing</div>
                    </div>
                  </div>

                  {certificate?.certificateNumber && (
                    <div className="bg-[#25367C]/5 border border-[#25367C]/15 px-3 py-1 rounded-full text-[10px] font-mono text-[#25367C] font-semibold flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-[#2E9D62]" />
                      <span>ID: {certificate.certificateNumber}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="my-2 sm:my-3">
                  <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.25em] text-[#8B6FE8] uppercase">
                    Official Credential of Achievement
                  </div>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-[34px] text-[#25367C] tracking-tight uppercase mt-0.5">
                    Certificate of Completion
                  </h2>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-1.5" />
                </div>

                {/* Recipient */}
                <div className="my-2">
                  <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    This certifies that
                  </div>
                  <div className="font-heading font-black text-3xl sm:text-4xl text-[#1E293B] tracking-tight">
                    {[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || username}
                  </div>

                  {/* Student Details Pill */}
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-medium text-gray-400 mt-1.5">
                    {email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} className="text-[#8B6FE8]" /> {email}
                      </span>
                    )}
                    {profile?.contact && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="text-[#8B6FE8]" /> {profile.contact}
                      </span>
                    )}
                    {profile?.createdAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-[#8B6FE8]" /> Started: {new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Track Statement */}
                <div className="text-xs text-gray-500 font-medium my-2">
                  has demonstrated technical excellence and fulfilled all graduation requirements for
                </div>

                <div className="inline-flex items-center gap-2.5 bg-blue-50/80 border border-blue-100 px-5 py-1.5 rounded-full mb-3 shadow-xs">
                  <span className="text-lg">{language === 'python' ? '🐍' : '⚡'}</span>
                  <span className="font-bold text-[#25367C] text-sm sm:text-base tracking-wide">
                    {language === "python" ? "Python Programming Track" : "C++ Programming Track"}
                  </span>
                </div>

                {/* Competency Badges Strip */}
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto my-2 bg-white/80 border border-gray-200/80 px-3 py-1.5 rounded-xl text-center shadow-xs">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-gray-400">Curriculum</div>
                    <div className="text-xs font-black text-[#25367C]">20/20 Levels</div>
                  </div>
                  <div className="border-x border-gray-200">
                    <div className="text-[9px] uppercase font-bold text-gray-400">Projects</div>
                    <div className="text-xs font-black text-[#25367C]">{solvedCount || 5} Evaluated</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-gray-400">AI Defense</div>
                    <div className="text-xs font-black text-[#2E9D62]">{interviewResult?.percentage || 80}% (Passed)</div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: QR Code, Seal, Date & Issuer */}
              <div className="flex flex-row justify-between items-end border-t border-gray-200/80 pt-3 text-left">
                {/* QR Code & Scan verification */}
                <div className="flex items-center gap-2.5">
                  {qrCodeUrl ? (
                    <div className="p-1 bg-white border border-[#25367C]/20 rounded-lg shadow-xs">
                      <img
                        src={qrCodeUrl}
                        alt="Verification QR Code"
                        className="w-16 h-16 sm:w-18 sm:h-18 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <QrIcon size={22} />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black uppercase text-[#25367C] tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} className="text-[#2E9D62]" /> Scan to Verify
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium leading-tight max-w-[130px]">
                      Tamper-proof digital credential
                    </div>
                    {certificate?.certificateNumber && (
                      <a
                        href={`${import.meta.env.VITE_APP_URL || "https://codementor-x-frontend.vercel.app"}/verify/${certificate.certificateNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B6FE8] hover:underline"
                      >
                        <span>Verify Online</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Stars & Distinction Seal */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F49B00] via-[#E28900] to-[#C97700] flex items-center justify-center text-white shadow-sm mb-1">
                    <Award size={20} />
                  </div>
                  <div className="flex gap-1 mb-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={13} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Verified Authentic
                  </div>
                </div>

                {/* Date & Issuer Signature */}
                <div className="text-right space-y-1">
                  <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date Issued</div>
                    <div className="font-bold text-[#25367C] text-xs">
                      {certificate?.issuedAt
                        ? new Date(certificate.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                        : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Accredited By</div>
                    <div className="font-bold text-[#25367C] text-xs">CodeMentor•X Board</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-4 mt-6 justify-center print:hidden">
            <button onClick={() => window.print()} className="btn-game btn-cute px-8 py-3 shadow-md">
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
