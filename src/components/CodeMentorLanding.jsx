import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, ArrowRight, PlayCircle, X,
  BookOpen, Mic, Award, CheckCircle2, Sparkles, Star, Code2, Zap, GraduationCap
} from "lucide-react";
import { apiRequest, saveToken } from "../utils/api";
import MentorIllustration from "./MentorIllustration";

const JOURNEY_STEPS = [
  { icon: <BookOpen size={20} />, accent: "primary", title: "Learn", desc: "20 gamified levels of Python or C++, taught by an AI tutor that adapts to your pace." },
  { icon: <Code2 size={20} />, accent: "info", title: "Practice", desc: "Solve real-world projects — an ATM system, a quiz game, a linked list — graded instantly by AI." },
  { icon: <Mic size={20} />, accent: "warning", title: "Interview", desc: "Take a live AI voice interview that asks you about your own code, just like a real technical screen." },
  { icon: <Award size={20} />, accent: "success", title: "Certify", desc: "Pass the interview and claim a verified, shareable Certificate of Completion." },
];

// Full literal class strings — Tailwind's scanner needs these written out.
const ACCENT_CLASSES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
};

export default function CodeMentorLanding({ onLogin, onRegister }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authPanel, setAuthPanel] = useState("login");

  // Login State
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register State
  const [regData, setRegData] = useState({ username: "", email: "", password: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const openAuth = (panel) => { setAuthPanel(panel); setAuthOpen(true); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) return setLoginError("Please fill in all fields");
    setLoginLoading(true);
    setLoginError("");
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST", auth: false, body: loginData
      });
      saveToken(data.token);
      if (onLogin) onLogin(data);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.username || !regData.email || !regData.password) return setRegError("Please fill in all fields");
    setRegLoading(true);
    setRegError("");
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST", auth: false, body: regData
      });
      saveToken(data.token);
      if (onRegister) onRegister(data);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-body">

      {/* FLOATING BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-info/10 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center px-8 py-6 relative z-10 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3 font-heading font-black text-2xl text-accent">
          <div className="bg-white p-1 rounded-xl shadow-gamified w-12 h-12 flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          CodeMentorX
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => openAuth("login")}
            className="btn-game btn-secondary hidden sm:flex"
          >
            Log In
          </button>
          <button
            onClick={() => openAuth("register")}
            className="btn-game btn-primary"
          >
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-100px)] px-6 max-w-7xl mx-auto gap-12 pb-16 lg:pb-0">
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 max-w-2xl text-center lg:text-left pt-12 lg:pt-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-accent font-bold text-sm mb-6 shadow-sm border border-primary/30">
            <Sparkles size={16} className="text-primary" /> The smart way to learn coding
          </div>
          <h1 className="font-heading font-black text-5xl md:text-7xl text-accent leading-[1.1] mb-6">
            Master Code <br/>
            <span className="text-primary relative inline-block">
              With AI Tutors
              <svg className="absolute w-full h-4 -bottom-1 left-0 text-primary/50" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium mb-8 max-w-xl mx-auto lg:mx-0">
            Interactive, gamified programming courses in Python and C++. Learn with an AI tutor, ship real projects,
            ace a live AI voice interview, and walk away with a verified certificate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => openAuth("register")}
              className="btn-game btn-primary text-lg px-8 py-4 w-full sm:w-auto flex justify-center"
            >
              Start Learning Free <ArrowRight className="ml-2"/>
            </button>
            <button
              onClick={() => openAuth("login")}
              className="btn-game btn-secondary text-lg px-8 py-4 w-full sm:w-auto bg-white flex justify-center"
            >
              <PlayCircle className="mr-2"/> I Have an Account
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm font-bold text-gray-400">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"/> No credit card needed</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-info"/> 20+ Interactive Levels</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"/> AI Interview + Certificate</div>
          </div>
        </motion.div>

        {/* HERO VISUAL: mentor pointing at a whiteboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative hidden md:block"
        >
          <div className="relative w-full max-w-lg mx-auto">
            <MentorIllustration className="w-full h-auto drop-shadow-xl" />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-2 left-0 bg-white rounded-2xl px-4 py-3 shadow-gamified border-2 border-gray-100 flex items-center gap-2"
            >
              <span className="text-xl">🐍</span>
              <span className="font-bold text-accent text-sm">Level 12 Cleared!</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute bottom-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-gamified border-2 border-gray-100 flex items-center gap-2"
            >
              <Award size={18} className="text-primary" />
              <span className="font-bold text-accent text-sm">Certificate Ready</span>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* JOURNEY / HOW IT WORKS */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/5 text-accent font-bold text-xs uppercase tracking-widest mb-4">
            <GraduationCap size={14} /> Your Learning Journey
          </div>
          <h2 className="font-heading font-black text-3xl md:text-4xl text-accent mb-3">From First Line to Certified</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">
            Every track follows the same proven path — structured, AI-guided, and backed by proof you actually earned it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {JOURNEY_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-accent text-white text-xs font-black flex items-center justify-center border-4 border-background">
                {i + 1}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${ACCENT_CLASSES[step.accent]}`}>
                {step.icon}
              </div>
              <h3 className="font-heading font-black text-lg text-accent mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI INTERVIEW + CERTIFICATE DEEP DIVE */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* AI Voice Interview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mb-5">
              <Mic size={22} />
            </div>
            <h3 className="font-heading font-black text-2xl text-accent mb-3">Live AI Voice Interview</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">
              Once you've solved 5 AI-reviewed practice projects, you unlock a real conversational interview.
              An AI interviewer talks with you by voice, asks about the decisions behind your own code, and grades
              your answers just like a technical screen at a real company — so the first tough interview isn't
              your first real one.
            </p>
            <ul className="space-y-3">
              {[
                "Speaks with you in real time — no typing required",
                "Questions are generated from the projects you actually built",
                "Instant scoring with detailed feedback after each session",
                "Retry as many times as you need before you're confident",
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm font-semibold text-gray-600">
                  <CheckCircle2 size={18} className="text-warning shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Certificate */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm flex flex-col"
          >
            <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-5">
              <Award size={22} />
            </div>
            <h3 className="font-heading font-black text-2xl text-accent mb-3">A Certificate You Actually Earned</h3>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">
              No quiz-and-done PDF. Your certificate only unlocks after all 20 levels, 5 real projects, and a passed
              AI interview — so it means something when you share it.
            </p>

            {/* mini certificate preview, mirrors the in-app certificate */}
            <div className="mt-auto relative bg-background rounded-2xl border-4 border-primary p-6 text-center overflow-hidden">
              <div className="absolute -top-8 -left-8 w-20 h-20 bg-primary/10 rounded-full" />
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-info/10 rounded-full" />
              <div className="relative">
                <Award size={32} className="text-primary mx-auto mb-2" />
                <div className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase mb-2">Certificate of Completion</div>
                <div className="font-heading font-black text-xl text-accent mb-1">Your Name Here</div>
                <div className="text-xs text-gray-500 font-semibold mb-3">20 levels · 5 projects · AI interview passed</div>
                <div className="flex justify-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-warning fill-warning" />)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-primary to-primaryHover rounded-[2rem] p-10 md:p-14 text-center shadow-gamified"
        >
          <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-accent/10 blur-2xl" />
          <div className="relative">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-accent mb-3">Ready to start your streak?</h2>
            <p className="text-accent/70 font-semibold mb-8 max-w-xl mx-auto">
              Join for free and get your first AI-tutored lesson in under a minute.
            </p>
            <button
              onClick={() => openAuth("register")}
              className="btn-game btn-secondary text-lg px-10 py-4 inline-flex items-center"
            >
              Create Free Account <ArrowRight className="ml-2"/>
            </button>
          </div>
        </motion.div>
      </section>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthOpen(false)}
              className="absolute inset-0 bg-accent/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md relative z-10 shadow-gamified border-4 border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setAuthOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-colors z-20"
              >
                <X size={18}/>
              </button>

              <div className="p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                    {authPanel === "login" ? "👋" : "🚀"}
                  </div>
                  <h2 className="font-heading font-black text-3xl text-accent mb-2">
                    {authPanel === "login" ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-gray-500 font-medium">
                    {authPanel === "login" ? "Ready to continue your streak?" : "Start your coding journey today!"}
                  </p>
                </div>

                {authPanel === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><User size={20}/></div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={loginData.username}
                        onChange={e => setLoginData({...loginData, username: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-12 pr-4 font-bold text-accent focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><Lock size={20}/></div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-12 pr-4 font-bold text-accent focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    {loginError && <p className="text-danger font-bold text-sm text-center">{loginError}</p>}
                    <button type="submit" disabled={loginLoading} className="btn-game btn-primary w-full py-4 text-lg mt-2">
                      {loginLoading ? "Logging in..." : "Log In"}
                    </button>
                    <p className="text-center font-bold text-gray-400 mt-4 text-sm">
                      Don't have an account? <button type="button" onClick={() => setAuthPanel("register")} className="text-primary hover:underline">Sign up</button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><User size={20}/></div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={regData.username}
                        onChange={e => setRegData({...regData, username: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-12 pr-4 font-bold text-accent focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><Mail size={20}/></div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={regData.email}
                        onChange={e => setRegData({...regData, email: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-12 pr-4 font-bold text-accent focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400"><Lock size={20}/></div>
                      <input
                        type="password"
                        placeholder="Create Password"
                        value={regData.password}
                        onChange={e => setRegData({...regData, password: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-12 pr-4 font-bold text-accent focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    {regError && <p className="text-danger font-bold text-sm text-center">{regError}</p>}
                    <button type="submit" disabled={regLoading} className="btn-game btn-primary w-full py-4 text-lg mt-2">
                      {regLoading ? "Creating account..." : "Create Account"}
                    </button>
                    <p className="text-center font-bold text-gray-400 mt-4 text-sm">
                      Already have an account? <button type="button" onClick={() => setAuthPanel("login")} className="text-primary hover:underline">Log in</button>
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
