import { useState } from "react";
import { askTutor } from "./levelAI";

// Chat state for the AI tutor panel. Tabs can call ask() too (Hint / More examples buttons).
export function useTutor(ctx, firstName) {
  const [messages, setMessages] = useState(() => [
    {
      who: "ai",
      text: `Hi ${firstName || "there"}! Today is **${ctx.level.title}**. Open the full lesson and ask me anything while you read. I can also explain in Urdu.`,
    },
  ]);
  const [busy, setBusy] = useState(false);

  async function ask(question) {
    const q = String(question || "").trim();
    if (!q || busy) return;
    const ur = ctx.uiLang === "ur";
    setMessages((m) => [...m, { who: "me", text: q }]);
    setBusy(true);
    try {
      const text = await askTutor(ctx, q, messages);
      setMessages((m) => [...m, { who: "ai", text: text || "Sorry, I could not answer that. Try asking in a different way.", ur }]);
    } catch {
      setMessages((m) => [...m, { who: "ai", text: "I could not reach the AI right now. Please try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  return { messages, busy, ask };
}
