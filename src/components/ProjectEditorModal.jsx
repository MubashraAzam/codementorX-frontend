import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import CodeEditor from "./CodeEditor";
import RunPanel from "./RunPanel";

/**
 * Module 4.1 / 4.3 — write a project solution in the browser IDE, run it,
 * then submit it for AI review (instead of uploading a file).
 */
const keyFor = (language, projectId) => `cmx_project_${language}_${projectId}`;

export default function ProjectEditorModal({ language, project, extension, onSubmit, onClose }) {
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem(keyFor(language, project.id)) || ""; } catch { return ""; }
  });
  useEffect(() => {
    try { localStorage.setItem(keyFor(language, project.id), code); } catch { /* not critical */ }
  }, [code, language, project.id]);

  const fileName = `${language === "java" ? "Main" : "main"}${extension}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-label={`Code editor for ${project.title}`}>
      <div className="bg-[#FFFDFA] rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-start gap-4 px-5 py-4 border-b border-[#ECE7F4]">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-black text-accent text-lg">{project.title}</h3>
            <p className="text-sm text-gray-500 font-medium">{project.desc}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" aria-label="Close editor"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <CodeEditor value={code} onChange={setCode} language={language} height="360px" ariaLabel="Project code editor" />
          {language === "java" && <p className="text-xs text-gray-400 font-bold">Java: put your main method in a class named Main.</p>}
          <RunPanel language={language} code={code} />
        </div>
        <div className="px-5 py-4 border-t border-[#ECE7F4] flex flex-wrap items-center gap-3 justify-end">
          <span className="text-xs text-gray-400 font-bold mr-auto">Your code is saved in this browser automatically.</span>
          <button className="btn-game btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-game btn-cute" disabled={!code.trim()} onClick={() => onSubmit(code, fileName)}>
            <Send size={16} /> Submit for review
          </button>
        </div>
      </div>
    </div>
  );
}
