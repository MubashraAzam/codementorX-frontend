import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, HelpCircle, Settings, Award,
  ChevronRight, Zap, Target, Lock, PlayCircle, CheckCircle,
  Crown, LayoutDashboard, Menu, X, Rocket, LogOut, Flame
} from "lucide-react";
import Certificate from "./Certificate";
import { apiRequest } from "../utils/api";

const PYTHON_LEVELS = [
  { title: "Hello World & Setup", cat: "beginner" },
  { title: "Variables & Types", cat: "beginner" },
  { title: "Input & Output", cat: "beginner" },
  { title: "Conditions", cat: "beginner" },
  { title: "Loops", cat: "beginner" },
  { title: "Functions", cat: "intermediate" },
  { title: "Lists & Arrays", cat: "intermediate" },
  { title: "Strings", cat: "intermediate" },
  { title: "Dictionaries", cat: "intermediate" },
  { title: "File Handling", cat: "intermediate" },
  { title: "Error Handling", cat: "intermediate" },
  { title: "OOP — Classes", cat: "intermediate" },
  { title: "OOP — Inheritance", cat: "intermediate" },
  { title: "Modules", cat: "intermediate" },
  { title: "Problem Solving I", cat: "intermediate" },
  { title: "Recursion", cat: "advanced" },
  { title: "Data Structures", cat: "advanced" },
  { title: "Algorithms", cat: "advanced" },
  { title: "Mini Project", cat: "advanced" },
  { title: "Final Challenge", cat: "advanced" },
];

const CPP_LEVELS = [
  { title: "Setup & First Program", cat: "beginner" },
  { title: "Variables & Types", cat: "beginner" },
  { title: "Input & Output", cat: "beginner" },
  { title: "Conditions", cat: "beginner" },
  { title: "Loops", cat: "beginner" },
  { title: "Functions", cat: "intermediate" },
  { title: "Arrays", cat: "intermediate" },
  { title: "Strings", cat: "intermediate" },
  { title: "Pointers", cat: "intermediate" },
  { title: "File Handling", cat: "intermediate" },
  { title: "Error Handling", cat: "intermediate" },
  { title: "OOP — Classes", cat: "intermediate" },
  { title: "OOP — Inheritance", cat: "intermediate" },
  { title: "Templates", cat: "intermediate" },
  { title: "STL", cat: "intermediate" },
  { title: "Recursion", cat: "advanced" },
  { title: "Data Structures", cat: "advanced" },
  { title: "Algorithms", cat: "advanced" },
  { title: "Mini Project", cat: "advanced" },
  { title: "Final Challenge", cat: "advanced" },
];

const BADGES = [
  { icon: <Rocket size={17} />, name: "First Step", accent: "info" },
  { icon: <Zap size={17} />, name: "Speed Learner", accent: "primary" },
  { icon: <Star size={17} />, name: "Halfway There", accent: "warning" },
  { icon: <Crown size={17} />, name: "Perfectionist", accent: "accent" },
  { icon: <Award size={17} />, name: "Code Master", accent: "success" },
];

// Full literal class strings (Tailwind's scanner needs these written out, not built at runtime)
const ACCENT_CLASSES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
};

export default function Dashboard({
  username = "Student",
  language = "python",
  progress = { doneLevels: [], stars: {}, currentLevel: 0 },
  onLevelOpen,
  onLogout,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState(null); // null | "projects"
  const [realProgress, setRealProgress] = useState(progress);
  const [progressLoading, setProgressLoading] = useState(true);
  const [dashboardVisible, setDashboardVisible] = useState(false);

  const levels = language === "python" ? PYTHON_LEVELS : CPP_LEVELS;
  const langLabel = language === "python" ? "🐍 Python Track" : "⚡ C++ Track";
  const { doneLevels, stars, currentLevel } = realProgress;
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);
  const pct = Math.round((doneLevels.length / 20) * 100);

  useEffect(() => {
    const timeout = setTimeout(() => setDashboardVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    async function loadProgress() {
      setProgressLoading(true);
      try {
        const data = await apiRequest(`/api/progress/${language}`, { method: "GET" });
        setRealProgress({
          doneLevels: data.doneLevels || [],
          stars: data.stars || {},
          currentLevel: data.currentLevel || 0,
        });
      } catch (err) {
        console.error("Failed to load progress:", err.message);
      } finally {
        setProgressLoading(false);
      }
    }
    loadProgress();
  }, [language]);

  if (page === "projects") {
    return (
      <Certificate
        username={username}
        language={language}
        onBack={() => setPage(null)}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-screen w-full overflow-hidden bg-background"
    >
      {progressLoading && (
        <div className="fixed top-4 right-4 z-[999] bg-warning text-accent px-4 py-2 rounded-full font-bold shadow-gamified flex items-center gap-2 text-sm">
          <Zap size={16} className="animate-pulse" /> Loading progress...
        </div>
      )}

      {/* SIDEBAR */}
      <motion.div
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="h-full min-w-0 bg-white border-r-2 border-gray-200 flex flex-col shrink-0 overflow-hidden relative z-20"
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* BRAND */}
          <div className="p-6 flex items-center gap-3 border-b-2 border-gray-100 shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-accent shadow-gamified shrink-0">
              <LayoutDashboard size={22} strokeWidth={2.5} />
            </div>
            <span className="font-heading font-black text-xl text-accent tracking-tight truncate">CodeMentorX</span>
          </div>

          {/* SCROLLABLE MIDDLE */}
          <div className="px-4 py-5 flex-1 overflow-y-auto space-y-5 min-h-0">
            {/* User Profile Overview */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-11 h-11 bg-gradient-to-br from-primary to-primaryHover text-accent rounded-full flex items-center justify-center font-black text-lg shadow-sm">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {currentLevel + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-accent text-sm truncate">{username}</div>
                <div className="text-xs text-gray-500 font-semibold truncate">{langLabel}</div>
              </div>
            </div>

            <SidebarSection icon={<Target size={16} />} title="Your Progress" accent="primary">
              <div className="space-y-3">
                <div className="flex justify-between items-end gap-2">
                  <span className="text-sm font-bold text-gray-600 truncate">Level {currentLevel + 1} of 20</span>
                  <span className="text-primary font-black text-xl shrink-0">{pct}%</span>
                </div>
                <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-primaryHover rounded-full"
                  />
                </div>
              </div>
            </SidebarSection>

            <SidebarSection icon={<Award size={16} />} title="Badges & Stars" accent="warning">
              <div className="font-bold text-accent mb-3 flex items-center gap-2 text-sm">
                <Star size={16} className="text-warning fill-warning shrink-0" />
                {totalStars} Total Stars
              </div>
              <div className="space-y-1.5">
                {BADGES.map((b, i) => {
                  const earned = i === 0 && doneLevels.length >= 1;
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${earned ? ACCENT_CLASSES[b.accent] : "bg-gray-100 text-gray-300"}`}>
                        {b.icon}
                      </div>
                      <span className={`text-xs font-bold flex-1 min-w-0 truncate ${earned ? "text-accent" : "text-gray-400"}`}>{b.name}</span>
                      {earned ? <CheckCircle size={15} className="text-success shrink-0" /> : <Lock size={15} className="text-gray-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </SidebarSection>
          </div>

          {/* PINNED FOOTER NAV */}
          <div className="p-3 border-t-2 border-gray-100 shrink-0 space-y-1">
            <SidebarItem icon={<Settings size={18} />} label="Profile Settings" onClick={() => {}} />
            <SidebarItem icon={<HelpCircle size={18} />} label="About CodeMentorX" onClick={() => {}} />
            <SidebarItem icon={<LogOut size={18} />} label="Log Out" onClick={onLogout} tone="danger" />
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* TOPBAR */}
        <div className="h-20 bg-white/80 backdrop-blur-md border-b-2 border-gray-200 flex items-center justify-between px-8 shrink-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors shrink-0">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-heading font-black text-accent tracking-tight hidden sm:block truncate">Learning Dashboard</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-warning/15 text-warning px-4 py-2 rounded-xl font-bold text-sm">
              <Flame size={18} className="fill-warning" /> 12 Day Streak
            </div>
          </div>
        </div>

        {/* SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* CONTINUE BANNER */}
            <motion.div
              whileHover={{ y: -3 }}
              className="relative overflow-hidden bg-gradient-to-br from-primary to-primaryHover rounded-3xl p-8 shadow-gamified flex flex-col md:flex-row items-center justify-between gap-6"
            >
              {/* decorative glow */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />

              <div className="relative flex items-center gap-6 min-w-0">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner"
                >
                  🚀
                </motion.div>
                <div className="min-w-0">
                  <h2 className="text-accent/70 text-xs font-bold tracking-widest uppercase mb-1">Continue Learning</h2>
                  <h3 className="text-accent text-2xl font-black font-heading truncate">
                    Level {currentLevel + 1} — {levels[currentLevel]?.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 max-w-xs">
                    <div className="h-2 flex-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-accent font-bold text-xs shrink-0">{pct}% done</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onLevelOpen && onLevelOpen(currentLevel)}
                className="btn-game btn-secondary w-full md:w-auto relative shrink-0"
              >
                Resume Course <ChevronRight size={18} />
              </button>
            </motion.div>

            {/* LEVEL GRIDS */}
            {[
              { key: "beginner", label: "Beginner Stage", range: "Levels 1–5", accent: "success" },
              { key: "intermediate", label: "Intermediate Stage", range: "Levels 6–15", accent: "warning" },
              { key: "advanced", label: "Advanced Stage", range: "Levels 16–20", accent: "accent" }
            ].map(group => (
              <div key={group.key} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg font-heading font-black text-xs uppercase tracking-wider shrink-0 ${ACCENT_CLASSES[group.accent]}`}>
                    {group.label}
                  </span>
                  <span className="text-xs font-bold text-gray-400 shrink-0">{group.range}</span>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {levels.map((l, i) => {
                    if (l.cat !== group.key) return null;
                    const isDone = doneLevels.includes(i);
                    const isCurrent = i === currentLevel;
                    const isLocked = i > currentLevel && !isDone;
                    const starCount = stars[i] || 0;
                    
                    return (
                      <motion.div
                        key={i}
                        whileHover={!isLocked ? { y: -6 } : {}}
                        whileTap={!isLocked ? { y: 0 } : {}}
                        onClick={() => !isLocked && onLevelOpen && onLevelOpen(i)}
                        className={`
                          relative p-6 rounded-3xl border-2 cursor-pointer transition-shadow min-w-0
                          ${isDone ? 'bg-success/5 border-success shadow-[0_6px_0_0_#4CAF50]' : ''}
                          ${isCurrent ? 'bg-white border-primary shadow-[0_6px_0_0_#F6C445] animate-pulse-border' : ''}
                          ${isLocked ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed shadow-none' : ''}
                          ${!isDone && !isCurrent && !isLocked ? 'bg-white border-gray-200 shadow-[0_6px_0_0_#e5e7eb]' : ''}
                        `}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isDone ? 'bg-success/15 text-success' : isCurrent ? 'bg-primary/15 text-primary' : 'bg-gray-200/70 text-gray-400'}`}>
                            {i + 1}
                          </span>
                          {isDone && <CheckCircle size={22} className="text-success fill-success/20 shrink-0" />}
                          {isCurrent && <PlayCircle size={22} className="text-primary fill-primary/20 shrink-0" />}
                          {isLocked && <Lock size={18} className="text-gray-400 shrink-0" />}
                        </div>

                        <h4 className={`font-bold text-[15px] leading-snug mb-4 line-clamp-2 ${isLocked ? 'text-gray-500' : 'text-accent'}`}>
                          {l.title}
                        </h4>

                        {isDone && (
                          <div className="flex gap-1">
                            {[1, 2, 3].map(n => (
                              <Star key={n} size={16} className={n <= starCount ? "text-warning fill-warning" : "text-gray-300 fill-gray-200"} />
                            ))}
                          </div>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-md">
                            <Zap size={12} className="fill-primary" /> Up Next
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* CERTIFICATE BANNER */}
            <motion.div
              className={`relative overflow-hidden p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-8 ${doneLevels.length === 20 ? 'bg-gradient-to-r from-primary/15 via-primary/5 to-warning/15 border-primary shadow-gamified' : 'bg-gray-50 border-dashed border-gray-300'}`}
            >
              <div className="text-6xl shrink-0">{doneLevels.length === 20 ? '🏆' : '🔒'}</div>
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h3 className="font-heading font-black text-2xl text-accent mb-2">
                  {doneLevels.length === 20 ? "You've Mastered the Course!" : "Unlock Your Certificate"}
                </h3>
                <p className="text-gray-500 font-semibold mb-4">
                  {doneLevels.length === 20 ? "Claim your verified CodeMentorX certificate now." : `Complete all 20 levels. You are ${20 - doneLevels.length} levels away.`}
                </p>
                <button
                  onClick={() => doneLevels.length === 20 && setPage("projects")}
                  className={`btn-game ${doneLevels.length === 20 ? 'btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed border-none'}`}
                  disabled={doneLevels.length !== 20}
                >
                  {doneLevels.length === 20 ? "Claim Certificate" : "Locked"}
                </button>
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper Components
function SidebarSection({ icon, title, accent = "primary", children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 font-bold text-sm text-accent min-w-0">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ACCENT_CLASSES[accent]}`}>
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </div>
        <ChevronRight size={16} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t-2 border-gray-50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, onClick, tone = "default" }) {
  const toneClasses = tone === "danger"
    ? "text-danger hover:bg-danger/10"
    : "text-gray-600 hover:bg-gray-50";
  const iconClasses = tone === "danger" ? "text-danger" : "text-gray-400";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${toneClasses}`}
    >
      <span className={`shrink-0 ${iconClasses}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
