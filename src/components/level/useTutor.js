import { useState } from "react";

// Chat state for the right-hand panel (AI tutor on most tabs, AI pair partner on the Code tab).
// run(label, fetcher): shows the student's message, then the AI answer from fetcher(history).
export function useChat(greeting) {
  const [messages, setMessages] = useState(() => (greeting ? [{ who: "ai", text: greeting }] : []));
  const [busy, setBusy] = useState(false);

  async function run(label, fetcher, { ur = false } = {}) {
    if (busy) return;
    const history = messages.filter((m) => !m.greeting);
    setMessages((m) => [...m, { who: "me", text: label }]);
    setBusy(true);
    try {
      const text = await fetcher(history);
      setMessages((m) => [...m, { who: "ai", text: text || "Sorry, I could not answer that. Try asking in a different way.", ur }]);
    } catch (err) {
      setMessages((m) => [...m, { who: "ai", text: err?.message || "I could not reach the AI right now. Please try again in a moment.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  return { messages, busy, run, clear: () => setMessages([]) };
}
