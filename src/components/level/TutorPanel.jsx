import { useEffect, useRef, useState } from "react";
import { Dots, Icon, Md } from "./ui";

export default function TutorPanel({ tutor, uiLang, setUiLang, speakText, langFence, levelTitle }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const chatRef = useRef(null);
  const recRef = useRef(null);
  const langRef = useRef(null);
  const pillRef = useRef(null);

  // keep the chat scrolled to the newest message
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [tutor.messages.length, tutor.busy]);

  // slide the EN / اردو pill
  useEffect(() => {
    const on = langRef.current?.querySelector("button.on");
    if (on && pillRef.current) {
      pillRef.current.style.left = `${on.offsetLeft}px`;
      pillRef.current.style.width = `${on.offsetWidth}px`;
    }
  }, [uiLang]);

  // stop voice things when leaving the page
  useEffect(() => () => {
    recRef.current?.stop?.();
    window.speechSynthesis?.cancel();
  }, []);

  function send(q) {
    const v = (q ?? text).trim();
    if (!v) return;
    setText("");
    tutor.ask(v);
  }

  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alertBox("Voice input works in Chrome and Edge.");
      return;
    }
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const r = new SR();
    r.lang = uiLang === "ur" ? "ur-PK" : "en-US";
    r.onresult = (e) => setText((p) => `${p} ${e.results[0][0].transcript}`.trim());
    r.onend = () => setRecording(false);
    r.onerror = () => setRecording(false);
    recRef.current = r;
    r.start();
    setRecording(true);
  }

  function toggleSpeak() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance((speakText || "").slice(0, 4000));
    u.lang = uiLang === "ur" ? "ur-PK" : "en-US";
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  const chips = uiLang === "ur"
    ? ["آسان الفاظ میں سمجھائیں", "ایک اور مثال دیں", `${levelTitle} کیا ہے؟`]
    : ["Explain simpler", "Show another example", "Quiz me on this"];

  return (
    <section className="card tutor">
      <div className="thd">
        <span className="av">&gt;_</span>
        <div><b>AI Tutor</b><small><i />Knows this level</small></div>
        <div className="lsw" ref={langRef} role="group" aria-label="Tutor language">
          <span className="li" ref={pillRef} />
          <button type="button" className={uiLang === "en" ? "on" : ""} onClick={() => setUiLang("en")}>EN</button>
          <button type="button" className={`ur${uiLang === "ur" ? " on" : ""}`} style={{ fontSize: 14 }} onClick={() => setUiLang("ur")}>اردو</button>
        </div>
      </div>
      <div className="chat" ref={chatRef} aria-live="polite">
        {tutor.messages.map((m, i) => (
          <div key={i} className={`msg${m.who === "me" ? " me" : ""}${m.ur ? " ur ur-text" : ""}`}>
            {m.who === "ai" && <small>AI TUTOR</small>}
            {m.who === "ai" ? <Md text={m.text} lang={langFence} /> : m.text}
          </div>
        ))}
        {tutor.busy && <div className="msg"><Dots /></div>}
      </div>
      <div className="qs">
        {chips.map((c) => (
          <button key={c} type="button" className={uiLang === "ur" ? "ur" : ""} onClick={() => send(c)} disabled={tutor.busy}>{c}</button>
        ))}
      </div>
      <form className="ask" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <button type="button" className={`ib${recording ? " rec" : ""}`} onClick={toggleMic} aria-label={recording ? "Stop voice input" : "Speak your question"}><Icon name="mic" /></button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={uiLang === "ur" ? "ٹیوٹر سے کچھ بھی پوچھیں…" : "Ask the tutor anything…"}
          dir={uiLang === "ur" ? "rtl" : "ltr"}
          aria-label="Ask the tutor"
        />
        <button type="submit" className="ib send" aria-label="Send" disabled={tutor.busy}><Icon name="send" /></button>
      </form>
      <button type="button" className={`speak${speaking ? " on" : ""}`} onClick={toggleSpeak}>
        <Icon name="speaker" />{speaking ? "Stop reading" : "Read the lesson aloud"}
        <span className="wave"><i /><i /><i /><i /><i /></span>
      </button>
    </section>
  );
}

function alertBox(msg) {
  // a tiny non-blocking notice instead of window.alert()
  const n = document.createElement("div");
  n.textContent = msg;
  n.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100;padding:10px 16px;border-radius:12px;background:#2A0F1C;color:#fff;font:600 14px 'Plus Jakarta Sans',sans-serif";
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2600);
}
