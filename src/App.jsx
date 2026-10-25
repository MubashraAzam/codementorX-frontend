import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useParams } from "react-router-dom";
import CodeMentorLanding from "./components/CodeMentorLanding";
import ChoosePath from "./components/ChoosePath";
import Dashboard from "./components/Dashboard";
import LevelPage from "./components/LevelPage";
import VerifyCertificate from "./components/VerifyCertificate";
import VerifyEmail from "./components/VerifyEmail";
import AnimatedBackground from "./components/AnimatedBackground";
import { apiRequest, getToken, clearToken, saveToken } from "./utils/api";

// Declared at module level so it keeps the same component identity across
// renders. Defined inside App, every App state change (e.g. saving progress)
// created a new component type and remounted the whole page underneath it.
function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/" replace />;
}

function LevelWrapper({ username, language, progress, onComplete }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const levelIndex = parseInt(id, 10) || 0;

  return (
    <LevelPage
      username={username}
      language={language}
      levelIndex={levelIndex}
      progress={progress}
      onBack={() => navigate("/dashboard")}
      onNavigate={(i) => navigate(`/level/${i}`)}
      onComplete={onComplete}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [account, setAccount] = useState({ role: "student", emailVerified: true });
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    contact: "",
    avatarUrl: "",
    createdAt: "",
  });
  const [progress, setProgress] = useState({
    doneLevels: [],
    stars: {},
    currentLevel: 0,
  });

  // Merge a user payload (from /me or a profile update) into local state
  function applyUser(user) {
    if (!user) return;
    // Profile updates return a fresh token (the old one stops working after a password change).
    if (user.token) saveToken(user.token);
    if (user.username) setUsername(user.username);
    if (user.email) setEmail(user.email);
    if (user.language !== undefined) setLanguage(user.language);
    if (Array.isArray(user.enrollments)) setEnrollments(user.enrollments);
    if (user.role || user.emailVerified !== undefined) {
      setAccount((prev) => ({
        role: user.role ?? prev.role,
        emailVerified: user.emailVerified ?? prev.emailVerified,
      }));
    }
    setProfile((prev) => ({
      firstName: user.firstName ?? prev.firstName,
      lastName: user.lastName ?? prev.lastName,
      dob: user.dob ?? prev.dob,
      contact: user.contact ?? prev.contact,
      avatarUrl: user.avatarUrl ?? prev.avatarUrl,
      createdAt: user.createdAt ?? prev.createdAt,
    }));
  }

  // Restore session from JWT on reload
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const user = await apiRequest("/api/auth/me", { method: "GET" });
        applyUser(user);
      } catch (err) {
        console.warn("Session restore failed, clearing stale auth token:", err.message);
        clearToken();
        setUsername("");
        setEmail("");
        setLanguage(null);
        setProfile({ firstName: "", lastName: "", dob: "", contact: "", avatarUrl: "", createdAt: "" });
      } finally {
        setIsInitializing(false);
      }
    }
    restoreSession();
  }, []);

  // Listen for global auth expiration (e.g. 401 on background API calls)
  useEffect(() => {
    function handleAuthExpired() {
      clearToken();
      setUsername("");
      setEmail("");
      setLanguage(null);
      setProfile({ firstName: "", lastName: "", dob: "", contact: "", avatarUrl: "", createdAt: "" });
      navigate("/");
    }
    window.addEventListener("cmx_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("cmx_auth_expired", handleAuthExpired);
  }, [navigate]);

  useEffect(() => {
    async function fetchProgress() {
      if (language && getToken()) {
        try {
          const data = await apiRequest(`/api/progress/${language}`, { method: "GET" });
          setProgress({
            doneLevels: data.doneLevels || [],
            stars: data.stars || {},
            currentLevel: data.currentLevel || 0,
          });
        } catch (err) {
          console.error("Failed to fetch progress", err);
        }
      }
    }
    fetchProgress();
  }, [language]);

  // Pull the full profile (login/register responses are slim) in the background
  async function loadFullProfile() {
    try {
      const user = await apiRequest("/api/auth/me", { method: "GET" });
      applyUser(user);
    } catch (err) {
      console.error("Failed to load profile:", err.message);
    }
  }

  function handleLogin(data) {
    applyUser(data);
    loadFullProfile();
    if (data.language) {
      navigate("/dashboard");
    } else {
      navigate("/choose-path");
    }
  }

  function handleRegister(data) {
    applyUser(data);
    loadFullProfile();
    navigate("/choose-path");
  }

  // ChoosePath enrolls through /api/courses/enroll and hands back the updated user.
  function handleSelectPath(user) {
    applyUser(user);
    navigate("/dashboard");
  }

  // Switch the dashboard to another enrolled course (Module 1.3).
  async function handleSwitchCourse(lang) {
    if (lang === language) return;
    try {
      const user = await apiRequest("/api/courses/active", { method: "PUT", body: { language: lang } });
      setProgress({ doneLevels: [], stars: {}, currentLevel: 0 });
      applyUser(user);
    } catch (err) {
      alert(err.message || "Could not switch course");
    }
  }

  async function handleLogout() {
    // Ends the session on the server too, so the token cannot be reused (Module 1.4).
    try {
      if (getToken()) await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Already expired or offline — clearing locally is enough.
    }
    clearToken();
    setEnrollments([]);
    setUsername("");
    setEmail("");
    setLanguage(null);
    setProfile({ firstName: "", lastName: "", dob: "", contact: "", avatarUrl: "", createdAt: "" });
    navigate("/");
  }

  function handleLevelComplete(index, stars, serverProgress) {
    // Prefer the server's graded progress; fall back to a local update.
    if (serverProgress) {
      setProgress({
        doneLevels: serverProgress.doneLevels || [],
        stars: serverProgress.stars || {},
        currentLevel: serverProgress.currentLevel || 0,
      });
      return;
    }
    setProgress(prev => ({
      doneLevels: prev.doneLevels.includes(index)
        ? prev.doneLevels
        : [...prev.doneLevels, index],
      stars: { ...prev.stars, [index]: stars },
      currentLevel: Math.min(index + 1, 19),
    }));
  }

  if (isInitializing) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          height: "100vh",
          background: "#FFFDFA",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#14325D",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "4px solid rgba(20,50,93,0.12)",
            borderTopColor: "#F49B00",
            animation: "cmxSpin 0.7s linear infinite",
          }}
        />
        <div style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
          Restoring your session…
        </div>
        <style>{`@keyframes cmxSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full font-body overflow-hidden bg-background">
      <AnimatedBackground />
      <div className="relative z-10 h-full w-full">
        <Routes>
          <Route 
            path="/" 
            element={
              getToken() ? (
                language ? <Navigate to="/dashboard" replace /> : <Navigate to="/choose-path" replace />
              ) : (
                <CodeMentorLanding onLogin={handleLogin} onRegister={handleRegister} />
              )
            } 
          />
          <Route 
            path="/choose-path" 
            element={
              <ProtectedRoute>
                <ChoosePath
                  username={username}
                  enrollments={enrollments}
                  onSelectPath={handleSelectPath}
                  onBack={language ? () => navigate("/dashboard") : null}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {language ? (
                  <Dashboard
                    username={username}
                    email={email}
                    language={language}
                    profile={profile}
                    progress={progress}
                    onLevelOpen={(index) => navigate(`/level/${index}`)}
                    onLogout={handleLogout}
                    onUpdateProfile={applyUser}
                    enrollments={enrollments}
                    emailVerified={account.emailVerified}
                    onSwitchCourse={handleSwitchCourse}
                    onAddCourse={() => navigate("/choose-path")}
                  />
                ) : (
                  <Navigate to="/choose-path" />
                )}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/level/:id" 
            element={
              <ProtectedRoute>
                {language ? (
                  <LevelWrapper 
                    username={username} 
                    language={language} 
                    progress={progress} 
                    onComplete={handleLevelComplete} 
                  />
                ) : (
                  <Navigate to="/choose-path" />
                )}
              </ProtectedRoute>
            } 
          />
          <Route
            path="/verify-email/:token"
            element={<VerifyEmail onVerified={() => setAccount((a) => ({ ...a, emailVerified: true }))} />}
          />
          <Route 
            path="/verify/:certId" 
            element={<VerifyCertificate />} 
          />
        </Routes>
      </div>
    </div>
  );
}
