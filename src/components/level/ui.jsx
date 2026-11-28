import { useRef } from "react";
import { highlightLine, renderMarkdown, inlineMarkdown } from "./markup";

const PATHS = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  next: <path d="M5 12h14M13 5l7 7-7 7" />,
  left: <path d="M15 18l-6-6 6-6" />,
  right: <path d="M9 18l6-6-6-6" />,
  book: <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  pen: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  check: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  bulb: <><path d="M12 3a6 6 0 0 0-6 6c0 2.2 1.2 3.7 2.5 4.8V17h7v-3.2C16.8 12.7 18 11.2 18 9a6 6 0 0 0-6-6z" /><path d="M9.5 21h5" /></>,
  frame: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  warn: <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />,
  play: <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></>,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  speaker: <path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />,
  refresh: <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0" /></>,
  tick: <path d="M20 6L9 17l-5-5" />,
  sun: <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  spark: <path d="M12 3l1.9 5.8L20 10l-5 3.6L16.5 20 12 16.5 7.5 20 9 13.6 4 10l6.1-1.2z" />,
};

export function Icon({ name, className = "i" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function Star({ on, pop }) {
  return (
    <svg viewBox="0 0 24 24" className={`${on ? "on" : ""} ${pop || ""}`} aria-hidden="true">
      <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />
    </svg>
  );
}

export function Dots({ label }) {
  return (
    <div className="loading">
      <span className="dots"><i /><i /><i /></span>
      {label}
    </div>
  );
}

// Markdown from the AI, rendered safely (everything is escaped in markup.js).
export function Md({ text, lang, className, as: Tag = "div" }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(text, lang) }} />;
}
export function InlineMd({ text, className }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: inlineMarkdown(text) }} />;
}

// Read-only highlighted code block.
export function CodeBlock({ code, lang, file, runLine, errLine }) {
  const lines = String(code || "").replace(/\n$/, "").split("\n");
  return (
    <div className="code">
      {file !== null && (
        <div className="chead"><i /><i /><i /><span className="fn">{file}</span></div>
      )}
      <pre>
        {lines.map((l, i) => (
          <span
            key={i}
            className={`l${runLine === i + 1 ? " run" : ""}${errLine === i + 1 ? " err" : ""}`}
            data-n={i + 1}
            dangerouslySetInnerHTML={{ __html: highlightLine(l, lang) || " " }}
          />
        ))}
      </pre>
    </div>
  );
}

// Editable code: a transparent textarea on top of the highlighted lines.
export function CodeEditor({ value, onChange, lang, runLine, errLine, minHeight = 300, label = "Code editor" }) {
  const taRef = useRef(null);
  const lines = value.split("\n");
  const indentUnit = "    ";

  function replaceSelection(text, cursorOffset = text.length) {
    const ta = taRef.current;
    const { selectionStart: s, selectionEnd: e } = ta;
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + cursorOffset;
    });
  }

  function onKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      replaceSelection(indentUnit);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = e.currentTarget.selectionStart;
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const cur = value.slice(lineStart, s);
      let ind = cur.match(/^\s*/)[0];
      if (/[:{]\s*$/.test(cur)) ind += indentUnit;
      replaceSelection(`\n${ind}`);
    }
  }

  return (
    <div className="edscroll">
      <div className="edinner" style={{ "--edh": `${minHeight}px` }}>
        <pre aria-hidden="true">
          {lines.map((l, i) => (
            <span
              key={i}
              className={`l${runLine === i + 1 ? " run" : ""}${errLine === i + 1 ? " err" : ""}`}
              data-n={i + 1}
              dangerouslySetInnerHTML={{ __html: highlightLine(l, lang) || " " }}
            />
          ))}
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label={label}
        />
      </div>
    </div>
  );
}
