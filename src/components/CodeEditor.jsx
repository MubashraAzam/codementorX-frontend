import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

// CodeMirror 6 editor for all five tracks (used by AI pair programming now,
// and by the coding environment in Module 4).
const LANGUAGE_SUPPORT = {
  python: () => python(),
  cpp: () => cpp(),
  java: () => java(),
  javascript: () => javascript(),
  react: () => javascript({ jsx: true }),
};

export default function CodeEditor({ value, onChange, language = "python", height = "420px", ariaLabel = "Code editor" }) {
  const host = useRef(null);
  const view = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Create the editor once per language.
  useEffect(() => {
    const state = EditorState.create({
      doc: value || "",
      extensions: [
        basicSetup,
        (LANGUAGE_SUPPORT[language] || LANGUAGE_SUPPORT.python)(),
        oneDark,
        EditorView.lineWrapping,
        EditorView.theme({ "&": { height, fontSize: "14px" }, ".cm-scroller": { fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace" } }),
        EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && onChangeRef.current) onChangeRef.current(u.state.doc.toString());
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return () => view.current?.destroy();
    // value is applied by the effect below; recreate only when the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, height]);

  // Apply outside changes (e.g. "load starter code") without losing the cursor on normal typing.
  useEffect(() => {
    const v = view.current;
    if (v && value !== undefined && value !== v.state.doc.toString()) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="rounded-2xl overflow-hidden border border-[#2b2f3a] shadow-sm" />;
}
