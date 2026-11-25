import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Lock, CheckCircle, LayoutDashboard, X,
  Camera, Trash2, User as UserIcon, Mail, Phone, Calendar,
  ShieldCheck, Eye, EyeOff
} from "lucide-react";
import Certificate from "./Certificate";
import PinkDashboard from "./dashboard/PinkDashboard";
import { apiRequest } from "../utils/api";

// Reads and updates the daily streak in localStorage (same logic as before).
// It is safe to call many times a day: the count only changes once per day.
function touchStreak(username) {
  if (!username) return 0;
  const getKarachiDate = (dateObj) => dateObj.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  const now = new Date();
  const todayStr = getKarachiDate(now);
  const yesterdayStr = getKarachiDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const storageKey = `cmx_streak_${username}`;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    let count = 1;
    if (!stored) count = 12; // keeps the old starting value for existing users
    else if (stored.lastVisit === todayStr) count = stored.count;
    else if (stored.lastVisit === yesterdayStr) count = stored.count + 1;
    localStorage.setItem(storageKey, JSON.stringify({ count, lastVisit: todayStr }));
    return count;
  } catch {
    return 0;
  }
}

function useStreak(username) {
  return useMemo(() => touchStreak(username), [username]);
}

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
}) {
  const [page, setPage] = useState(null); // null | "projects"
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
  function openProfile() {
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
    setShowProfile(true);
  }

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

  const TRACK_LABELS = { python: "🐍 Python Track", cpp: "⚡ C++ Track", java: "☕ Java Track", javascript: "🟨 JavaScript Track", react: "⚛️ React Track" };
  const langLabel = TRACK_LABELS[language] || language;

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
    <>
      {/* New pink / plum dashboard (all the cards, path, mentor and theme toggle) */}
      <PinkDashboard
        username={username}
        language={language}
        profile={profile}
        progress={progress}
        streak={currentStreak}
        onLevelOpen={onLevelOpen}
        onOpenProjects={() => setPage("projects")}
        onOpenProfile={openProfile}
        onOpenAbout={() => setShowAbout(true)}
        onLogout={onLogout}
        onUpdateProfile={onUpdateProfile}
      />

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
    </>
  );
}
