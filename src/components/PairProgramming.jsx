import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Send, Search, Bug, Lightbulb, Wand2, Trash2, X, FileCode } from "lucide-react";
import CodeEditor from "./CodeEditor";
import RunPanel from "./RunPanel";
import { formatAIMarkdown } from "../utils/aiMarkdown";
import { mentor } from "../utils/mentor";

/**
 * Code Lab: Module 4.1 in-browser IDE (editor + Run + Visualize) together
 * with Module 3.2 — AI Pair Programming Mode.
 * Split screen: the student's code on the left, the AI mentor on the right.
 * The mentor sees the current code (and the task, if one is loaded) with every
 * message, and guides with hints instead of writing the whole solution.
 */
const ACTIONS = [
  { id: "explain", label: "Explain my code", icon: <Search size={15} /> },
  { id: "bugs", label: "Find bugs", icon: <Bug size={15} /> },
  { id: "hint", label: "I'm stuck", icon: <Lightbulb size={15} /> },
  { id: "improve", label: "Improve it", icon: <Wand2 size={15} /> },
];
const ACTION_TEXT = { explain: "Explain my code", bugs: "Find bugs in my code", hint: "I'm stuck — what's the next step?", improve: "How can I improve this code?" };

const storageKey = (language, levelIndex) => `cmx_pair_${language}_${levelIndex}`;
function loadSaved(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable: not critical */ }
}

export default function PairProgramming({ language, levelIndex, levelTitle, uiLang, task, onClearTask }) {
  const key = storageKey(language, levelIndex);
  // Saved code for this level wins; otherwise start from the exercise's starter code.
  const [code, setCode] = useState(() => loadSaved(key) || task?.starterCode || "");
  const [errorText, setErrorText] = useState("");
  const [showError, setShowError] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const endRef = useRef(null);

  useEffect(() => { save(key, code); }, [key, code]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy]);

  async function ask(action, text, errorOverride) {
    if (busy) return;
    if (action !== "chat" && !code.trim()) { setProblem("Write some code in the editor first."); return; }
    if (action === "chat" && !text.trim()) return;
    setBusy(true);
    setProblem("");
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: action === "chat" ? text : ACTION_TEXT[action] }]);
    if (action === "chat") setInput("");
    try {
      const res = await mentor("pair", {
        language, levelIndex, uiLang, action, code,
        message: action === "chat" ? text : "",
        error: errorOverride ?? (showError ? errorText : ""),
        task: task ? `${task.title}\n${task.description}${task.expectedOutput ? `\nExpected output: ${task.expectedOutput}` : ""}` : "",
        history,
      });
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
    } catch (err) {
      setProblem(err.message || "The mentor could not reply right now.");
      setMessages((m) => m.slice(0, -1));
      if (action === "chat") setInput(text);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-6 border border-[#ECE7F4] flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" }}><Users size={22} /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-black text-accent">Code Lab · AI Pair Programming</h3>
          <p className="text-sm text-gray-500 font-medium">Write and run your code on the left. Your AI partner on the right sees your code and guides you without taking over.</p>
        </div>
      </div>

      {task && (
        <div className="bg-[#EEF3FF] border-2 border-[#C9D6FB] rounded-2xl p-4 flex gap-3 items-start">
          <FileCode size={18} className="text-[#4F6BD8] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-bold text-accent">{task.title}</div>
            <div className="text-accent/70 font-medium whitespace-pre-wrap">{task.description}</div>
            {task.expectedOutput && <div className="mt-1 text-accent/70"><b>Expected:</b> <code className="font-mono text-xs">{task.expectedOutput}</code></div>}
            {task.starterCode && code !== task.starterCode && (
              <button onClick={() => setCode(task.starterCode)} className="mt-2 text-xs font-bold text-[#4F6BD8] hover:underline">Load starter code</button>
            )}
          </div>
          <button onClick={onClearTask} className="p-1 text-gray-400 hover:text-accent" aria-label="Close task"><X size={16} /></button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* EDITOR */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-gray-400">
            <span>Your code · Level {levelIndex + 1}: {levelTitle}</span>
            {code && <button onClick={() => setCode("")} className="flex items-center gap-1 hover:text-accent normal-case"><Trash2 size={12} /> Clear</button>}
          </div>
          <CodeEditor value={code} onChange={setCode} language={language} height="380px" ariaLabel="Code Lab editor" />
          <RunPanel
            language={language}
            code={code}
            onError={(err) => {
              setErrorText(err);
              setShowError(true);
              ask("chat", "I got this error when I ran my code. What does it mean and how do I fix it?", err);
            }}
          />
          <label className="flex items-center gap-2 text-sm font-bold text-accent/70 cursor-pointer select-none">
            <input type="checkbox" checked={showError} onChange={(e) => setShowError(e.target.checked)} />
            I got an error or wrong output
          </label>
          {showError && (
            <textarea value={errorText} onChange={(e) => setErrorText(e.target.value)} rows={3} maxLength={2000}
              placeholder="Paste the error message or the output you got…"
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2 font-mono text-xs text-accent focus:border-[#9B7DF0] focus:outline-none" />
          )}
        </div>

        {/* MENTOR */}
        <div className="bg-white rounded-3xl border border-[#ECE7F4] flex flex-col min-w-0 lg:h-[560px]">
          <div className="p-4 border-b border-[#F0EBF7] flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button key={a.id} onClick={() => ask(a.id, "")} disabled={busy}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-[#E0D5F7] text-[#8B6FE8] bg-[#F7F4FE] hover:bg-[#EFE9FD] disabled:opacity-50">
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px]">
            {messages.length === 0 && !busy && (
              <div className="text-sm text-gray-400 font-medium text-center mt-10 px-6">
                Start coding, then press a button above or type a question below. I'll guide you step by step.
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "user"
                  ? <div className="max-w-[85%] bg-[#8B6FE8] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium whitespace-pre-wrap">{m.content}</div>
                  : <div className="max-w-[95%] bg-[#FAF8FE] rounded-2xl rounded-bl-md p-4 border border-[#ECE7F4] text-sm" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(m.content) }} />}
              </motion.div>
            ))}
            {busy && <div className="text-sm font-bold text-gray-400">Your partner is reading your code…</div>}
            <div ref={endRef} />
          </div>
          {problem && <div className="px-4 pb-2 text-sm text-red-600 font-medium">{problem}</div>}
          <div className="p-3 border-t border-[#F0EBF7] flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask("chat", input)}
              placeholder="Ask your partner…" maxLength={2000}
              className="flex-1 min-w-0 bg-[#FAF8FE] border-2 border-[#ECE7F4] rounded-xl px-3 py-2 text-sm font-medium text-accent focus:border-[#9B7DF0] focus:outline-none" />
            <button onClick={() => ask("chat", input)} disabled={busy || !input.trim()} className="bg-[#8B6FE8] text-white rounded-xl px-4 disabled:opacity-50" aria-label="Send"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
