import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, CheckCircle, Code, Terminal, Trophy, Users, Star, ArrowRight } from "lucide-react";
import { apiRequest } from "../utils/api";

export default function ChoosePath({ username = "Student", onSelectPath }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
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

  async function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    try {
      await apiRequest("/api/auth/profile", {
        method: "PUT",
        body: { language: selected },
      });
      if (onSelectPath) onSelectPath(selected);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-body">
      {/* TOP BAR */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : -20 }}
        className="flex justify-between items-center px-8 py-6 relative z-10"
      >
        <div className="flex items-center gap-2 font-heading font-black text-2xl text-accent">
          <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-gamified">🎓</div>
          CodeMentorX
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border-2 border-gray-200 shadow-sm font-bold text-accent text-sm">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
            {username[0].toUpperCase()}
          </div>
          Welcome, {username}!
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 20 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading font-black text-4xl md:text-5xl text-accent mb-4">
            Choose Your <span className="text-primary">Learning Path</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-lg mx-auto">
            Pick the programming language you want to master. 20 structured levels from beginner to advanced await you.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-4xl">
          {/* PYTHON CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 40 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setSelected("python")}
            className={`
              relative w-full max-w-sm rounded-3xl p-8 cursor-pointer transition-all duration-300 border-4 shadow-gamified
              ${selected === "python" ? "border-primary bg-yellow-50" : "border-gray-200 bg-white hover:border-gray-300"}
            `}
          >
            {selected === "python" && <div className="absolute top-4 right-4 text-primary"><CheckCircle size={28} className="fill-yellow-100" /></div>}
            <div className="absolute -top-4 -left-4 bg-primary text-white text-xs font-black px-4 py-1.5 rounded-full rotate-[-5deg] shadow-sm">
              🏆 Most Popular
            </div>
            <div className="text-6xl mb-4">🐍</div>
            <h2 className="font-heading font-black text-3xl text-accent mb-2">Python</h2>
            <p className="text-gray-500 font-medium text-sm mb-6 leading-relaxed">
              The perfect first language — readable, powerful, and in demand everywhere.
            </p>
            <ul className="space-y-3 mb-8">
              {["20 progressive levels", "AI-generated lessons", "Data science & AI projects", "Completion certificate"].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">✓</div>
                  {feat}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-xl font-bold transition-colors ${selected === "python" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
              {selected === "python" ? "Python Selected" : "Select Python"}
            </button>
          </motion.div>

          {/* CPP CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 40 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setSelected("cpp")}
            className={`
              relative w-full max-w-sm rounded-3xl p-8 cursor-pointer transition-all duration-300 border-4 shadow-gamified
              ${selected === "cpp" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}
            `}
          >
            {selected === "cpp" && <div className="absolute top-4 right-4 text-blue-500"><CheckCircle size={28} className="fill-blue-100" /></div>}
            <div className="absolute -top-4 -left-4 bg-blue-500 text-white text-xs font-black px-4 py-1.5 rounded-full rotate-[-5deg] shadow-sm">
              ⚡ High Performance
            </div>
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="font-heading font-black text-3xl text-accent mb-2">C++</h2>
            <p className="text-gray-500 font-medium text-sm mb-6 leading-relaxed">
              Master speed and control — the language behind games, systems, and OS.
            </p>
            <ul className="space-y-3 mb-8">
              {["20 progressive levels", "AI-generated quizzes", "Systems & games projects", "Completion certificate"].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">✓</div>
                  {feat}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-xl font-bold transition-colors ${selected === "cpp" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>
              {selected === "cpp" ? "C++ Selected" : "Select C++"}
            </button>
          </motion.div>
        </div>

        {/* STATS ROW */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: step >= 4 ? 1 : 0, y: step >= 4 ? 0 : 20 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          {[
            { icon: <Users size={20}/>, val: "250k+", lbl: "Students" },
            { icon: <Trophy size={20}/>, val: "20", lbl: "Levels" },
            { icon: <Terminal size={20}/>, val: "AI", lbl: "Powered" },
          ].map((stat, i) => (
            <div key={i} className="bg-white px-5 py-3 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center gap-4">
              <div className="text-primary bg-yellow-50 p-2 rounded-lg">{stat.icon}</div>
              <div>
                <div className="font-black text-accent text-lg leading-none">{stat.val}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.lbl}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CONFIRM BUTTON */}
        <AnimatePresence>
          {selected && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-12 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
              <button 
                onClick={handleConfirm}
                disabled={confirming}
                className="pointer-events-auto btn-game btn-primary px-12 py-4 text-lg shadow-gamified hover:scale-105 active:scale-95 animate-pulse-border"
              >
                {confirming ? "Saving..." : "Start Learning Now!"} <ArrowRight />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
