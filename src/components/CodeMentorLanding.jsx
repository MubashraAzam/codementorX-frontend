import React, { useState, useEffect, useRef } from "react";
import { FaGoogle, FaFacebook, FaGithub, FaLinkedin } from "react-icons/fa";
import { apiRequest, saveToken } from "../utils/api";
import codementorLogo from "../assets/codementor-logo.png";

/* ------------------------------------------------------------------ */
/* Validation helpers (unchanged logic)                                */
/* ------------------------------------------------------------------ */

const createFieldState = (value = "", touched = false, valid = false, error = "") => ({
  value,
  touched,
  valid,
  error,
});

const createLoginValidationState = () => ({
  username: createFieldState(),
  password: createFieldState(),
});

const createRegisterValidationState = () => ({
  username: createFieldState(),
  email: createFieldState(),
  password: createFieldState(),
  passwordStrength: "",
});

const validateUsername = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Username is required." };
  if (trimmed.length < 3) return { valid: false, error: "Username must contain at least 3 characters." };
  return { valid: true, error: "" };
};

const validateEmail = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Email is required." };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) return { valid: false, error: "Please enter a valid email address." };
  return { valid: true, error: "" };
};

const validatePassword = (value, isRegister) => {
  if (!value) return { valid: false, error: "Password is required." };
  if (value.length < 8) return { valid: false, error: "Password must be at least 8 characters." };
  if (!isRegister) return { valid: true, error: "" };
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return { valid: false, error: "Use 8+ chars with upper, lower, number, and special character." };
  }
  return { valid: true, error: "" };
};

const calculateStrength = (value) => {
  if (!value) return "";
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score += 1;
  if (score < 2) return "weak";
  if (score === 2 || score === 3) return "medium";
  return "strong";
};

const getInputStatus = (fieldState) => {
  if (!fieldState.touched) return "";
  return fieldState.valid ? "valid" : "invalid";
};

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: "mentor",
    title: "An AI mentor that's always on",
    body: "Ask questions at 2am or during a lunch break. Your mentor explains concepts, reviews your code, and adapts to how you learn.",
    colSpan: 2,
  },
  {
    icon: "practice",
    title: "Practice on real problems",
    body: "Every lesson ends with a hands-on exercise you run yourself, not a multiple-choice quiz. You learn by writing code that works.",
    colSpan: 1,
  },
  {
    icon: "track",
    title: "See your progress take shape",
    body: "A running view of what you've mastered and what's next, so you always know the next concept worth tackling.",
    colSpan: 1,
  },
  {
    icon: "path",
    title: "A path built for beginners",
    body: "No assumed background. Each track starts from first principles and builds toward projects you can point to.",
    colSpan: 2,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a language",
    body: "Start with Python if you want momentum, or C++ if you want to understand what's happening under the hood.",
  },
  {
    n: "02",
    title: "Work through guided lessons",
    body: "Short explanations, immediately followed by a problem you solve in the built-in editor.",
  },
  {
    n: "03",
    title: "Ask your mentor when you're stuck",
    body: "Get a nudge in the right direction instead of the answer outright, so the concept actually sticks.",
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CodeMentorLanding({ onLogin, onRegister }) {
  const [step, setStep] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authPanel, setAuthPanel] = useState("login");
  const [scrolled, setScrolled] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [regData, setRegData] = useState({ username: "", email: "", password: "" });
  const [loginValidation, setLoginValidation] = useState(createLoginValidationState);
  const [regValidation, setRegValidation] = useState(createRegisterValidationState);
  const [loginError, setLoginError] = useState("");
  const [regError, setRegError] = useState("");
  const loginUsernameRef = useRef(null);
  const regUsernameRef = useRef(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 250),
      setTimeout(() => setStep(2), 750),
      setTimeout(() => setStep(3), 1150),
      setTimeout(() => setStep(4), 1500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (authOpen) {
      document.body.style.overflow = "hidden";
      if (authPanel === "login") loginUsernameRef.current?.focus();
      else regUsernameRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [authOpen, authPanel]);

  const openAuth = (panel) => { setAuthPanel(panel); setAuthOpen(true); };
  const closeAuth = () => setAuthOpen(false);

  const scrollToSection = (id) => {
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isLoginValid = loginValidation.username.valid && loginValidation.password.valid;
  const isRegisterValid = regValidation.username.valid && regValidation.email.valid && regValidation.password.valid;

  const handleLoginChange = (e) => {
    const { name: field, value } = e.target;
    setLoginData((prev) => ({ ...prev, [field]: value }));
    const validation = field === "username" ? validateUsername(value) : validatePassword(value, false);
    setLoginValidation((prev) => ({ ...prev, [field]: { ...prev[field], value, touched: true, ...validation } }));
    setLoginError("");
  };

  const handleRegChange = (e) => {
    const { name: field, value } = e.target;
    setRegData((prev) => ({ ...prev, [field]: value }));
    let validation;
    if (field === "username") validation = validateUsername(value);
    else if (field === "email") validation = validateEmail(value);
    
    if (field === "password") {
      const strength = calculateStrength(value);
      const passwordValidation = validatePassword(value, true);
      setRegValidation((prev) => ({
        ...prev,
        password: { ...prev.password, value, touched: true, ...passwordValidation },
        passwordStrength: strength,
      }));
    } else {
      setRegValidation((prev) => ({ ...prev, [field]: { ...prev[field], value, touched: true, ...validation } }));
    }
    setRegError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const usernameValidation = validateUsername(loginData.username);
    const passwordValidation = validatePassword(loginData.password, false);
    setLoginValidation((prev) => ({
      username: { ...prev.username, touched: true, ...usernameValidation },
      password: { ...prev.password, touched: true, ...passwordValidation },
    }));
    if (!usernameValidation.valid || !passwordValidation.valid) return;

    setAuthLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { username: loginData.username, password: loginData.password },
      });
      saveToken(data.token);
      if (onLogin) onLogin(data);
    } catch (err) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const usernameValidation = validateUsername(regData.username);
    const emailValidation = validateEmail(regData.email);
    const passwordValidation = validatePassword(regData.password, true);

    setRegValidation((prev) => ({
      ...prev,
      username: { ...prev.username, touched: true, ...usernameValidation },
      email: { ...prev.email, touched: true, ...emailValidation },
      password: { ...prev.password, touched: true, ...passwordValidation },
    }));
    if (!usernameValidation.valid || !emailValidation.valid || !passwordValidation.valid) return;

    setAuthLoading(true);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { username: regData.username, email: regData.email, password: regData.password },
      });
      saveToken(data.token);
      if (onRegister) onRegister(data);
    } catch (err) {
      setRegError(err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const switchAuthPanel = (panel, e) => {
    e.preventDefault();
    setAuthPanel(panel);
  };

  return (
    <div style={s.page}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
      />
      <style>{css}</style>

      {/* AMBIENT BACKGROUND */}
      <div className="cmx-ambient-bg">
        <div className="cmx-orb orb-1" />
        <div className="cmx-orb orb-2" />
        <div className="cmx-orb orb-3" />
      </div>

      {/* ============================= NAV ============================= */}
      <div className={`cmx-nav ${scrolled ? "scrolled" : ""}`}>
        <button type="button" className="cmx-logo" onClick={() => scrollToSection("home")}>
          <span className="cmx-diamond"><img src={codementorLogo} alt="CodeMentor-X logo" /></span>
          <b>CodeMentor-X</b>
        </button>
        <div className="cmx-nav-links">
          <button type="button" className="cmx-nav-link" onClick={() => scrollToSection("features")}>Features</button>
          <button type="button" className="cmx-nav-link" onClick={() => scrollToSection("languages")}>Languages</button>
          <button type="button" className="cmx-nav-link" onClick={() => scrollToSection("how-it-works")}>How it works</button>
          <button type="button" className="cmx-nav-link" onClick={() => scrollToSection("about")}>About</button>
        </div>
        <div className="cmx-nav-actions">
          <button className="cmx-nbtn login" onClick={() => openAuth("login")}>Log in</button>
          <button className="cmx-nbtn signup" onClick={() => openAuth("register")}>Start learning</button>
        </div>
      </div>

      {/* ============================= HERO ============================= */}
      <section id="home" className="cmx-hero-section">
        <div className={`cmx-star s1 ${step >= 1 ? "show" : ""}`}>✨</div>
        <div className={`cmx-star s2 ${step >= 1 ? "show" : ""}`}>✨</div>
        <div className={`cmx-star s3 ${step >= 1 ? "show" : ""}`}>⭐</div>

        <div className="cmx-hero-grid">
          <div className={`cmx-hero-copy ${step >= 1 ? "show" : ""}`}>
            <span className="cmx-eyebrow">AI-guided programming education</span>
            <h1>
              Learn to code <b>with a mentor</b><br />that never clocks out
            </h1>
            <p>
              CodeMentor-X pairs short, focused lessons with an AI mentor that explains,
              reviews, and nudges — so practice actually turns into skill.
            </p>
            <div className="cmx-hero-cta">
              <button className="cmx-join" onClick={() => openAuth("register")}>Start learning free</button>
              <button className="cmx-ghost" onClick={() => scrollToSection("how-it-works")}>See how it works →</button>
            </div>
            <div className="cmx-trust">
              <div className="cmx-avatars">
                 <div className="cmx-av a1">👩</div><div className="cmx-av a2">🧑</div><div className="cmx-av a3">🧔</div>
              </div>
              <span>Join over <b>250k+</b> students building real projects</span>
            </div>
          </div>

          <div className={`cmx-hero-visual ${step >= 2 ? "show" : ""}`}>
            <div className="cmx-mascot-group">
                <ClassroomSceneSVG step={step} />
                
                {/* Floating elements */}
                <div className={`cmx-float-card fc-1 ${step >= 4 ? "show" : ""}`}>🏆 +50 XP Earned</div>
                <div className={`cmx-float-card fc-2 ${step >= 4 ? "show" : ""}`}>🐍 Python Master</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= VALUE STRIP ========================== */}
      <section className="cmx-strip glass">
        <div className="cmx-strip-item"><b>Always available</b><span>Your mentor doesn't keep office hours</span></div>
        <div className="cmx-strip-div" />
        <div className="cmx-strip-item"><b>Learn by doing</b><span>Every concept ends in a real exercise</span></div>
        <div className="cmx-strip-div" />
        <div className="cmx-strip-item"><b>Built for beginners</b><span>No prior experience assumed</span></div>
      </section>

      {/* ============================ FEATURES =========================== */}
      <section id="features" className="cmx-section">
        <div className="cmx-section-head">
          <span className="cmx-eyebrow dark">Why CodeMentor-X</span>
          <h2>Everything you need to go from curious to capable</h2>
        </div>
        <div className="cmx-bento-grid">
          {FEATURES.map((f, i) => (
            <div className={`cmx-bento-card span-${f.colSpan} glass`} key={f.title}>
              <div className="cmx-feature-icon"><FeatureIcon kind={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================== LANGUAGES =========================== */}
      <section id="languages" className="cmx-section alt glass-section">
        <div className="cmx-section-head">
          <span className="cmx-eyebrow dark">Languages</span>
          <h2>Start where it makes sense for you</h2>
        </div>
        <div className="cmx-lang-grid">
          <div className="cmx-lang-card py glass">
            <div className="cmx-lang-top">
              <span className="cmx-lang-icon">🐍</span>
              <span className="cmx-lang-tag">Beginner friendly</span>
            </div>
            <h3>Python</h3>
            <p>A versatile, readable language used across web development, automation, data
              science, and machine learning. Its simple syntax makes it one of the best
              starting points for new programmers.</p>
            <button className="cmx-lang-cta" onClick={() => openAuth("register")}>Start Python →</button>
          </div>
          <div className="cmx-lang-card cpp glass">
            <div className="cmx-lang-top">
              <span className="cmx-lang-icon">⚡</span>
              <span className="cmx-lang-tag">High performance</span>
            </div>
            <h3>C++</h3>
            <p>A powerful, high-performance language behind system software, game engines,
              embedded systems, and competitive programming. Learn it to understand what's
              really happening under the hood.</p>
            <button className="cmx-lang-cta" onClick={() => openAuth("register")}>Start C++ →</button>
          </div>
        </div>
        <div className="cmx-lang-soon">
          <span>More languages on the way</span>
          <div className="cmx-soon-pills">
            <span className="cmx-pill glass">JavaScript</span>
            <span className="cmx-pill glass">Java</span>
            <span className="cmx-pill glass">Rust</span>
            <span className="cmx-pill glass">Go</span>
          </div>
        </div>
      </section>

      {/* ========================= HOW IT WORKS =========================== */}
      <section id="how-it-works" className="cmx-section">
        <div className="cmx-section-head">
          <span className="cmx-eyebrow dark">How it works</span>
          <h2>Three steps, then you're writing real code</h2>
        </div>
        <div className="cmx-steps">
          {STEPS.map((st, i) => (
            <React.Fragment key={st.n}>
              <div className="cmx-step glass">
                <span className="cmx-step-n">{st.n}</span>
                <h3>{st.title}</h3>
                <p>{st.body}</p>
              </div>
              {i < STEPS.length - 1 && <div className="cmx-step-connector" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ============================= ABOUT ============================= */}
      <section id="about" className="cmx-section alt cmx-about glass-section">
        <div className="cmx-about-grid">
          <div>
            <span className="cmx-eyebrow dark">About</span>
            <h2>An interactive learning space, not another video library</h2>
            <p>
              CodeMentor-X is your interactive learning space for mastering programming with
              confidence, clarity, and real-world practice. We help beginners and aspiring
              developers learn efficiently, build real projects, and grow step by step —
              combining AI-guided support with hands-on exploration for a smarter, more
              personal way to learn.
            </p>
          </div>
          <div className="cmx-about-card glass" style={{ padding: 0, overflow: "hidden", border: "none" }}>
            <div className="cmx-ide-card relative-ide">
              <div className="cmx-ide-bar">
                <span className="dot r" /><span className="dot y" /><span className="dot g" />
                <span className="cmx-ide-file">mentor.py</span>
              </div>
              <pre className="cmx-ide-body">
                <span className="tok-kw">def</span> <span className="tok-fn">greet</span>(<span className="tok-var">name</span>):{"\n"}
                {"    "}<span className="tok-kw">return</span> <span className="tok-str">f"Hey {"{name}"}, ready to build?"</span>{"\n\n"}
                <span className="tok-var">student</span> = <span className="tok-str">"you"</span>{"\n"}
                <span className="tok-fn">print</span>(<span className="tok-fn">greet</span>(<span className="tok-var">student</span>)){"\n"}
                <span className="tok-cm"># → Hey you, ready to build?</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== CTA =============================== */}
      <section className="cmx-cta glass">
        <h2>Your first lesson takes five minutes.</h2>
        <p>Create a free account and pick up right where the tutorials leave off.</p>
        <button className="cmx-join light" onClick={() => openAuth("register")}>Create free account</button>
      </section>

      {/* ============================= FOOTER ============================= */}
      <footer id="contact" className="cmx-footer">
        <div className="cmx-footer-top">
          <div className="cmx-footer-brand">
            <span className="cmx-diamond small"><img src={codementorLogo} alt="CodeMentor-X logo" /></span>
            <b>CodeMentor-X</b>
          </div>
          <div className="cmx-footer-cols">
            <div>
              <h4>Product</h4>
              <button onClick={() => scrollToSection("features")}>Features</button>
              <button onClick={() => scrollToSection("languages")}>Languages</button>
              <button onClick={() => scrollToSection("how-it-works")}>How it works</button>
            </div>
            <div>
              <h4>Company</h4>
              <button onClick={() => scrollToSection("about")}>About</button>
              <button onClick={() => openAuth("login")}>Log in</button>
              <button onClick={() => openAuth("register")}>Sign up</button>
            </div>
            <div>
              <h4>Contact</h4>
              <a href="mailto:mubashraazam315@gmail.com">mubashraazam315@gmail.com</a>
              <a href="tel:03347429296">0334 7429296</a>
            </div>
          </div>
        </div>
        <div className="cmx-footer-bottom">
          <span>© {new Date().getFullYear()} CodeMentor-X. All rights reserved.</span>
          <div className="cmx-footer-social">
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer"><i className="bx bxl-github" /><FaGithub/></a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer"><i className="bx bxl-linkedin" /><FaLinkedin/></a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer"><i className="bx bxl-facebook" /><FaFacebook/></a>
          </div>
        </div>
      </footer>

      {/* ============================ AUTH OVERLAY ========================== */}
      {authOpen && (
        <div className="cmx-auth glass-modal" role="dialog" aria-modal="true">
          <button className="cmx-close" onClick={closeAuth} aria-label="Close">✕</button>
          <div className="cmx-swap-wrap glass">
            <div className="cmx-auth-side">
              <AuthCharSVG />
              <p className="cmx-side-text">With a click<br />your coding mentor<br />will be ready!</p>
            </div>

            <div className={`cmx-forms ${authPanel === "register" ? "show-reg" : ""}`}>
              {/* LOGIN */}
              <div className="cmx-panel login-panel">
                <form className="cmx-form-inner" onSubmit={handleLogin}>
                  <h2>Welcome back</h2>
                  <div className={`cmx-inp ${loginValidation.username.touched ? (loginValidation.username.valid ? "has-success" : "has-error") : ""}`}>
                    <input
                      ref={loginUsernameRef}
                      type="text"
                      name="username"
                      placeholder="Username or email"
                      value={loginData.username}
                      onChange={handleLoginChange}
                      className={getInputStatus(loginValidation.username)}
                    />
                    <i className="bx bx-user cmx-input-icon"></i>
                    <i className={`bx bx-check-circle cmx-input-status ${loginValidation.username.valid ? "show" : ""}`}></i>
                  </div>
                  <div className={`cmx-error-text ${loginValidation.username.touched && !loginValidation.username.valid ? "show" : ""}`}>{loginValidation.username.error}</div>
                  
                  <div className={`cmx-inp ${loginValidation.password.touched ? (loginValidation.password.valid ? "has-success" : "has-error") : ""}`}>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className={getInputStatus(loginValidation.password)}
                    />
                    <i className="bx bx-lock-alt cmx-input-icon"></i>
                  </div>
                  <div className={`cmx-error-text ${loginValidation.password.touched && !loginValidation.password.valid ? "show" : ""}`}>{loginValidation.password.error}</div>
                  <a className="cmx-forgot" href="#forgot">Forgot password?</a>
                  {loginError && <p className="cmx-form-note error">{loginError}</p>}
                  <button type="submit" className="cmx-sbtn" disabled={!isLoginValid || authLoading}>{authLoading ? "Logging in..." : "Log in"}</button>
                  <div className="cmx-divider">OR CONTINUE WITH</div>
                  <div className="cmx-social">
                    <a href="https://accounts.google.com/" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-google" /><FaGoogle/></a>
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-facebook" /><FaFacebook/></a>
                    <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-github" /><FaGithub/></a>
                    <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-linkedin" /><FaLinkedin/></a>
                  </div>
                  <p className="cmx-switch">No account?{" "}
                    <a href="#reg" onClick={(e) => switchAuthPanel("register", e)}>Register here</a>
                  </p>
                </form>
              </div>

              {/* REGISTER */}
              <div className="cmx-panel reg-panel">
                <form className="cmx-form-inner" onSubmit={handleRegister}>
                  <h2>Create your account</h2>
                  <div className={`cmx-inp ${regValidation.username.touched ? (regValidation.username.valid ? "has-success" : "has-error") : ""}`}>
                    <input
                      ref={regUsernameRef}
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={regData.username}
                      onChange={handleRegChange}
                      className={getInputStatus(regValidation.username)}
                    />
                    <i className="bx bx-user cmx-input-icon"></i>
                    <i className={`bx bx-check-circle cmx-input-status ${regValidation.username.valid ? "show" : ""}`}></i>
                  </div>
                  <div className={`cmx-error-text ${regValidation.username.touched && !regValidation.username.valid ? "show" : ""}`}>{regValidation.username.error}</div>

                  <div className={`cmx-inp ${regValidation.email.touched ? (regValidation.email.valid ? "has-success" : "has-error") : ""}`}>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={regData.email}
                      onChange={handleRegChange}
                      className={getInputStatus(regValidation.email)}
                    />
                    <i className="bx bx-envelope cmx-input-icon"></i>
                    <i className={`bx bx-check-circle cmx-input-status ${regValidation.email.valid ? "show" : ""}`}></i>
                  </div>
                  <div className={`cmx-error-text ${regValidation.email.touched && !regValidation.email.valid ? "show" : ""}`}>{regValidation.email.error}</div>

                  <div className={`cmx-inp ${regValidation.password.touched ? (regValidation.password.valid ? "has-success" : "has-error") : ""}`}>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={regData.password}
                      onChange={handleRegChange}
                      className={getInputStatus(regValidation.password)}
                    />
                    <i className="bx bx-lock-alt cmx-input-icon"></i>
                  </div>
                  <div className={`cmx-error-text ${regValidation.password.touched && !regValidation.password.valid ? "show" : ""}`}>{regValidation.password.error}</div>
                  <div className="cmx-strength-wrap">
                    <div
                      className={`cmx-strength-bar ${regValidation.passwordStrength || ""}`}
                      style={{ width: regValidation.passwordStrength ? (regValidation.passwordStrength === "weak" ? "35%" : regValidation.passwordStrength === "medium" ? "70%" : "100%") : "0%" }}
                    />
                  </div>
                  <div className="cmx-strength-label">{regValidation.passwordStrength ? `Strength: ${regValidation.passwordStrength.charAt(0).toUpperCase() + regValidation.passwordStrength.slice(1)}` : "Password strength"}</div>
                  {regError && <p className="cmx-form-note error">{regError}</p>}
                  <button type="submit" className="cmx-sbtn" style={{ marginTop: 8 }} disabled={!isRegisterValid || authLoading}>{authLoading ? "Creating account..." : "Create account"}</button>
                  <div className="cmx-divider">OR REGISTER WITH</div>
                  <div className="cmx-social">
                    <a href="https://accounts.google.com/" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-google" /><FaGoogle/></a>
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-facebook" /><FaFacebook/></a>
                    <a href="https://github.com/login" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-github" /><FaGithub/></a>
                    <a href="https://www.linkedin.com/login" target="_blank" rel="noopener noreferrer" className="cmx-soc"><i className="bx bxl-linkedin" /><FaLinkedin/></a>
                  </div>
                  <p className="cmx-switch">Have an account?{" "}
                    <a href="#login" onClick={(e) => switchAuthPanel("login", e)}>Log in here</a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */

function FeatureIcon({ kind }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "mentor") return (
    <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" /><path d="M17.5 5.5l1 1M18.5 4v2" /></svg>
  );
  if (kind === "practice") return (
    <svg {...common}><rect x="3.5" y="4.5" width="17" height="13" rx="2" /><path d="M8 20h8M12 17.5V20" /><path d="M8 9l2 2-2 2M13 13h3" /></svg>
  );
  if (kind === "track") return (
    <svg {...common}><path d="M4 19h16" /><rect x="6" y="12" width="3" height="7" /><rect x="11" y="8" width="3" height="11" /><rect x="16" y="5" width="3" height="14" /></svg>
  );
  return (
    <svg {...common}><path d="M4 12c3-6 13-6 16 0" /><path d="M4 12c3 6 13 6 16 0" /><circle cx="12" cy="12" r="2.3" /></svg>
  );
}

/* ------------------------------------------------------------------ */
/* Illustrations                                                        */
/* ------------------------------------------------------------------ */

function ClassroomSceneSVG({ step }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 500 400" aria-hidden="true" style={{ overflow: "visible" }}>
      {/* Floor Shadow */}
      <ellipse cx="250" cy="380" rx="220" ry="18" fill="#000" opacity="0.06" />

      {/* WHITEBOARD (Right Side) — shifted right to sit clear of the mascot with a gap */}
      <g className={`scene-element ${step >= 2 ? "fade-in-up" : "hidden"}`} style={{ animationDelay: "0.1s" }} transform="translate(88, 0)">
        <line x1="100" y1="200" x2="60" y2="350" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
        <line x1="380" y1="200" x2="420" y2="350" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
        <line x1="100" y1="200" x2="130" y2="350" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
        <line x1="380" y1="200" x2="350" y2="350" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
        <rect x="80" y="40" width="320" height="200" rx="12" fill="#fff" stroke="#cbd5e1" strokeWidth="8" />
        <rect x="90" y="240" width="300" height="8" rx="4" fill="#94a3b8" />
        
        <text x="110" y="90" fontFamily="'SFMono-Regular', Consolas, monospace" fontSize="18" fill="#F49B00" fontWeight="bold">
          def <tspan fill="#14325D">mastery</tspan>(student):
        </text>
        <text x="140" y="120" fontFamily="'SFMono-Regular', Consolas, monospace" fontSize="16" fill="#14325D">
          return <tspan fill="#2e9d62">"Success"</tspan>
        </text>
        <rect x="120" y="150" width="180" height="6" fill="#f1f5f9" rx="3"/>
        <rect x="120" y="170" width="140" height="6" fill="#f1f5f9" rx="3"/>
        <rect x="120" y="190" width="200" height="6" fill="#f1f5f9" rx="3"/>
      </g>

      {/* ORIGINAL TEACHER MASCOT (Left Side) — nudged left so a clean gap opens before the whiteboard */}
      <g className={`scene-element ${step >= 3 ? "fade-in-up" : "hidden"}`} style={{ animationDelay: "0.3s", transformOrigin: "150px 350px" }} transform="translate(-32, 150) scale(1)">
        <rect x="46" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
        <rect x="72" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
        <rect x="48" y="168" width="16" height="44" rx="5" fill="#25367C" />
        <rect x="76" y="168" width="16" height="44" rx="5" fill="#25367C" />
        <path d="M34 106 Q33 88 70 84 Q107 88 106 106 L110 172 Q70 182 30 172 Z" fill="#25367C" />
        <path d="M58 90 L70 108 L82 90" fill="#fff" />
        <path d="M67 92 L70 100 L73 92 L71.5 97 L70 118 L68.5 97 Z" fill="#F49B00" />
        <path d="M58 90 L46 116 L60 108 Z" fill="#1a2558" />
        <path d="M82 90 L94 116 L80 108 Z" fill="#1a2558" />
        
        {/* Original arms */}
        <rect x="20" y="104" width="15" height="54" rx="7" fill="#25367C" />
        <circle cx="27" cy="160" r="10" fill="#f4c9a0" />
        <path d="M104 100 Q122 96 128 76 Q130 68 124 65 Q118 63 115 72 Q110 86 100 98Z" fill="#25367C" />
        <circle cx="126" cy="66" r="10" fill="#f4c9a0" />
        <rect x="128" y="48" width="28" height="36" rx="3" fill="#e0473a" transform="rotate(-15 128 48)" />
        <rect x="130" y="50" width="3" height="36" rx="1" fill="#c03428" transform="rotate(-15 128 48)" />
        <line x1="133" y1="56" x2="152" y2="50" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)" />
        <line x1="133" y1="62" x2="152" y2="56" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)" />
        
        <rect x="63" y="74" width="14" height="14" fill="#f4c9a0" />
        <circle cx="70" cy="52" r="30" fill="#f4c9a0" />
        <path d="M41 46 Q40 18 70 16 Q100 18 99 46 L99 34 Q99 22 70 20 Q41 22 41 34Z" fill="#4a3526" />
        <circle cx="40" cy="54" r="5" fill="#f4c9a0" />
        <circle cx="100" cy="54" r="5" fill="#f4c9a0" />
        <ellipse cx="57" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
        <ellipse cx="83" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
        <line x1="44" y1="55" x2="35" y2="52" stroke="#2b2b2b" strokeWidth="2.4" />
        <line x1="96" y1="55" x2="105" y2="52" stroke="#2b2b2b" strokeWidth="2.4" />
        <circle cx="57" cy="55" r="2.8" fill="#2b2b2b" />
        <circle cx="83" cy="55" r="2.8" fill="#2b2b2b" />
        <path d="M48 43 Q57 39 66 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M74 43 Q83 39 92 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M58 68 Q70 76 82 68" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function TeacherSVG({ small }) {
  const w = small ? 160 : 220;
  const h = small ? 407 : 560;
  return (
    <svg width={w} height={h} viewBox="0 0 140 240" aria-hidden="true">
      <ellipse cx="70" cy="232" rx="36" ry="6" fill="#000" opacity="0.07" />
      <rect x="46" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
      <rect x="72" y="210" width="22" height="10" rx="4" fill="#1a1a2e" />
      <rect x="48" y="168" width="16" height="44" rx="5" fill="#25367C" />
      <rect x="76" y="168" width="16" height="44" rx="5" fill="#25367C" />
      <path d="M34 106 Q33 88 70 84 Q107 88 106 106 L110 172 Q70 182 30 172 Z" fill="#25367C" />
      <path d="M58 90 L70 108 L82 90" fill="#fff" />
      <path d="M67 92 L70 100 L73 92 L71.5 97 L70 118 L68.5 97 Z" fill="#F49B00" />
      <path d="M58 90 L46 116 L60 108 Z" fill="#1a2558" />
      <path d="M82 90 L94 116 L80 108 Z" fill="#1a2558" />
      <rect x="20" y="104" width="15" height="54" rx="7" fill="#25367C" />
      <circle cx="27" cy="160" r="10" fill="#f4c9a0" />
      <path d="M104 100 Q122 96 128 76 Q130 68 124 65 Q118 63 115 72 Q110 86 100 98Z" fill="#25367C" />
      <circle cx="126" cy="66" r="10" fill="#f4c9a0" />
      <rect x="128" y="48" width="28" height="36" rx="3" fill="#e0473a" transform="rotate(-15 128 48)" />
      <rect x="130" y="50" width="3" height="36" rx="1" fill="#c03428" transform="rotate(-15 128 48)" />
      <line x1="133" y1="56" x2="152" y2="50" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)" />
      <line x1="133" y1="62" x2="152" y2="56" stroke="#fff" strokeWidth="1.5" opacity=".6" transform="rotate(-15 128 48)" />
      <rect x="63" y="74" width="14" height="14" fill="#f4c9a0" />
      <circle cx="70" cy="52" r="30" fill="#f4c9a0" />
      <path d="M41 46 Q40 18 70 16 Q100 18 99 46 L99 34 Q99 22 70 20 Q41 22 41 34Z" fill="#4a3526" />
      <circle cx="40" cy="54" r="5" fill="#f4c9a0" />
      <circle cx="100" cy="54" r="5" fill="#f4c9a0" />
      <ellipse cx="57" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
      <ellipse cx="83" cy="55" rx="13" ry="10" fill="none" stroke="#2b2b2b" strokeWidth="2.4" />
      <line x1="44" y1="55" x2="35" y2="52" stroke="#2b2b2b" strokeWidth="2.4" />
      <line x1="96" y1="55" x2="105" y2="52" stroke="#2b2b2b" strokeWidth="2.4" />
      <circle cx="57" cy="55" r="2.8" fill="#2b2b2b" />
      <circle cx="83" cy="55" r="2.8" fill="#2b2b2b" />
      <path d="M48 43 Q57 39 66 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M74 43 Q83 39 92 43" stroke="#4a3526" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M58 68 Q70 76 82 68" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AuthCharSVG() {
  return (
    <svg width="120" height="220" viewBox="0 0 90 160" aria-hidden="true">
      <ellipse cx="45" cy="154" rx="24" ry="4" fill="#000" opacity="0.12" />
      <rect x="32" y="116" width="10" height="32" rx="4" fill="#1a2558" />
      <rect x="48" y="116" width="10" height="32" rx="4" fill="#1a2558" />
      <rect x="29" y="142" width="15" height="7" rx="2" fill="#0e1838" />
      <rect x="46" y="142" width="15" height="7" rx="2" fill="#0e1838" />
      <path d="M22 72 Q21 58 45 56 Q69 58 68 72 L72 120 Q45 128 18 120Z" fill="#e0473a" />
      <path d="M38 58 L45 70 L52 58" fill="#fff" />
      <path d="M38 58 L30 78 L40 74Z" fill="#c03428" />
      <path d="M52 58 L60 78 L50 74Z" fill="#c03428" />
      <rect x="12" y="68" width="10" height="36" rx="5" fill="#e0473a" />
      <rect x="68" y="68" width="10" height="36" rx="5" fill="#e0473a" />
      <circle cx="17" cy="106" r="7" fill="#f0b386" />
      <circle cx="73" cy="106" r="7" fill="#f0b386" />
      <rect x="40" y="48" width="10" height="10" fill="#f0b386" />
      <circle cx="45" cy="32" r="22" fill="#f0b386" />
      <path d="M24 28 Q23 10 45 8 Q67 10 66 28 L66 20 Q66 12 45 10 Q24 12 24 20Z" fill="#2b1c10" />
      <circle cx="38" cy="34" r="2.6" fill="#2b2b2b" />
      <circle cx="52" cy="34" r="2.6" fill="#2b2b2b" />
      <path d="M36 26 Q42 22 48 26" stroke="#2b1c10" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M38 44 Q45 50 52 44" stroke="#7a4a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="34" r="3.5" fill="#f0b386" />
      <circle cx="56" cy="34" r="3.5" fill="#f0b386" />
      <circle cx="38" cy="40" r="3.5" fill="#f5a98c" opacity=".5" />
      <circle cx="52" cy="40" r="3.5" fill="#f5a98c" opacity=".5" />
      <path d="M41 56 L45 62 L49 56 L47 59 L45 72 L43 59Z" fill="#F49B00" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const s = {
  page: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1A2540",
  },
};

const css = `
:root{
  --navy-1:#14325D;
  --navy-2:#25367C;
  --orange:#F49B00;
  --orange-deep:#cc8100;
  --red:#e0473a;
  --cream:#FFFDFA;
  --ink:#1A2540;
  --muted:#64748B;
  --line:rgba(20,50,93,0.08);
  --success:#2e9d62;
  --display:'Sora', 'Inter', sans-serif;
  --glass-bg:rgba(255,255,255,0.65);
  --glass-border:rgba(255,255,255,0.5);
  --shadow-sm:0 8px 24px rgba(20,50,93,.05);
  --shadow-md:0 12px 34px rgba(20,50,93,.08);
}

*{box-sizing:border-box}
h1,h2,h3{font-family:var(--display);color:var(--navy-1);margin:0}

/* ---------- AMBIENT BACKGROUND ---------- */
.cmx-ambient-bg{position:fixed;inset:0;z-index:-1;background:var(--cream);overflow:hidden}
.cmx-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.6;animation:orbFloat 20s infinite alternate ease-in-out;}
.orb-1{width:600px;height:600px;background:rgba(244,155,0,.15);top:-10%;right:-10%;animation-delay:0s;}
.orb-2{width:500px;height:500px;background:rgba(37,54,124,.1);bottom:-10%;left:-10%;animation-delay:-5s;}
.orb-3{width:400px;height:400px;background:rgba(224,71,58,.08);top:40%;left:30%;animation-delay:-10s;}
@keyframes orbFloat{0%{transform:translate(0,0) scale(1)}100%{transform:translate(50px,80px) scale(1.1)}}

/* GLASSMORPHISM UTILS */
.glass{background:var(--glass-bg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--glass-border);box-shadow:var(--shadow-sm);}
.glass-section{background:rgba(255,255,255,0.3);backdrop-filter:blur(24px);}

/* ---------- NAV ---------- */
.cmx-nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;
  padding:16px 44px;background:transparent;border-bottom:1px solid transparent;
  transition:background .25s ease,border-color .25s ease,padding .25s ease}
.cmx-nav.scrolled{background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--line);padding:11px 44px;box-shadow:var(--shadow-sm)}
.cmx-logo{display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;padding:0;font-family:var(--display)}
.cmx-logo b{font-size:20px;color:var(--navy-1);font-weight:700}
.cmx-diamond{width:38px;height:38px;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;box-shadow:0 6px 14px rgba(20,50,93,.12);transition:transform .2s}
.cmx-diamond.small{width:34px;height:34px}
.cmx-logo:hover .cmx-diamond{transform:scale(1.06)}
.cmx-diamond img{display:block;width:100%;height:100%;object-fit:cover}

.cmx-nav-links{display:flex;align-items:center;gap:28px}
.cmx-nav-link{background:none;border:none;padding:0;color:var(--navy-1);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;position:relative;transition:color .2s}
.cmx-nav-link::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--orange);transform:scaleX(0);transition:transform .2s;transform-origin:left}
.cmx-nav-link:hover{color:var(--orange)}
.cmx-nav-link:hover::after{transform:scaleX(1)}
.cmx-nav-actions{display:flex;gap:10px}
.cmx-nbtn{border:none;padding:10px 20px;border-radius:10px;cursor:pointer;font-size:13.5px;font-weight:600;font-family:inherit;transition:transform .15s,box-shadow .15s,background .15s}
.cmx-nbtn.login{background:rgba(255,255,255,0.5);backdrop-filter:blur(10px);color:var(--navy-1);border:1px solid var(--line)}
.cmx-nbtn.login:hover{border-color:var(--navy-1);background:#fff}
.cmx-nbtn.signup{background:var(--orange);color:#fff;box-shadow:0 6px 16px rgba(244,155,0,.28)}
.cmx-nbtn.signup:hover{background:#e08e00;transform:translateY(-1px)}

/* ---------- HERO ---------- */
.cmx-hero-section{position:relative;overflow:hidden;padding:64px 44px 40px}
.cmx-star{position:absolute;opacity:0;z-index:1;animation:floatStar 3s ease-in-out infinite alternate}
.cmx-star.show{opacity:.8}
.cmx-star.s1{top:14%;left:46%;font-size:22px;animation-delay:.2s;filter:drop-shadow(0 0 8px rgba(244,155,0,.5))}
.cmx-star.s2{top:60%;left:6%;font-size:16px;animation-delay:1.4s}
.cmx-star.s3{top:24%;right:38%;font-size:24px;animation-delay:.7s;filter:drop-shadow(0 0 8px rgba(255,255,255,.8))}
@keyframes floatStar{0%{transform:translateY(0) rotate(0deg)}100%{transform:translateY(-14px) rotate(20deg)}}

.cmx-hero-grid{position:relative;z-index:2;max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;min-height:520px}

.cmx-hero-copy{opacity:0;transform:translateY(16px);transition:opacity .7s,transform .7s}
.cmx-hero-copy.show{opacity:1;transform:translateY(0)}
.cmx-eyebrow{display:inline-block;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--orange-deep);background:rgba(244,155,0,.12);padding:6px 14px;border-radius:20px;margin-bottom:18px}
.cmx-eyebrow.dark{color:var(--navy-2);background:rgba(37,54,124,.08)}
.cmx-hero-copy h1{font-size:clamp(36px,4vw,56px);line-height:1.1;font-weight:800;margin-bottom:20px;letter-spacing:-0.02em;}
.cmx-hero-copy h1 b{color:transparent;background-clip:text;-webkit-background-clip:text;background-image:linear-gradient(90deg, var(--orange), #ff6b00);}
.cmx-hero-copy p{font-size:17px;color:var(--muted);line-height:1.7;max-width:480px;margin:0 0 32px}
.cmx-hero-cta{display:flex;align-items:center;gap:14px;margin-bottom:32px;flex-wrap:wrap}
.cmx-join{background:linear-gradient(90deg,var(--orange),#ff8c00);color:#fff;border:none;padding:16px 32px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 0 var(--orange-deep),0 12px 24px rgba(244,155,0,.28);transition:transform .15s,box-shadow .15s,background .15s}
.cmx-join:hover{background:linear-gradient(90deg,#e08e00,#f07e00);transform:translateY(-2px);box-shadow:0 6px 0 var(--orange-deep),0 16px 28px rgba(244,155,0,.32)}
.cmx-join:active{transform:translateY(4px);box-shadow:0 0 0 var(--orange-deep),0 4px 10px rgba(244,155,0,.3)}
.cmx-join.light{background:#fff;color:var(--navy-1);box-shadow:0 4px 0 rgba(0,0,0,.12),0 12px 24px rgba(0,0,0,.12)}
.cmx-join.light:hover{background:#fff;color:var(--navy-1)}
.cmx-ghost{background:rgba(255,255,255,0.5);backdrop-filter:blur(8px);border:1px solid var(--line);color:var(--navy-1);padding:15px 26px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:.15s}
.cmx-ghost:hover{background:#fff;border-color:var(--navy-1);transform:translateY(-1px);box-shadow:var(--shadow-sm)}

.cmx-trust{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--muted)}
.cmx-avatars{display:flex}
.cmx-av{width:32px;height:32px;border-radius:50%;background:#e2e8f0;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;margin-left:-10px}
.cmx-av:first-child{margin-left:0}
.cmx-av.a1{background:#fef3c7}.cmx-av.a2{background:#dbeafe}.cmx-av.a3{background:#fce7f3}
.cmx-trust b{color:var(--navy-1)}

.cmx-hero-visual{position:relative;min-height:500px;opacity:0;transform:translateX(24px);transition:opacity .8s,transform .8s}
.cmx-hero-visual.show{opacity:1;transform:translateX(0)}
.cmx-mascot-group{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;}
.cmx-teacher{position:absolute;right:10%;bottom:0;z-index:1;opacity:0;transform:translateY(30px) scale(.98);transition:opacity .8s,transform .8s cubic-bezier(.2,.8,.3,1)}
.cmx-teacher.show{opacity:1;transform:translateY(0) scale(1.15);animation:cmxTeacherBob 2.8s ease-in-out infinite alternate}
.cmx-student{position:absolute;left:5%;bottom:0;z-index:2;opacity:0;transform:translateY(30px) scale(.98) scaleX(-1);transition:opacity .8s .2s,transform .8s .2s cubic-bezier(.2,.8,.3,1)}
.cmx-student.show{opacity:1;transform:translateY(0) scale(1) scaleX(-1);animation:cmxTeacherBob 3s ease-in-out infinite alternate 0.5s}

.cmx-float-card{position:absolute;background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.8);border-radius:16px;padding:12px 18px;font-weight:700;font-size:14px;color:var(--navy-1);box-shadow:0 12px 28px rgba(20,50,93,.12);z-index:3;opacity:0;transition:opacity .6s}
.cmx-float-card.fc-1{top:15%;right:5%;animation:floatCard1 3s ease-in-out infinite alternate}
.cmx-float-card.fc-2{bottom:40%;left:0;animation:floatCard2 3.5s ease-in-out infinite alternate 0.5s}
.cmx-float-card.show{opacity:1}
@keyframes floatCard1{0%{transform:translateY(0) rotate(2deg)}100%{transform:translateY(-10px) rotate(-2deg)}}
@keyframes floatCard2{0%{transform:translateY(0) rotate(-2deg)}100%{transform:translateY(-8px) rotate(2deg)}}

.scene-element { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(.2,.8,.3,1); }
.scene-element.hidden { opacity: 0; transform: translateY(30px); }
.scene-element.fade-in-up { opacity: 1; transform: translateY(0); }

@keyframes cmxTeacherBob{from{transform:translateY(0) scaleX(var(--sx, 1))}to{transform:translateY(-10px) scaleX(var(--sx, 1))}}

/* ---------- STRIP ---------- */
.cmx-strip{max-width:1000px;margin:24px auto 0;display:flex;align-items:center;justify-content:center;gap:36px;padding:26px 32px;border-radius:24px;flex-wrap:wrap}
.cmx-strip-item{display:flex;flex-direction:column;gap:4px;text-align:center;min-width:150px}
.cmx-strip-item b{font-size:15px;color:var(--navy-1);font-family:var(--display)}
.cmx-strip-item span{font-size:13px;color:var(--muted)}
.cmx-strip-div{width:1px;height:34px;background:var(--line)}

/* ---------- SECTIONS ---------- */
.cmx-section{padding:96px 44px;max-width:1200px;margin:0 auto;position:relative;z-index:10}
.cmx-section.alt{max-width:100%;}
.cmx-section.alt > *{max-width:1200px;margin-left:auto;margin-right:auto}
.cmx-section-head{max-width:640px;margin:0 auto 52px;text-align:center}
.cmx-section-head h2{font-size:clamp(28px,3vw,38px);font-weight:800;line-height:1.2;margin-top:12px;letter-spacing:-0.02em}

/* features bento */
.cmx-bento-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;grid-auto-rows:minmax(240px, auto);}
.cmx-bento-card{border-radius:32px;padding:40px;transition:transform .3s,box-shadow .3s,border-color .3s;display:flex;flex-direction:column;justify-content:center}
.cmx-bento-card.span-2{grid-column: span 2}
.cmx-bento-card.span-1{grid-column: span 1}
.cmx-bento-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:#fff}
.cmx-feature-icon{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg, rgba(244,155,0,.15), rgba(244,155,0,.05));color:var(--orange-deep);display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:inset 0 0 0 1px rgba(244,155,0,.2)}
.cmx-bento-card h3{font-size:20px;font-weight:700;margin-bottom:12px;line-height:1.3}
.cmx-bento-card p{font-size:14.5px;color:var(--muted);line-height:1.6;margin:0}

/* languages */
.cmx-lang-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.cmx-lang-card{border-radius:32px;padding:40px;position:relative;overflow:hidden;transition:transform .3s,box-shadow .3s}
.cmx-lang-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}
.cmx-lang-card.py{border-top:6px solid #3a76b4}
.cmx-lang-card.cpp{border-top:6px solid #00599C}
.cmx-lang-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.cmx-lang-icon{font-size:36px}
.cmx-lang-tag{font-size:12px;font-weight:700;color:var(--navy-2);background:rgba(37,54,124,.08);padding:6px 14px;border-radius:20px}
.cmx-lang-card h3{font-size:26px;font-weight:800;margin-bottom:12px}
.cmx-lang-card p{font-size:15px;color:var(--muted);line-height:1.7;margin:0 0 26px}
.cmx-lang-cta{background:none;border:none;padding:0;color:var(--orange-deep);font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
.cmx-lang-cta:hover{text-decoration:underline}
.cmx-lang-soon{margin-top:40px;text-align:center}
.cmx-lang-soon > span{display:block;font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.cmx-soon-pills{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
.cmx-pill{font-size:13px;font-weight:600;color:var(--muted);padding:8px 18px;border-radius:24px}

/* how it works */
.cmx-steps{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:12px}
.cmx-step{border-radius:24px;padding:32px 28px;transition:transform .3s}
.cmx-step:hover{transform:translateY(-4px)}
.cmx-step-n{font-family:var(--display);font-size:14px;font-weight:800;color:var(--orange-deep);display:inline-block;margin-bottom:12px;background:rgba(244,155,0,.15);padding:6px 12px;border-radius:12px}
.cmx-step h3{font-size:18px;font-weight:700;margin-bottom:10px}
.cmx-step p{font-size:14px;color:var(--muted);line-height:1.65;margin:0}
.cmx-step-connector{height:2px;background:repeating-linear-gradient(90deg,var(--line) 0 8px,transparent 8px 16px);margin-top:60px}

/* about */
.cmx-about-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:48px;align-items:center;padding:40px 0}
.cmx-about-grid h2{font-size:clamp(28px,3vw,36px);margin:12px 0 16px;letter-spacing:-0.02em}
.cmx-about-grid p{font-size:16px;color:var(--muted);line-height:1.8;max-width:540px}
.cmx-about-card{display:flex;justify-content:center;align-items:center;border-radius:32px;padding:40px 0}

.cmx-ide-card.relative-ide{position:relative;top:0;left:0;width:100%;box-shadow:none;border-radius:32px;background:#12213f;overflow:hidden}
.cmx-ide-bar{display:flex;align-items:center;gap:8px;padding:14px 18px;background:#0d1a33;border-bottom:1px solid rgba(255,255,255,.06)}
.cmx-ide-bar .dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.dot.r{background:#e0473a}.dot.y{background:#F49B00}.dot.g{background:#2e9d62}
.cmx-ide-file{margin-left:8px;font-size:12px;color:#93a5c9;font-family:'SFMono-Regular',Consolas,monospace}
.cmx-ide-body{margin:0;padding:24px 20px 28px;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:14px;line-height:1.8;color:#c6d2ef;white-space:pre-wrap}
.tok-kw{color:#ff9d5c}.tok-fn{color:#7cc6ff}.tok-var{color:#e7ecf7}.tok-str{color:#8fe3a1}.tok-cm{color:#6d7ba0}

/* cta */
.cmx-cta{background:linear-gradient(135deg,var(--navy-2),#101c47);text-align:center;padding:100px 40px;color:#fff;border-radius:32px;margin:0 44px 80px;position:relative;overflow:hidden}
.cmx-cta::before{content:"";position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 80% 20%, rgba(244,155,0,0.2) 0%, transparent 60%);pointer-events:none}
.cmx-cta h2{color:#fff;font-size:clamp(30px,3.5vw,40px);margin-bottom:16px;letter-spacing:-0.02em}
.cmx-cta p{color:rgba(255,255,255,.8);font-size:17px;margin:0 0 32px}

/* footer */
.cmx-footer{background:#0d1a33;color:#c6d2ef;padding:64px 44px 32px}
.cmx-footer-top{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;padding-bottom:48px;border-bottom:1px solid rgba(255,255,255,.08)}
.cmx-footer-brand{display:flex;align-items:center;gap:12px}
.cmx-footer-brand b{font-family:var(--display);font-size:20px;color:#fff}
.cmx-footer-cols{display:flex;gap:64px;flex-wrap:wrap}
.cmx-footer-cols h4{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#7c8bb3;margin:0 0 16px;font-family:var(--display)}
.cmx-footer-cols > div{display:flex;flex-direction:column;gap:12px}
.cmx-footer-cols button,.cmx-footer-cols a{background:none;border:none;padding:0;text-align:left;color:#c6d2ef;font-size:14px;font-family:inherit;cursor:pointer;text-decoration:none;transition:.2s}
.cmx-footer-cols button:hover,.cmx-footer-cols a:hover{color:#fff}
.cmx-footer-bottom{max-width:1200px;margin:28px auto 0;display:flex;justify-content:space-between;align-items:center;font-size:13.5px;color:#7c8bb3;flex-wrap:wrap;gap:16px}
.cmx-footer-social{display:flex;gap:16px}
.cmx-footer-social a{color:#c6d2ef;font-size:18px;transition:.2s}
.cmx-footer-social a:hover{color:var(--orange)}

/* ---------- AUTH ---------- */
.cmx-auth{position:fixed;inset:0;z-index:100;background:rgba(13,26,51,.4);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:cmxAuthIn .3s ease forwards;padding:20px}
@keyframes cmxAuthIn{from{opacity:0}to{opacity:1}}
.cmx-close{position:absolute;top:22px;right:28px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,.8);color:var(--navy-1);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;z-index:10}
.cmx-close:hover{background:#fff;transform:scale(1.05)}
.cmx-swap-wrap{position:relative;width:min(900px,96vw);height:clamp(540px,76vh,660px);border-radius:28px;box-shadow:0 40px 90px rgba(13,26,51,.34);overflow:hidden;display:flex;animation:cmxPop .4s cubic-bezier(.2,.9,.3,1) forwards;border:1px solid rgba(255,255,255,.5)}
@keyframes cmxPop{from{opacity:0;transform:scale(.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.cmx-auth-side{position:relative;width:250px;min-width:250px;background:linear-gradient(160deg,var(--navy-2),#101c47);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:32px 24px;flex-shrink:0;overflow:hidden}
.cmx-auth-side::before{content:"";position:absolute;top:-30%;right:-30%;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(244,155,0,.28),transparent 65%);pointer-events:none}
.cmx-auth-side::after{content:"";position:absolute;bottom:-25%;left:-30%;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(224,71,58,.16),transparent 65%);pointer-events:none}
.cmx-auth-side svg{position:relative;z-index:1;filter:drop-shadow(0 16px 24px rgba(0,0,0,.28))}
.cmx-side-text{position:relative;z-index:1;color:#fff;font-size:15px;font-family:var(--display);font-weight:600;text-align:center;line-height:1.55;letter-spacing:-.01em}
.cmx-forms{flex:1;position:relative;overflow:hidden;background:#fff}
.cmx-panel{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:44px 52px;transition:transform .5s cubic-bezier(.65,0,.35,1),opacity .5s}
.login-panel{transform:translateX(0);opacity:1}
.reg-panel{transform:translateX(100%);opacity:0}
.cmx-forms.show-reg .login-panel{transform:translateX(-100%);opacity:0}
.cmx-forms.show-reg .reg-panel{transform:translateX(0);opacity:1}

.cmx-form-inner{width:100%;max-width:380px}
.cmx-form-inner h2{font-size:29px;font-weight:700;margin:0 0 6px;letter-spacing:-0.02em}
.cmx-form-inner h2 + .cmx-inp{margin-top:22px}
.cmx-inp{position:relative;margin-bottom:10px}
.cmx-inp input{width:100%;height:52px;background:#f7f9fc;border:1.5px solid #e4e9f2;border-radius:13px;padding:0 42px 0 16px;font-size:15px;color:var(--ink);outline:none;font-family:inherit;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
.cmx-inp input:focus{border-color:var(--navy-1);background:#fff;box-shadow:0 0 0 4px rgba(20,50,93,.08)}
.cmx-inp input::placeholder{color:#9aa1ad}
.cmx-inp input.valid{border-color:var(--success);box-shadow:0 0 0 2px rgba(46,157,98,.08)}
.cmx-inp input.invalid{border-color:var(--red);animation:cmxShake .35s ease}
.cmx-inp.has-error{margin-bottom:2px}.cmx-inp.has-success{margin-bottom:2px}
.cmx-input-icon{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:16px;color:#aaa;pointer-events:none}
.cmx-input-status{position:absolute;right:38px;top:50%;transform:translateY(-50%) scale(.7);font-size:14px;color:var(--success);opacity:0;transition:.2s}
.cmx-input-status.show{opacity:1;transform:translateY(-50%) scale(1)}
.cmx-error-text{font-size:12px;color:var(--red);margin:0 0 10px 2px;opacity:0;max-height:0;overflow:hidden;transform:translateY(-6px);transition:.25s}
.cmx-error-text.show{opacity:1;max-height:22px;transform:translateY(0)}
.cmx-forgot{font-size:13px;color:var(--muted);text-decoration:none;display:block;text-align:right;margin:-2px 0 14px;font-weight:500}
.cmx-forgot:hover{color:var(--navy-1)}
.cmx-sbtn{width:100%;height:52px;margin-top:4px;background:linear-gradient(90deg,var(--orange),#ff8c00);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;letter-spacing:.01em;cursor:pointer;font-family:inherit;box-shadow:0 4px 0 var(--orange-deep),0 10px 20px rgba(244,155,0,.26);transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.cmx-sbtn:not(:disabled):hover{background:linear-gradient(90deg,#e08e00,#f07e00);transform:translateY(-2px);box-shadow:0 6px 0 var(--orange-deep),0 14px 26px rgba(244,155,0,.34)}
.cmx-sbtn:not(:disabled):active{transform:translateY(4px) !important;box-shadow:0 0 0 var(--orange-deep),0 4px 8px rgba(244,155,0,.2) !important}
.cmx-sbtn:disabled{background:#dfe3ec;color:#97a1b5;box-shadow:none;cursor:not-allowed}
.cmx-form-note{font-size:13px;margin:0 0 12px;color:var(--red)}
.cmx-strength-wrap{height:8px;border-radius:999px;background:#e2e4e9;overflow:hidden;margin:8px 0 6px;box-shadow:inset 0 1px 2px rgba(0,0,0,.05)}
.cmx-strength-bar{height:100%;width:0%;border-radius:999px;transition:.3s}
.cmx-strength-bar.weak{background:var(--red)}.cmx-strength-bar.medium{background:#f2b705}.cmx-strength-bar.strong{background:var(--success)}
.cmx-strength-label{font-size:12px;color:var(--muted);margin:0 0 14px}
.cmx-divider{display:flex;align-items:center;gap:12px;font-size:11px;letter-spacing:.08em;color:#a0aabf;text-align:center;margin:20px 0 16px;font-weight:700}
.cmx-divider::before,.cmx-divider::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent)}
@keyframes cmxShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}50%{transform:translateX(3px)}75%{transform:translateX(-2px)}}
.cmx-social{display:flex;justify-content:center;gap:12px}
.cmx-soc{width:46px;height:46px;background:#fff;border:1px solid #e4e9f2;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;color:#556;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease,color .15s ease;box-shadow:0 2px 6px rgba(20,50,93,.04)}
.cmx-soc:hover{border-color:var(--orange);color:var(--orange-deep);transform:translateY(-2px);box-shadow:0 8px 16px rgba(20,50,93,.10)}
.cmx-switch{font-size:13.5px;color:var(--muted);text-align:center;margin-top:16px}
.cmx-switch a{color:var(--orange-deep);text-decoration:none;font-weight:700}
.cmx-switch a:hover{text-decoration:underline}

/* ---------- RESPONSIVE ---------- */
@media(max-width:1080px){
  .cmx-hero-grid{grid-template-columns:1fr}
  .cmx-hero-visual{min-height:380px;order:-1}
  .cmx-bento-grid{grid-template-columns:1fr 1fr}
  .cmx-bento-card.span-2{grid-column: span 2}
  .cmx-steps{grid-template-columns:1fr}
  .cmx-step-connector{display:none}
  .cmx-about-grid{grid-template-columns:1fr}
  .cmx-lang-grid{grid-template-columns:1fr}
  .cmx-cta{margin:0 20px 80px}
}
@media(max-width:760px){
  .cmx-nav{padding:14px 20px}
  .cmx-nav.scrolled{padding:11px 20px}
  .cmx-nav-links{display:none}
  .cmx-hero-section{padding:36px 20px 24px}
  .cmx-section{padding:64px 20px}
  .cmx-bento-grid{grid-template-columns:1fr}
  .cmx-bento-card.span-2{grid-column: span 1}
  .cmx-strip{gap:18px}
  .cmx-auth-side{display:none}
  .cmx-student,.cmx-teacher{display:none}
  .cmx-float-card{display:none}
  .cmx-footer{padding:44px 20px 20px}
  .cmx-footer-cols{gap:30px}
  .cmx-cta{margin:0 0 60px;border-radius:0}
}
`;