import { useEffect, useRef, useState } from "react";
import { Dots, Icon, Md } from "./ui";

/**
 * Right-hand AI panel. On most tabs it is the AI tutor (Module 3.3, /api/mentor/ask);
 * on the Code tab it is the AI pair-programming partner (Module 3.2, /api/mentor/pair).
 * Small EN | اردو switch, voice input and "read aloud". No teacher picture.
 */
export default function TutorPanel({ title, sub, chat, onSend, chips = [], uiLang, setUiLang, speakText, langFence, placeholder }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [note, setNote] = useState("");
  const chatRef = useRef(null);
  const recRef = useRef(null);
  const langRef = useRef(null);
  const pillRef = useRef(null);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.busy]);

  useEffect(() => {
    const on = langRef.current?.querySelector("button.on");
    if (on && pillRef.current) {
      pillRef.current.style.left = `${on.offsetLeft}px`;
      pillRef.current.style.width = `${on.offsetWidth}px`;
    }
  }, [uiLang]);

  useEffect(() => () => {
    recRef.current?.stop?.();
    window.speechSynthesis?.cancel();
  }, []);

  function send() {
    const v = text.trim();
    if (!v || chat.busy) return;
    setText("");
    onSend(v);
  }

  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setNote("Voice input works in Chrome and Edge.");
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
    setNote("");
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

  return (
    <section className="card tutor">
      <div className="thd">
        <span className="av">&gt;_</span>
        <div><b>{title}</b><small><i />{sub}</small></div>
        <div className="lsw" ref={langRef} role="group" aria-label="Explanation language">
          <span className="li" ref={pillRef} />
          <button type="button" className={uiLang === "en" ? "on" : ""} onClick={() => setUiLang("en")}>EN</button>
          <button type="button" className={`ur${uiLang === "ur" ? " on" : ""}`} style={{ fontSize: 14 }} onClick={() => setUiLang("ur")}>اردو</button>
        </div>
      </div>
      <div className="chat" ref={chatRef} aria-live="polite">
        {chat.messages.map((m, i) => (
          <div key={i} className={`msg${m.who === "me" ? " me" : ""}${m.ur ? " ur-mixed" : ""}${m.error ? " err" : ""}`} dir="auto">
            {m.who === "ai" && <small>{title.toUpperCase()}</small>}
            {m.who === "ai" ? <Md text={m.text} lang={langFence} /> : m.text}
          </div>
        ))}
        {chat.busy && <div className="msg"><Dots /></div>}
      </div>
      {chips.length > 0 && (
        <div className="qs">
          {chips.map((c) => (
            <button key={c.label} type="button" onClick={c.onClick} disabled={chat.busy}>{c.label}</button>
          ))}
        </div>
      )}
      <form className="ask" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <button type="button" className={`ib${recording ? " rec" : ""}`} onClick={toggleMic} aria-label={recording ? "Stop voice input" : "Speak your question"}><Icon name="mic" /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} dir="auto" maxLength={2000} aria-label={`Message the ${title}`} />
        <button type="submit" className="ib send" aria-label="Send" disabled={chat.busy || !text.trim()}><Icon name="send" /></button>
      </form>
      {note && <div className="errbox" style={{ margin: "0 16px 12px" }}>{note}</div>}
      {speakText && (
        <button type="button" className={`speak${speaking ? " on" : ""}`} onClick={toggleSpeak}>
          <Icon name="speaker" />{speaking ? "Stop reading" : "Read the lesson aloud"}
          <span className="wave"><i /><i /><i /><i /><i /></span>
        </button>
      )}
    </section>
  );
}
