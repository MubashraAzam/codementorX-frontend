import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, Mic, StopCircle, Send, Trash2 } from "lucide-react";
import { formatAIMarkdown } from "../utils/aiMarkdown";
import { mentor } from "../utils/mentor";

/**
 * Module 3.3 — "Ask the AI Tutor": confusion resolution by text or voice.
 * Keeps the conversation so follow-up questions have context; the tutor ends
 * each answer with a short question that checks understanding.
 */
export default function TutorChat({ language, levelIndex, uiLang, onSpeak }) {
  const [messages, setMessages] = useState([]); // { role: "user" | "assistant", content }
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, asking]);

  const voiceSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  function toggleRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (recording) { recognitionRef.current?.stop(); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = uiLang === "Urdu" ? "ur-PK" : "en-US";
    recognition.onresult = (e) => setQuestion((prev) => `${prev} ${e.results[0][0].transcript}`.trim());
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function send() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setError("");
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setQuestion("");
    try {
      const res = await mentor("ask", { language, levelIndex, uiLang, question: q, history });
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
    } catch (err) {
      setError(err.message || "The tutor could not answer right now.");
      setMessages((m) => m.slice(0, -1));
      setQuestion(q);
    }
    setAsking(false);
  }

  return (
    <div className="bg-[#8B6FE8]/5 border-2 border-[#8B6FE8]/20 rounded-3xl p-6 mt-8 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#8B6FE8]" />
          <h3 className="font-heading font-black text-accent text-sm uppercase tracking-wide">Ask the AI Tutor</h3>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-xs font-bold text-gray-400 hover:text-accent flex items-center gap-1">
            <Trash2 size={13} /> Clear chat
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "user" ? (
                <div className="max-w-[85%] bg-[#8B6FE8] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium whitespace-pre-wrap">{m.content}</div>
              ) : (
                <div className="max-w-[92%] bg-white rounded-2xl rounded-bl-md p-4 border-2 border-[#8B6FE8]/15 text-sm" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(m.content) }} />
              )}
            </motion.div>
          ))}
          {asking && <div className="text-sm font-bold text-gray-400">Tutor is thinking…</div>}
          <div ref={endRef} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex gap-2">
          {onSpeak && (
            <button onClick={onSpeak} title="Read the lesson aloud" aria-label="Read the lesson aloud" className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-[#8B6FE8]/30 text-accent hover:scale-105 hover:bg-[#8B6FE8]/10 transition-all shadow-sm">
              <Play size={20} className="ml-1" />
            </button>
          )}
          {voiceSupported && (
            <button onClick={toggleRecording} title="Ask by voice" aria-label={recording ? "Stop recording" : "Ask by voice"} className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${recording ? "bg-danger border-danger text-white animate-pulse" : "bg-white border-[#8B6FE8]/30 text-accent hover:scale-105 hover:bg-[#8B6FE8]/10"}`}>
              {recording ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
          )}
        </div>
        <div className="flex-1 w-full flex bg-white rounded-2xl border-2 border-[#8B6FE8]/20 overflow-hidden shadow-inner">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={messages.length ? "Ask a follow-up…" : "Confused about something? Ask here…"}
            className="flex-1 min-w-0 bg-transparent border-none outline-none px-4 py-3 text-sm font-medium text-accent"
            maxLength={2000}
          />
          <button onClick={send} disabled={asking || !question.trim()} className="bg-[#8B6FE8] text-white font-bold px-5 py-3 text-sm hover:bg-[#7B5FE0] disabled:opacity-50 transition-colors flex items-center gap-1.5">
            <Send size={15} /> Ask
          </button>
        </div>
      </div>
      {error && <div className="mt-3 text-sm text-red-600 font-medium">{error}</div>}
    </div>
  );
}
