import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useParams } from "react-router-dom";
import CodeMentorLanding from "./components/CodeMentorLanding";
import ChoosePath from "./components/ChoosePath";
import Dashboard from "./components/Dashboard";
import LevelPage from "./components/LevelPage";
import AnimatedBackground from "./components/AnimatedBackground";
import { apiRequest, getToken, clearToken } from "./utils/api";

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
  const [language, setLanguage] = useState(null);
  const [progress, setProgress] = useState({
    doneLevels: [],
    stars: {},
    currentLevel: 0,
  });

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
        if (user) {
          setUsername(user.username);
          if (user.language) setLanguage(user.language);
        }
      } catch (err) {
        console.error("Session restore failed:", err.message);
      } finally {
        setIsInitializing(false);
      }
    }
    restoreSession();
  }, []);

  function handleLogin(data) {
    setUsername(data.username);
    if (data.language) setLanguage(data.language);
    navigate("/dashboard");
  }

  function handleRegister(data) {
    setUsername(data.username);
    navigate("/choose-path");
  }

  function handleSelectPath(lang) {
    setLanguage(lang);
    navigate("/dashboard");
  }

  function handleLogout() {
    clearToken();
    setUsername("");
    setLanguage(null);
    navigate("/");
  }

  function handleLevelComplete(index, stars) {
    setProgress(prev => ({
      doneLevels: prev.doneLevels.includes(index)
        ? prev.doneLevels
        : [...prev.doneLevels, index],
      stars: { ...prev.stars, [index]: stars },
      currentLevel: Math.min(index + 1, 19),
    }));
  }

  if (isInitializing) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#25367C" }}>Restoring session...</div>;
  }

  const ProtectedRoute = ({ children }) => {
    return getToken() ? children : <Navigate to="/" />;
  };

  return (
    <div className="relative min-h-screen w-full font-body overflow-hidden bg-background">
      <AnimatedBackground />
      <div className="relative z-10 h-full w-full">
        <Routes>
          <Route 
            path="/" 
            element={
              getToken() ? <Navigate to="/dashboard" /> : <CodeMentorLanding onLogin={handleLogin} onRegister={handleRegister} />
            } 
          />
          <Route 
            path="/choose-path" 
            element={
              <ProtectedRoute>
                <ChoosePath username={username} onSelectPath={handleSelectPath} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard
                  username={username}
                  language={language}
                  progress={progress}
                  onLevelOpen={(index) => navigate(`/level/${index}`)}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/level/:id" 
            element={
              <ProtectedRoute>
                <LevelWrapper 
                  username={username} 
                  language={language} 
                  progress={progress} 
                  onComplete={handleLevelComplete} 
                />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}
