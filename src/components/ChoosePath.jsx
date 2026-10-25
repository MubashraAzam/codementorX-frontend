import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { TRACK_ORDER, TRACK_META } from "../utils/tracks";

/**
 * ChoosePath
 * ----------
 * Shown after successful login or registration.
 * The user picks one of the five tracks (Module 2.1), then confirms to proceed.
 * A sixth card opens the AI Roadmap Generator for other languages (Module 2.4).
 *
 * Props:
 *   username        string  — displayed in the welcome pill
 *   onSelectPath    fn      — called with the updated user after enrolling
 */
export default function ChoosePath({ username = "Student", enrollments = [], onSelectPath, onBack }) {
  const [step, setStep] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preset = searchParams.get("track");
  const [selected, setSelected] = useState(TRACK_META[preset] ? preset : null);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 100),
      setTimeout(() => setStep(2), 400),
      setTimeout(() => setStep(3), 700),
      setTimeout(() => setStep(4), 1100),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  function showToast(msg) {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2800);
  }

  function handleSelect(lang) {
    setSelected(lang);
    const meta = TRACK_META[lang];
    showToast(`${meta.icon} ${meta.label} selected! Click Start Learning to continue.`);
  }

  async function handleConfirm() {
    if (!selected) { showToast("👆 Please pick a track first!"); return; }
    setConfirming(true);
    try {
      // Enrolls in the course (or reopens it) and makes it the active course.
      const user = await apiRequest("/api/courses/enroll", {
        method: "POST",
        body: { language: selected },
      });
      if (onSelectPath) onSelectPath(user);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Floating particles */}
      <div className="cp-particles" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="cp-particle" style={{
            width: 6 + Math.random() * 12,
            height: 6 + Math.random() * 12,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ["#F49B00","#47C4F1","#25367C","#e0473a","#2e9d62"][i % 5],
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* TOP BAR */}
      <div className={`cp-topbar ${step >= 1 ? "show" : ""}`}>
        <div className="cp-logo">
          <div className="cp-logo-box">🎓</div>
          CodeMentor X
        </div>
        {onBack && (
          <button className="cp-user-pill" style={{ cursor: "pointer", border: "none" }} onClick={onBack}>
            ← Back to dashboard
          </button>
        )}
        <div className="cp-user-pill">
          <div className="cp-avatar">{username ? username[0].toUpperCase() : "S"}</div>
          Welcome, {username || "Student"}!
        </div>
      </div>

      {/* HEADLINE */}
      <div className={`cp-headline ${step >= 2 ? "show" : ""}`}>
        <h1>Choose Your <span className="orange">Learning Path</span></h1>
        <p>Pick the programming language you want to master.<br />20 structured levels from beginner to advanced await you.</p>
      </div>

      {/* MAIN */}
      <div className="cp-main">
        {/* TEACHER */}
        <div className={`cp-teacher-col ${step >= 2 ? "show" : ""}`}>
          <div className="cp-teacher-label">👋 Pick your track!</div>
          <TeacherSVG />
        </div>

        {/* CARDS */}
        <div className="cp-cards-row">
          {TRACK_ORDER.map((lang, i) => {
            const meta = TRACK_META[lang];
            return (
              <div
                key={lang}
                className={`cp-path-card ${lang} ${step >= 3 ? "anim" : ""} ${selected === lang ? "selected" : ""}`}
                onClick={() => handleSelect(lang)}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="cp-card-badge">{meta.badge}</div>
                <span className="cp-card-icon">{meta.icon}</span>
                <div className="cp-card-lang">{meta.label}</div>
                <div className="cp-card-tagline">{meta.tagline}</div>
                <div className="cp-levels-strip">
                  {Array.from({ length: 20 }).map((_, j) => <div key={j} className="cp-lvl" />)}
                </div>
                <ul className="cp-features">
                  <li><span className="cp-feat-dot">✓</span>20 progressive levels</li>
                  <li><span className="cp-feat-dot">✓</span>AI lessons &amp; 10-question assessments</li>
                  <li><span className="cp-feat-dot">✓</span>{meta.focus}</li>
                  <li><span className="cp-feat-dot">✓</span>Completion certificate</li>
                </ul>
                <button className="cp-card-btn">
                  {selected === lang ? `✓ ${meta.label} Selected` : enrollments.includes(lang) ? "✓ Enrolled — Continue →" : `Start ${meta.label} Journey →`}
                </button>
              </div>
            );
          })}

          {/* AI ROADMAP GENERATOR — Module 2.4 */}
          <div
            className={`cp-path-card roadmap ${step >= 3 ? "anim" : ""}`}
            onClick={() => navigate("/roadmaps")}
            style={{ animationDelay: `${TRACK_ORDER.length * 0.12}s` }}
          >
            <div className="cp-card-badge">🤖 AI Powered</div>
            <span className="cp-card-icon">🧭</span>
            <div className="cp-card-lang">Other language?</div>
            <div className="cp-card-tagline">Want Go, Kotlin, SQL or anything else? Get a personalised AI learning roadmap.</div>
            <ul className="cp-features">
              <li><span className="cp-feat-dot">✓</span>Concepts in the right order</li>
              <li><span className="cp-feat-dot">✓</span>Exercises &amp; debugging practice</li>
              <li><span className="cp-feat-dot">✓</span>Stage projects &amp; a capstone</li>
            </ul>
            <button className="cp-card-btn">Generate a Roadmap →</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className={`cp-stats-row ${step >= 4 ? "show" : ""}`}>
        {[
          { icon: "👩‍🎓", val: "250k+", lbl: "Students enrolled" },
          { icon: "🏅", val: "20", lbl: "Levels per track" },
          { icon: "🤖", val: "AI", lbl: "Powered lessons" },
          { icon: "🎓", val: "100%", lbl: "Free certificate" },
        ].map((stat, i) => (
          <div key={i} className="cp-stat-chip">
            <div className="cp-stat-icon">{stat.icon}</div>
            <div>
              <div className="cp-stat-val">{stat.val}</div>
              <div className="cp-stat-lbl">{stat.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIRM */}
      <div className={`cp-confirm ${selected ? "show" : ""}`}>
        <button className="cp-confirm-btn" onClick={handleConfirm} disabled={confirming}>
          {confirming ? "Saving your choice..." : "🚀 Start Learning Now!"}
        </button>
      </div>

      <div className="cp-wave" />

      {/* TOAST */}
      <div className={`cp-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
}

function TeacherSVG() {
  return (
    <svg width="200" height="300" viewBox="0 0 140 260" aria-hidden="true" className="cp-teacher-svg">
      <ellipse cx="70" cy="232" rx="36" ry="6" fill="#000" opacity="0.07"/>
      <rect x="46" y="210" width="22" height="10" rx="4" fill="#1a1a2e"/>
      <rect x="72" y="210" width="22" height="10" rx="4" fill="#1a1a2e"/>
      <rect x="48" y="168" width="16" height="44" rx="5" fill="#25367C"/>
      <rect x="76" y="168" width="16" height="44" rx="5" fill="#25367C"/>
      <path d="M34 106 Q33 88 70 84 Q107 88 106 106 L110 172 Q70 182 30 172 Z" fill="#25367C"/>
      <path d="M58 90 L70 108 L82 90" fill="#fff"/>
      <path d="M67 92 L70 100 L73 92 L71.5 97 L70 118 L68.5 97 Z" fill="#F49B00"/>
      <path d="M58 90 L46 116 L60 108 Z" fill="#1a2558"/>
      <path d="M82 90 L94 116 L80 108 Z" fill="#1a2558"/>
      <rect x="20" y="104" width="15" height="54" rx="7" fill="#25367C"/>
      <circle cx="27" cy="160" r="10" fill="#f4c9a0"/>
      <path d="M104 100 Q122 96 128 76 Q130 68 124 65 Q118 63 115 72 Q110 86 100 98Z" fill="#25367C"/>
      <circle cx="126" cy="66" r="10" fill="#f4c9a0"/>
      <rect x="128" y="48" width="28" height="36" rx="3" fill="#e0473a" transform="rotate(-15 128 48)"/>
      <rect x="130" y="50" width="3" height="36" rx="1" fill="#c03428" transform="rotate(-15 128 48)"/>
      <line x1="133" y1="56" x2="152" y2="50" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)"/>
      <line x1="133" y1="62" x2="152" y2="56" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)"/>
      <rect x="63" y="74" width="14" height="14" fill="#f4c9a0"/>
      <circle cx="70" cy="52" r="30" fill="#f4c9a0"/>
      <path d="M41 46 Q40 18 70 16 Q100 18 99 46 L99 34 Q99 22 70 20 Q41 22 41 34Z" fill="#4a3526"/>
      <circle cx="40" cy="54" r="5" fill="#f4c9a0"/>
      <circle cx="100" cy="54" r="5" fill="#f4c9a0"/>
      <ellipse cx="57" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4"/>
      <ellipse cx="83" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4"/>
      <line x1="44" y1="55" x2="35" y2="52" stroke="#2b2b2b" strokeWidth="2.4"/>
      <line x1="96" y1="55" x2="105" y2="52" stroke="#2b2b2b" strokeWidth="2.4"/>
      <circle cx="57" cy="55" r="2.8" fill="#2b2b2b"/>
      <circle cx="83" cy="55" r="2.8" fill="#2b2b2b"/>
      <path d="M48 43 Q57 39 66 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d="M74 43 Q83 39 92 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d="M58 68 Q70 76 82 68" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      {/* speech bubble */}
      <rect x="80" y="2" width="60" height="28" rx="8" fill="#F49B00"/>
      <polygon points="88,30 96,30 92,38" fill="#F49B00"/>
      <text x="110" y="20" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">Choose!</text>
    </svg>
  );
}

const s = {
  page: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    background: "#FCEFE3",
    overflow: "hidden",
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  }
};

const css = `
/* PARTICLES */
.cp-particles{position:absolute;inset:0;pointer-events:none;z-index:0}
.cp-particle{position:absolute;border-radius:50%;opacity:0;animation:cpPartFloat linear infinite}
@keyframes cpPartFloat{0%{opacity:0;transform:scale(0) translateY(0)}30%{opacity:.5}70%{opacity:.4}100%{opacity:0;transform:scale(1.2) translateY(-60px)}}

/* TOP BAR */
.cp-topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 40px;position:relative;z-index:10;opacity:0;transform:translateY(-16px);transition:opacity .5s,transform .5s}
.cp-topbar.show{opacity:1;transform:translateY(0)}
.cp-logo{display:flex;align-items:center;gap:10px;font-family:'Sora','Inter',sans-serif;font-weight:800;font-size:24px;letter-spacing:-.02em;color:#14325D}
.cp-logo-box{width:44px;height:44px;border-radius:12px;background:#fff;box-shadow:0 6px 16px rgba(20,50,93,.12);display:flex;align-items:center;justify-content:center;font-size:24px}
.cp-user-pill{background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.6);border-radius:30px;padding:8px 16px 8px 8px;font-size:13px;font-weight:600;color:#14325D;box-shadow:0 6px 18px rgba(20,50,93,.08);display:flex;align-items:center;gap:8px}
.cp-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F49B00,#e57c00);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}

/* HEADLINE */
.cp-headline{text-align:center;padding:0 8px 0;position:relative;z-index:5;opacity:0;transform:translateY(14px);transition:opacity .6s,transform .6s;margin-bottom:4px}
.cp-headline.show{opacity:1;transform:translateY(0)}
.cp-headline h1{font-family:'Sora','Inter',sans-serif;font-size:clamp(26px,4vw,40px);font-weight:800;color:#14325D;line-height:1.08;letter-spacing:-.02em;margin-bottom:8px;margin-top:0px}
.cp-headline .orange{background:linear-gradient(120deg, #F49B00, #ffca4d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display:inline-block; animation: shimmerText 3s infinite alternate ease-in-out;}
@keyframes shimmerText { 0% { filter: hue-rotate(0deg); transform: scale(1); } 100% { filter: hue-rotate(10deg); transform: scale(1.02); } }
.cp-headline p{font-size:15px;color:#6b6b68;max-width:470px;margin:0 auto;line-height:1.6}

/* MAIN */
.cp-main{display:flex;align-items:flex-end;justify-content:center;gap:28px;padding:10px 32px 0;flex-wrap:wrap;position:relative;z-index:5}

/* TEACHER */
.cp-teacher-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex-shrink:0;opacity:0;transform:translateX(-30px);transition:opacity .7s .5s,transform .7s .5s cubic-bezier(.2,.8,.3,1);margin-left:-50px}
.cp-teacher-col.show{opacity:1;transform:translateX(0)}
.cp-teacher-label{background:#14325D;color:#fff;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;margin-bottom:10px;white-space:nowrap}
.cp-teacher-svg{filter:drop-shadow(0 12px 20px rgba(0,0,0,.15));animation:cpTeacherBob 2.6s ease-in-out infinite alternate 1.5s}
@keyframes cpTeacherBob{from{transform:translateY(0)}to{transform:translateY(-12px)}}

/* CARDS ROW */
.cp-cards-row{display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap;justify-content:center}

/* PATH CARD */
.cp-path-card{width:240px;border-radius:22px;padding:26px 22px;cursor:pointer;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;opacity:0;transform:translateY(60px);transition:transform .32s cubic-bezier(.2,.8,.3,1),box-shadow .32s,opacity .01s}
.cp-path-card.anim{opacity:1;animation:cpCardSlideUp .75s cubic-bezier(.3,1.15,.4,1) forwards}
@keyframes cpCardSlideUp{from{opacity:0;transform:translateY(70px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
.cp-path-card:hover{transform:translateY(-10px) scale(1.025)!important;box-shadow:0 24px 48px rgba(0,0,0,.18)}
.cp-path-card.python{background:linear-gradient(145deg,#1a4a7a,#1e5fa3,#2471c8)}
.cp-path-card.cpp{background:linear-gradient(145deg,#003d78,#00509e,#0067c8)}
.cp-path-card.java{background:linear-gradient(145deg,#7a2e0e,#b5451b,#e76f2e)}
.cp-path-card.javascript{background:linear-gradient(145deg,#8a6d00,#c79a00,#e8b923)}
.cp-path-card.react{background:linear-gradient(145deg,#0b4f63,#0e7490,#14a3c7)}
.cp-path-card.roadmap{background:linear-gradient(145deg,#3d2a7a,#5b3fb5,#8b6fe8)}
.cp-path-card::before{content:'';position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.07);pointer-events:none}
.cp-path-card::after{content:'';position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.05);pointer-events:none}
.cp-path-card.selected{transform:translateY(-14px) scale(1.035)!important;box-shadow:0 28px 56px rgba(0,0,0,.22)}
.cp-path-card.selected .cp-card-btn{background:rgba(255,255,255,.38);border-color:#fff}
.cp-card-badge{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.2);color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;border:1px solid rgba(255,255,255,.35)}
.cp-card-icon{font-size:50px;margin-bottom:12px;display:block;filter:drop-shadow(0 4px 10px rgba(0,0,0,.25))}
.cp-card-lang{font-family:'Sora','Inter',sans-serif;font-size:25px;font-weight:800;letter-spacing:-.02em;color:#fff;margin-bottom:6px}
.cp-card-tagline{font-size:12.5px;color:rgba(255,255,255,.82);margin-bottom:16px;line-height:1.55}
.cp-levels-strip{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.cp-lvl{width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.22)}
.cp-features{list-style:none;margin-bottom:20px;display:flex;flex-direction:column;gap:7px;width:100%}
.cp-features li{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,.9)}
.cp-feat-dot{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
.cp-card-btn{width:100%;padding:11px 0;border-radius:30px;border:2px solid rgba(255,255,255,.65);background:rgba(255,255,255,.14);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s,transform .15s}
.cp-card-btn:hover{background:rgba(255,255,255,.26);border-color:#fff}

/* STATS */
.cp-stats-row{display:flex;justify-content:center;gap:14px;padding:18px 10px;flex-wrap:wrap;opacity:0;transform:translateY(16px);transition:opacity .6s,transform .6s;position:relative;z-index:5}
.cp-stats-row.show{opacity:1;transform:translateY(0)}
.cp-stat-chip{background:rgba(255,255,255,.9);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.6);border-radius:16px;padding:12px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 6px 18px rgba(20,50,93,.07);transition:transform .2s ease,box-shadow .2s ease}
.cp-stat-chip:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(20,50,93,.13)}
.cp-stat-icon{font-size:22px}
.cp-stat-val{font-family:'Sora','Inter',sans-serif;font-size:18px;font-weight:800;letter-spacing:-.01em;color:#14325D}
.cp-stat-lbl{font-size:11px;color:#8a8a86;margin-top:1px;font-weight:500}

/* CONFIRM */
.cp-confirm{text-align:center;padding:8px 32px 28px;opacity:0;transform:translateY(12px);transition:opacity .45s,transform .45s;pointer-events:none;position:relative;z-index:5}
.cp-confirm.show{opacity:1;transform:translateY(0);pointer-events:all}
.cp-confirm-btn{background:linear-gradient(135deg, #F49B00, #ffb330);color:#fff;border:none;padding:14px 44px;border-radius:30px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 6px 0 #cc8100, 0 8px 22px rgba(244,155,0,.35);transition:transform .15s,box-shadow .15s,background .2s;animation:cpPulse 2.2s ease-in-out infinite}
.cp-confirm-btn:hover{background:linear-gradient(135deg, #f09600, #ffa500);transform:translateY(-2px);box-shadow:0 8px 0 #cc8100, 0 12px 28px rgba(244,155,0,.45)}
.cp-confirm-btn:active{transform:translateY(4px);box-shadow:0 0px 0 #cc8100, 0 4px 10px rgba(244,155,0,.3)}
@keyframes cpPulse{0%,100%{filter: drop-shadow(0 0 4px rgba(244,155,0,.35))}50%{filter: drop-shadow(0 0 14px rgba(244,155,0,.58))}}

.cp-wave{position:absolute;bottom:-60px;left:-8%;width:116%;height:160px;background:#fff;border-radius:50%;z-index:1}

/* TOAST */
.cp-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);background:#25367C;color:#fff;padding:12px 28px;border-radius:30px;font-size:14px;font-weight:600;opacity:0;transition:.3s;z-index:100;pointer-events:none;white-space:nowrap}
.cp-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

@media(max-width:680px){
  .cp-teacher-col{display:none}
  .cp-main{padding:16px 20px 0}
  .cp-topbar{padding:16px 20px}
  .cp-path-card{width:min(220px,42vw);padding:18px 14px}
}
`;
