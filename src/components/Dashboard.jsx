import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, HelpCircle, Settings, Award,
  ChevronRight, Zap, Target, Lock, PlayCircle, CheckCircle,
  Crown, LayoutDashboard, Menu, X, Rocket, LogOut, Flame,
  Camera, Trash2, User as UserIcon, Mail, Phone, Calendar,
  ShieldCheck, Eye, EyeOff, BookOpen, Plus
} from "lucide-react";
import Certificate from "./Certificate";
import { apiRequest } from "../utils/api";

function useStreak(username) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!username) return;

    const getKarachiDate = (dateObj) => {
      return dateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
    };

    const now = new Date();
    const todayStr = getKarachiDate(now);
    
    // Yesterday in Karachi
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getKarachiDate(yesterday);

    const storageKey = `cmx_streak_${username}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");

    if (!stored) {
      // First visit starts a streak of 1 day.
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, lastVisit: todayStr }));
      setStreak(1);
    } else {
      const { count, lastVisit } = stored;
      if (lastVisit === todayStr) {
        setStreak(count);
      } else if (lastVisit === yesterdayStr) {
        localStorage.setItem(storageKey, JSON.stringify({ count: count + 1, lastVisit: todayStr }));
        setStreak(count + 1);
      } else {
        localStorage.setItem(storageKey, JSON.stringify({ count: 1, lastVisit: todayStr }));
        setStreak(1);
      }
    }
  }, [username]);

  return streak;
}

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
  blue: "bg-[#E9F0FF] text-[#4F79E8]",
  purple: "bg-[#F0EBFC] text-[#8B6FE8]",
  pink: "bg-[#FCE9F2] text-[#E86FA5]",
  mint: "bg-[#E7F6EE] text-[#2E9D62]",
  gold: "bg-[#FCF3D9] text-[#C8901A]",
};

// Downscale an image file to a square-ish thumbnail and return a JPEG data URL,
// keeping the stored avatar small enough to live in a Mongo string field.
function resizeImage(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatMemberSince(createdAt) {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// Labelled input used throughout the profile settings panel
function Field({ icon, label, hint, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-accent/50 uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-accent/40 font-semibold mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 font-bold text-accent placeholder:text-gray-300 placeholder:font-semibold focus:border-[#9B7DF0] focus:outline-none transition-colors";

export default function Dashboard({
  username = "Student",
  email = "",
  language = "python",
  profile = { firstName: "", lastName: "", dob: "", contact: "", avatarUrl: "", createdAt: "" },
  progress = { doneLevels: [], stars: {}, currentLevel: 0 },
  onLevelOpen,
  onLogout,
  onUpdateProfile,
  enrollments = [],
  emailVerified = true,
  onSwitchCourse,
  onAddCourse,
}) {
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);

  async function resendVerification() {
    setVerifyBusy(true);
    try {
      const res = await apiRequest("/api/auth/resend-verification", { method: "POST" });
      setVerifyMsg(res.message || "Verification email sent.");
    } catch (err) {
      setVerifyMsg(err.message || "Could not send the email.");
    } finally {
      setVerifyBusy(false);
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState(null); // null | "projects"
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const currentStreak = useStreak(username);
  
  // Modal states
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  const emptyForm = {
    firstName: "", lastName: "", username: "", email: "",
    contact: "", dob: "", avatarUrl: "",
    currentPassword: "", newPassword: "", confirmPassword: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [changePassword, setChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Load fresh values into the form each time the panel opens
  useEffect(() => {
    if (showProfile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        username: username || "",
        email: email || "",
        contact: profile.contact || "",
        dob: profile.dob || "",
        avatarUrl: profile.avatarUrl || "",
        currentPassword: "", newPassword: "", confirmPassword: "",
      });
      setProfileMsg({ type: "", text: "" });
      setChangePassword(false);
      setShowPasswords(false);
    }
  }, [showProfile, username, email, profile]);

  // Read an image file, downscale it on a canvas, and store it as a compact data URL
  async function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMsg({ type: "error", text: "Please choose an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Image must be smaller than 5 MB." });
      return;
    }
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeImage(file, 256);
      setForm((f) => ({ ...f, avatarUrl: dataUrl }));
      setProfileMsg({ type: "", text: "" });
    } catch {
      setProfileMsg({ type: "error", text: "Could not process that image." });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleProfileSave() {
    setProfileMsg({ type: "", text: "" });

    // Only send fields the user actually changed, so updating a single field
    // (just the avatar, just the contact, etc.) is a valid partial update.
    const original = {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      username: username || "",
      email: email || "",
      contact: profile.contact || "",
      dob: profile.dob || "",
      avatarUrl: profile.avatarUrl || "",
    };

    const body = {};
    for (const key of Object.keys(original)) {
      // Trim text fields (dob/avatarUrl are left as-is)
      const raw = form[key];
      const next = typeof raw === "string" && key !== "avatarUrl" && key !== "dob" ? raw.trim() : raw;
      if (next !== original[key]) body[key] = next;
    }

    // Validate only the fields that changed
    if ("username" in body && (!body.username || body.username.length < 3)) {
      return setProfileMsg({ type: "error", text: "Username must be at least 3 characters." });
    }
    if ("email" in body && !/^\S+@\S+\.\S+$/.test(body.email)) {
      return setProfileMsg({ type: "error", text: "Please enter a valid email address." });
    }

    // Only touch the password when the user explicitly opened the change-password form
    if (changePassword) {
      if (!form.currentPassword) return setProfileMsg({ type: "error", text: "Enter your current password to change it." });
      if (form.newPassword.length < 8) return setProfileMsg({ type: "error", text: "New password must be at least 8 characters." });
      if (form.newPassword !== form.confirmPassword) return setProfileMsg({ type: "error", text: "New passwords do not match." });
      body.currentPassword = form.currentPassword;
      body.newPassword = form.newPassword;
    }

    if (Object.keys(body).length === 0) {
      return setProfileMsg({ type: "error", text: "No changes to save." });
    }

    setProfileLoading(true);
    try {
      const res = await apiRequest("/api/auth/profile", { method: "PUT", body });
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setChangePassword(false);
      if (onUpdateProfile) onUpdateProfile(res);
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  }

  const levels = language === "python" ? PYTHON_LEVELS : CPP_LEVELS;
  const langLabel = language === "python" ? "🐍 Python Track" : "⚡ C++ Track";
  const { doneLevels, stars, currentLevel } = progress;
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);
  const pct = Math.round((doneLevels.length / 20) * 100);

  useEffect(() => {
    const timeout = setTimeout(() => setDashboardVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  if (page === "projects") {
    return (
      <Certificate
        username={username}
        email={email}
        profile={profile}
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

      {/* SIDEBAR */}
      <motion.div
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="h-full min-w-0 flex flex-col shrink-0 overflow-hidden relative z-20 border-r border-[#EFE7F6]"
        style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#FBF5FC 55%,#F5F0FD 100%)" }}
      >
        <div className="w-[280px] h-full flex flex-col relative">
          {/* cute ambient glows */}
          <div className="pointer-events-none absolute -top-16 -left-10 w-52 h-52 rounded-full bg-[#F9C9E1]/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-24 -right-12 w-48 h-48 rounded-full bg-[#BFD1FB]/40 blur-3xl" />

          {/* BRAND */}
          <div className="p-6 flex items-center gap-3 border-b border-[#EFE7F6] shrink-0 relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#9B7DF0]/30" style={{ background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" }}>
              <LayoutDashboard size={22} strokeWidth={2.5} />
            </div>
            <span className="font-heading font-extrabold text-xl text-accent tracking-tight truncate">CodeMentorX</span>
          </div>

          {/* SCROLLABLE MIDDLE */}
          <div className="px-4 py-5 flex-1 overflow-y-auto space-y-5 min-h-0 relative">
            {/* User Profile Overview */}
            <div className="p-4 rounded-2xl border border-[#EDE7F7] flex items-center gap-3" style={{ background: "linear-gradient(135deg,#EEF3FF,#FCE9F3)" }}>
              <div className="relative shrink-0">
                <div className="w-11 h-11 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-[#9B7DF0]/25 overflow-hidden" style={{ background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" }}>
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={username} className="w-full h-full object-cover" />
                    : username.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#E86FA5] text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {currentLevel + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-accent text-sm truncate">{username}</div>
                <div className="text-xs text-accent/50 font-semibold truncate">{langLabel}</div>
              </div>
            </div>

            {/* MY COURSES — Module 1.3 multi-course enrollment */}
            <SidebarSection icon={<BookOpen size={16} />} title="My Courses" accent="blue">
              <div className="space-y-1.5">
                {enrollments.map((lang) => {
                  const active = lang === language;
                  return (
                    <button
                      key={lang}
                      onClick={() => onSwitchCourse && onSwitchCourse(lang)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${active ? "bg-[#EEF3FF] border border-[#C9D6FB]" : "hover:bg-[#F6F1FB] border border-transparent"}`}
                    >
                      <span className="text-lg shrink-0">{lang === "python" ? "🐍" : "⚡"}</span>
                      <span className="text-xs font-bold text-accent flex-1 min-w-0 truncate">{lang === "python" ? "Python" : "C++"}</span>
                      {active && <span className="text-[10px] font-black uppercase tracking-wide text-[#6E8BF5] shrink-0">Active</span>}
                    </button>
                  );
                })}
                <button
                  onClick={onAddCourse}
                  className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-[#F6F1FB] text-[#8B6FE8] transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#F0EBFC] flex items-center justify-center shrink-0"><Plus size={14} /></span>
                  <span className="text-xs font-bold">Enroll in another course</span>
                </button>
              </div>
            </SidebarSection>

            <SidebarSection icon={<Target size={16} />} title="Your Progress" accent="blue">
              <div className="space-y-3">
                <div className="flex justify-between items-end gap-2">
                  <span className="text-sm font-bold text-accent/60 truncate">Level {currentLevel + 1} of 20</span>
                  <span className="text-[#7B7CF0] font-black text-xl shrink-0">{pct}%</span>
                </div>
                <div className="h-3 bg-[#EEF0F7] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg,#6E8BF5,#9B7DF0)" }}
                  />
                </div>
              </div>
            </SidebarSection>

            <SidebarSection icon={<Award size={16} />} title="Badges & Stars" accent="gold">
              <div className="font-bold text-accent mb-3 flex items-center gap-2 text-sm">
                <Star size={16} className="text-warning fill-warning shrink-0" />
                {totalStars} Total Stars
              </div>
              <div className="space-y-1.5">
                {BADGES.map((b, i) => {
                  const earned = i === 0 && doneLevels.length >= 1;
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F6F1FB] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${earned ? ACCENT_CLASSES[b.accent] : "bg-[#F1F1F6] text-gray-300"}`}>
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
          <div className="p-3 border-t border-[#EFE7F6] shrink-0 space-y-1 relative">
            <SidebarItem icon={<Crown size={18} />} label="Projects" onClick={() => setPage("projects")} tone="default" />
            <SidebarItem icon={<Settings size={18} />} label="Profile Settings" onClick={() => setShowProfile(true)} />
            <SidebarItem icon={<HelpCircle size={18} />} label="About CodeMentorX" onClick={() => setShowAbout(true)} />
            <SidebarItem icon={<LogOut size={18} />} label="Log Out" onClick={onLogout} tone="danger" />
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* TOPBAR */}
        <div className="h-20 bg-white/70 backdrop-blur-xl border-b border-[#E8EDF5] flex items-center justify-between px-6 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-xl border border-[#E8EDF5] bg-white hover:bg-[#F6F1FB] hover:border-[#C9BEF3] text-accent transition-colors shrink-0">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-heading font-extrabold text-accent tracking-tight truncate leading-tight">Learning Dashboard</h1>
              <p className="text-xs text-gray-400 font-semibold truncate hidden sm:block">Welcome back, {username} 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border border-[#F7CFE0] shadow-sm text-[#D65C93]" style={{ background: "linear-gradient(90deg,#FCE9F3,#F3ECFD)" }}>
              <Flame size={18} className="fill-[#EC6FA6] text-[#EC6FA6]" />
              <span className="hidden sm:inline">{currentStreak} Day Streak</span>
              <span className="sm:hidden">{currentStreak}</span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">

            {/* EMAIL VERIFICATION — Module 1.1 */}
            {!emailVerified && (
              <div className="rounded-2xl border-2 border-[#F7D9A8] bg-[#FFF7EA] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FDEBCB] text-[#C77800] flex items-center justify-center shrink-0"><Mail size={20} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-accent">Verify your email address</div>
                  <div className="text-sm text-accent/60 font-medium">
                    {verifyMsg || `We sent a link to ${email}. You need a verified email to claim your certificate.`}
                  </div>
                </div>
                <button onClick={resendVerification} disabled={verifyBusy} className="btn-game btn-secondary text-sm py-2 px-4 shrink-0">
                  {verifyBusy ? "Sending..." : "Resend email"}
                </button>
              </div>
            )}

            {/* KPI STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              <StatCard icon={<CheckCircle size={20} />} tone="mint" value={`${doneLevels.length}/20`} label="Levels Completed" />
              <StatCard icon={<Star size={20} />} tone="gold" value={totalStars} label="Stars Earned" />
              <StatCard icon={<Target size={20} />} tone="blue" value={`${pct}%`} label="Overall Progress" />
              <StatCard icon={<Zap size={20} />} tone="purple" value={currentLevel + 1} label="Current Level" />
            </div>

            {/* CONTINUE BANNER */}
            <motion.div
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#EAE3F6]"
              style={{ background: "linear-gradient(120deg,#EAF1FF 0%,#F1ECFD 50%,#FCE9F3 100%)", boxShadow: "0 20px 44px rgba(126,110,240,0.16)" }}
            >
              {/* decorative glow */}
              <div className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-[#F9C9E1]/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-[#BFD1FB]/45 blur-3xl" />

              <div className="relative flex items-center gap-5 min-w-0">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shrink-0 border border-white shadow-[0_8px_20px_rgba(126,110,240,0.18)]"
                >
                  🚀
                </motion.div>
                <div className="min-w-0">
                  <h2 className="text-[#8B6FE8] text-xs font-bold tracking-widest uppercase mb-1">Continue Learning</h2>
                  <h3 className="text-accent text-xl md:text-2xl font-black font-heading truncate">
                    Level {currentLevel + 1} — {levels[currentLevel]?.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-3 max-w-xs">
                    <div className="h-2 flex-1 bg-white/70 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6E8BF5,#9B7DF0)" }} />
                    </div>
                    <span className="text-accent/70 font-bold text-xs shrink-0">{pct}% done</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onLevelOpen && onLevelOpen(currentLevel)}
                className="btn-game btn-cute w-full md:w-auto relative shrink-0"
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
                          relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 min-w-0 overflow-hidden
                          ${isDone ? 'bg-white border-success/30 shadow-[0_2px_10px_rgba(46,157,98,0.08)] hover:shadow-[0_16px_32px_rgba(46,157,98,0.16)]' : ''}
                          ${isCurrent ? 'bg-gradient-to-br from-[#EEF1FF] to-white border-[#B9C6F8] shadow-[0_12px_30px_rgba(126,110,240,0.20)]' : ''}
                          ${isLocked ? 'bg-[#F5F3FA] border-[#ECE7F4] opacity-70 cursor-not-allowed' : ''}
                          ${!isDone && !isCurrent && !isLocked ? 'bg-white border-[#ECE7F4] shadow-[0_2px_10px_rgba(126,110,240,0.05)] hover:border-[#C9BEF3] hover:shadow-[0_16px_32px_rgba(126,110,240,0.14)]' : ''}
                        `}
                      >
                        {isCurrent && <span className="pointer-events-none absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg,#6E8BF5,#9B7DF0)" }} />}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white ${isDone ? 'bg-success shadow-sm shadow-success/30' : isCurrent ? 'shadow-sm shadow-[#9B7DF0]/30' : isLocked ? '!bg-gray-200 !text-gray-400' : '!bg-[#F0EDF8] !text-accent'}`} style={isCurrent ? { background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" } : undefined}>
                            {i + 1}
                          </span>
                          {isDone && <CheckCircle size={22} className="text-success fill-success/20 shrink-0" />}
                          {isCurrent && <PlayCircle size={22} className="text-[#8B6FE8] fill-[#8B6FE8]/15 shrink-0" />}
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
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#8B6FE8] uppercase tracking-wider bg-[#F0EBFC] px-2 py-1 rounded-md">
                            <Zap size={12} className="fill-[#8B6FE8]" /> Up Next
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
              className="relative overflow-hidden p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 border border-[#EAE3F6]"
              style={{
                background: doneLevels.length === 20
                  ? "linear-gradient(120deg,#FFF6E0 0%,#FCE9F3 50%,#EAF1FF 100%)"
                  : "linear-gradient(120deg,#F6F3FF 0%,#FDF2F8 100%)",
                boxShadow: "0 20px 44px rgba(126,110,240,0.14)"
              }}
            >
              <div className="pointer-events-none absolute -top-16 right-10 w-56 h-56 rounded-full bg-[#F9C9E1]/45 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 left-8 w-52 h-52 rounded-full bg-[#BFD1FB]/40 blur-3xl" />

              <motion.div
                animate={{ y: [0, -6, 0], rotate: doneLevels.length === 20 ? [0, -6, 6, 0] : 0 }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl shrink-0 relative"
              >
                {doneLevels.length === 20 ? '🏆' : '🔒'}
              </motion.div>

              <div className="flex-1 min-w-0 w-full text-center md:text-left relative">
                <h3 className="font-heading font-black text-2xl mb-2 text-accent">
                  {doneLevels.length === 20 ? "You've Mastered the Course!" : "Unlock Your Certificate"}
                </h3>
                <p className="font-semibold mb-4 text-accent/60">
                  {doneLevels.length === 20 ? "Claim your verified CodeMentorX certificate now." : `Complete all 20 levels to earn your certificate. You're ${20 - doneLevels.length} to go!`}
                </p>

                {/* PROGRESS BAR toward the certificate */}
                <div className="mb-5 max-w-md mx-auto md:mx-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-accent/60 flex items-center gap-1.5">
                      <Award size={13} className="text-[#8B6FE8]" /> {doneLevels.length} / 20 levels completed
                    </span>
                    <span className="text-xs font-black text-[#8B6FE8]">{pct}%</span>
                  </div>
                  <div className="h-3.5 rounded-full bg-white/80 border border-white overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full relative"
                      style={{ background: "linear-gradient(90deg,#6E8BF5,#9B7DF0,#E86FA5)" }}
                    >
                      <span className="absolute inset-0 opacity-40 bg-gradient-to-t from-transparent to-white/50" />
                    </motion.div>
                  </div>
                </div>

                <button
                  onClick={() => doneLevels.length === 20 && setPage("projects")}
                  className={`btn-game ${doneLevels.length === 20 ? 'btn-cute' : 'btn-cute'}`}
                  disabled={doneLevels.length !== 20}
                >
                  {doneLevels.length === 20 ? <><Award size={18} /> Claim Certificate</> : <><Lock size={16} /> {20 - doneLevels.length} levels to unlock</>}
                </button>
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl shadow-gamified relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="font-heading font-black text-2xl text-accent">Profile Settings</h2>
                  <p className="text-sm text-accent/40 font-semibold">Manage your personal information and account</p>
                </div>
                <button onClick={() => setShowProfile(false)} className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><X size={18} /></button>
              </div>

              {/* Scrollable body */}
              <div className="px-8 py-6 overflow-y-auto space-y-7">
                {profileMsg.text && (
                  <div className={`p-3.5 rounded-xl text-sm font-bold flex items-center gap-2 ${profileMsg.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {profileMsg.type === "success" ? <CheckCircle size={16} /> : <X size={16} />}
                    {profileMsg.text}
                  </div>
                )}

                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#9B7DF0]/25 overflow-hidden" style={{ background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" }}>
                      {form.avatarUrl
                        ? <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        : (form.firstName?.charAt(0) || form.username?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarBusy}
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-[#EDE7F7] text-[#8B6FE8] flex items-center justify-center shadow-md hover:bg-[#F6F1FB] transition-colors"
                      title="Upload photo"
                    >
                      <Camera size={15} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-accent text-lg truncate">
                      {(form.firstName || form.lastName) ? `${form.firstName} ${form.lastName}`.trim() : form.username}
                    </div>
                    <div className="text-sm text-accent/40 font-semibold mb-2">{avatarBusy ? "Processing image…" : "JPG or PNG, up to 5 MB"}</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarBusy} className="text-xs font-bold text-[#8B6FE8] bg-[#F0EBFC] px-3 py-1.5 rounded-lg hover:bg-[#E6DDFA] transition-colors">Upload</button>
                      {form.avatarUrl && (
                        <button type="button" onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))} className="text-xs font-bold text-danger bg-danger/10 px-3 py-1.5 rounded-lg hover:bg-danger/20 transition-colors flex items-center gap-1">
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal information */}
                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-accent uppercase tracking-wide">
                    <UserIcon size={16} className="text-[#8B6FE8]" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="First name">
                      <input type="text" value={form.firstName} onChange={setField("firstName")} placeholder="Jane" className={inputClass} />
                    </Field>
                    <Field label="Last name">
                      <input type="text" value={form.lastName} onChange={setField("lastName")} placeholder="Doe" className={inputClass} />
                    </Field>
                    <Field icon={<Calendar size={13} />} label="Date of birth">
                      <input type="date" value={form.dob} onChange={setField("dob")} className={inputClass} />
                    </Field>
                    <Field icon={<Phone size={13} />} label="Contact number">
                      <input type="tel" value={form.contact} onChange={setField("contact")} placeholder="+1 555 000 1234" className={inputClass} />
                    </Field>
                  </div>
                </section>

                {/* Account */}
                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-accent uppercase tracking-wide">
                    <Mail size={16} className="text-[#8B6FE8]" /> Account
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field icon={<UserIcon size={13} />} label="Username">
                      <input type="text" value={form.username} onChange={setField("username")} placeholder="janedoe" className={inputClass} />
                    </Field>
                    <Field icon={<Mail size={13} />} label="Email">
                      <input type="email" value={form.email} onChange={setField("email")} placeholder="jane@email.com" className={inputClass} />
                    </Field>
                  </div>
                </section>

                {/* Security */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-black text-accent uppercase tracking-wide">
                      <ShieldCheck size={16} className="text-[#8B6FE8]" /> Security
                    </h3>
                    {changePassword ? (
                      <button type="button" onClick={() => setShowPasswords((s) => !s)} className="flex items-center gap-1 text-xs font-bold text-accent/40 hover:text-accent transition-colors">
                        {showPasswords ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                      </button>
                    ) : null}
                  </div>

                  {!changePassword ? (
                    <button
                      type="button"
                      onClick={() => setChangePassword(true)}
                      className="w-full flex items-center justify-between bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 hover:border-[#EDE7F7] transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-accent">
                        <Lock size={15} className="text-accent/40" /> Password
                      </span>
                      <span className="text-xs font-bold text-[#8B6FE8]">Change</span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-accent/40 font-semibold">Enter your current password, then a new one.</p>
                        <button type="button" onClick={() => { setChangePassword(false); setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" })); }} className="text-xs font-bold text-danger hover:underline">Cancel</button>
                      </div>
                      <Field label="Current password">
                        <input type={showPasswords ? "text" : "password"} value={form.currentPassword} onChange={setField("currentPassword")} placeholder="••••••••" autoComplete="off" className={inputClass} />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="New password">
                          <input type={showPasswords ? "text" : "password"} value={form.newPassword} onChange={setField("newPassword")} placeholder="At least 8 characters" autoComplete="new-password" className={inputClass} />
                        </Field>
                        <Field label="Confirm new password">
                          <input type={showPasswords ? "text" : "password"} value={form.confirmPassword} onChange={setField("confirmPassword")} placeholder="Repeat new password" autoComplete="new-password" className={inputClass} />
                        </Field>
                      </div>
                    </div>
                  )}
                </section>

                {/* Read-only account info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Track</div>
                    <div className="font-bold text-accent">{langLabel}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Member Since</div>
                    <div className="font-bold text-accent">{formatMemberSince(profile.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="flex gap-3 px-8 py-5 border-t border-gray-100 shrink-0">
                <button onClick={() => setShowProfile(false)} className="btn-game btn-secondary flex-1 py-3">Cancel</button>
                <button onClick={handleProfileSave} disabled={profileLoading || avatarBusy} className="btn-game btn-cute flex-1 py-3">
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-gamified relative">
              <button onClick={() => setShowAbout(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full"><X size={18}/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" }}><LayoutDashboard size={22} /></div>
                <h2 className="font-heading font-black text-2xl text-accent">CodeMentorX</h2>
              </div>
              <p className="text-gray-500 font-medium mb-4 leading-relaxed">
                CodeMentorX is an AI-powered gamified learning platform designed to make coding interactive and fun.
                Complete 20 gamified levels, build real-world projects, and pass an AI voice interview to claim your verified certificate.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-[#8B6FE8] mb-6">
                <Star size={16} className="fill-[#8B6FE8]" /> Version 1.0.0
              </div>
              <button onClick={() => setShowAbout(false)} className="btn-game btn-secondary w-full py-3">Got It</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper Components

// KPI stat tile shown in the dashboard header row
function StatCard({ icon, tone = "primary", value, label }) {
  const chip = ACCENT_CLASSES[tone] || ACCENT_CLASSES.primary;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-5 border border-[#EEE9F6] shadow-[0_2px_10px_rgba(126,110,240,0.05)] hover:shadow-[0_16px_32px_rgba(126,110,240,0.12)] transition-shadow"
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${chip}`}>
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-heading font-extrabold text-accent leading-none">{value}</div>
      <div className="text-xs font-semibold text-accent/40 mt-1.5">{label}</div>
    </motion.div>
  );
}

function SidebarSection({ icon, title, accent = "primary", children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-[#EEE9F6] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(126,110,240,0.04)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-[#FAF7FD] transition-colors"
      >
        <div className="flex items-center gap-3 font-bold text-sm text-accent min-w-0">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ACCENT_CLASSES[accent]}`}>
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </div>
        <ChevronRight size={16} className={`text-accent/30 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-[#F0EBF7]">
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
    : "text-accent/70 hover:bg-[#F4EFFB] hover:text-accent";
  const iconClasses = tone === "danger" ? "text-danger" : "text-accent/40";
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
