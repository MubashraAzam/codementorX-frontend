import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Compass, Sparkles, RefreshCw, Trash2, CheckCircle, Circle,
  Lightbulb, PenTool, Bug, Rocket, Trophy,
} from "lucide-react";
import { apiRequest } from "../utils/api";
import { trackMeta } from "../utils/tracks";

/**
 * RoadmapPage — Module 2.4 AI Roadmap Generator
 * ---------------------------------------------
 * For languages/technologies without a built-in course. The student describes
 * what they want to learn; the AI returns ordered stages with concepts,
 * exercises, debugging practice and projects. Roadmaps are saved per account
 * and stages can be ticked off.
 */
export default function RoadmapPage({ onBack, onEnrollTrack }) {
  const [form, setForm] = useState({ topic: "", goal: "", experience: "beginner", hoursPerWeek: 5 });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState([]);
  const [active, setActive] = useState(null); // { roadmap, builtInTrack }
  const [opening, setOpening] = useState(false);

  async function loadList() {
    try {
      const data = await apiRequest("/api/roadmaps", { method: "GET" });
      setSaved(data.roadmaps || []);
      return data.roadmaps || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }

  useEffect(() => {
    (async () => {
      const list = await loadList();
      if (list.length) openRoadmap(list[0]._id);
    })();
    // load once on open
  }, []);

  async function openRoadmap(id) {
    setOpening(true);
    setError("");
    try {
      setActive(await apiRequest(`/api/roadmaps/${id}`, { method: "GET" }));
    } catch (err) {
      setError(err.message);
    }
    setOpening(false);
  }

  async function generate(e) {
    e.preventDefault();
    if (!form.topic.trim()) return setError("Enter the language or technology you want to learn.");
    setGenerating(true);
    setError("");
    try {
      const data = await apiRequest("/api/roadmaps", { method: "POST", body: form });
      setActive(data);
      await loadList();
      setForm((f) => ({ ...f, topic: "", goal: "" }));
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  async function toggleStage(index, done) {
    const id = active.roadmap._id;
    // Update immediately; roll back if the server refuses.
    setActive((a) => ({ ...a, roadmap: { ...a.roadmap, stages: a.roadmap.stages.map((s, i) => (i === index ? { ...s, done } : s)) } }));
    try {
      const data = await apiRequest(`/api/roadmaps/${id}/stages/${index}`, { method: "PATCH", body: { done } });
      setActive((a) => ({ ...a, roadmap: data.roadmap }));
      loadList();
    } catch (err) {
      setError(err.message);
      openRoadmap(id);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this roadmap?")) return;
    try {
      await apiRequest(`/api/roadmaps/${id}`, { method: "DELETE" });
      const list = await loadList();
      if (active?.roadmap?._id === id) {
        setActive(null);
        if (list.length) openRoadmap(list[0]._id);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const roadmap = active?.roadmap;
  const doneCount = roadmap ? roadmap.stages.filter((s) => s.done).length : 0;
  const pct = roadmap ? Math.round((doneCount / roadmap.stages.length) * 100) : 0;
  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const inputClass = "w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 font-bold text-accent placeholder:text-gray-300 placeholder:font-semibold focus:border-[#9B7DF0] focus:outline-none transition-colors";

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-screen bg-background">
      {/* HEADER */}
      <div className="h-20 bg-white/70 backdrop-blur-xl border-b border-[#ECE7F4] flex items-center gap-4 px-6 shrink-0 z-20">
        <button onClick={onBack} className="p-2 rounded-xl border border-[#ECE7F4] hover:bg-gray-50 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#6E8BF5,#9B7DF0)" }}>
          <Compass size={22} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-heading font-black text-accent tracking-tight truncate">AI Roadmap Generator</h1>
          <p className="text-xs text-gray-400 font-semibold truncate hidden sm:block">A personalised learning path for any language or technology</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* LEFT: form + saved */}
          <div className="space-y-6">
            <form onSubmit={generate} className="bg-white rounded-3xl p-6 border border-[#ECE7F4] shadow-sm space-y-4">
              <h2 className="font-heading font-black text-accent flex items-center gap-2"><Sparkles size={18} className="text-[#8B6FE8]" /> New roadmap</h2>
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-gray-400">What do you want to learn?</label>
                <input className={inputClass + " mt-1"} placeholder="e.g. Go, Kotlin, SQL, Django" value={form.topic} onChange={field("topic")} maxLength={60} />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-gray-400">Your goal (optional)</label>
                <input className={inputClass + " mt-1"} placeholder="e.g. build REST APIs, get an internship" value={form.goal} onChange={field("goal")} maxLength={200} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-gray-400">Your level</label>
                  <select className={inputClass + " mt-1"} value={form.experience} onChange={field("experience")}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-gray-400">Hours / week</label>
                  <input type="number" min={1} max={40} className={inputClass + " mt-1"} value={form.hoursPerWeek} onChange={field("hoursPerWeek")} />
                </div>
              </div>
              <button type="submit" className="btn-game btn-cute w-full" disabled={generating}>
                {generating ? <><RefreshCw size={18} className="animate-spin" /> Generating…</> : <><Sparkles size={18} /> Generate roadmap</>}
              </button>
              {error && <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}
            </form>

            <div className="bg-white rounded-3xl p-6 border border-[#ECE7F4] shadow-sm">
              <h2 className="font-heading font-black text-accent mb-3">My roadmaps</h2>
              {saved.length === 0 && <p className="text-sm text-gray-400 font-medium">No roadmaps yet. Generate your first one above.</p>}
              <div className="space-y-2">
                {saved.map((r) => (
                  <div key={r._id} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${roadmap?._id === r._id ? "border-[#C9D6FB] bg-[#EEF3FF]" : "border-transparent hover:bg-[#F6F1FB]"}`}>
                    <button onClick={() => openRoadmap(r._id)} className="flex-1 min-w-0 text-left">
                      <div className="font-bold text-sm text-accent truncate">{r.topic}</div>
                      <div className="text-xs text-gray-400 font-semibold">{r.doneCount}/{r.stageCount} stages · {r.experience}</div>
                    </button>
                    <button onClick={() => remove(r._id)} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50" aria-label={`Delete ${r.topic} roadmap`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: roadmap */}
          <div className="space-y-5 min-w-0">
            {(generating || opening) && (
              <div className="bg-white rounded-3xl p-10 border border-[#ECE7F4] text-center text-gray-400 font-bold">
                <RefreshCw className="mx-auto animate-spin text-[#8B6FE8] mb-4" size={32} />
                {generating ? "Building your personalised roadmap…" : "Opening roadmap…"}
              </div>
            )}

            {!generating && !opening && !roadmap && (
              <div className="bg-white rounded-3xl p-10 border border-[#ECE7F4] text-center">
                <Compass className="mx-auto text-[#8B6FE8]" size={44} />
                <h2 className="font-heading font-black text-2xl text-accent mt-4">Learn anything, step by step</h2>
                <p className="text-gray-500 font-medium mt-2 max-w-md mx-auto">
                  Tell the AI which language or technology you want, and it will plan the concepts, practice, debugging tasks and projects in the right order.
                </p>
              </div>
            )}

            {!generating && !opening && roadmap && (
              <>
                {active.builtInTrack && (
                  <div className="rounded-2xl border-2 border-[#C9D6FB] bg-[#EEF3FF] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-3xl">{trackMeta(active.builtInTrack).icon}</div>
                    <div className="flex-1 font-medium text-accent">
                      <b>{trackMeta(active.builtInTrack).label}</b> has a full CodeMentorX course with lessons, assessments, projects and a certificate.
                    </div>
                    <button className="btn-game btn-cute text-sm py-2 px-4 shrink-0" onClick={() => onEnrollTrack && onEnrollTrack(active.builtInTrack)}>
                      Open the course
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE7F4] shadow-sm">
                  <div className="text-xs font-black uppercase tracking-wide text-[#8B6FE8]">{roadmap.topic} · {roadmap.experience} · {roadmap.hoursPerWeek} h/week</div>
                  <h2 className="font-heading font-black text-2xl text-accent mt-1">{roadmap.title}</h2>
                  {roadmap.goal && <p className="text-sm font-bold text-gray-500 mt-1">Goal: {roadmap.goal}</p>}
                  {roadmap.overview && <p className="text-accent/80 font-medium mt-3">{roadmap.overview}</p>}
                  <div className="mt-5">
                    <div className="flex justify-between text-sm font-bold text-accent mb-1">
                      <span>{doneCount} of {roadmap.stages.length} stages done</span><span>{pct}%</span>
                    </div>
                    <div className="h-3 bg-[#EEF0F7] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6E8BF5,#9B7DF0)" }} />
                    </div>
                  </div>
                </div>

                {roadmap.stages.map((stage, i) => (
                  <div key={i} className={`bg-white rounded-3xl p-6 border shadow-sm ${stage.done ? "border-[#BDE7CE]" : "border-[#ECE7F4]"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${stage.done ? "bg-[#E7F6EE] text-[#2E9D62]" : "bg-[#F0EBFC] text-[#8B6FE8]"}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="font-heading font-black text-lg text-accent">{stage.title}</h3>
                          {stage.duration && <span className="text-xs font-bold text-gray-400">{stage.duration}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {stage.concepts.map((c) => (
                            <span key={c} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#EEF3FF] text-[#4F6BD8]">{c}</span>
                          ))}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                          {stage.exercises.length > 0 && (
                            <StageList icon={<PenTool size={14} />} title="Practice" items={stage.exercises} />
                          )}
                          {stage.debugging.length > 0 && (
                            <StageList icon={<Bug size={14} />} title="Debugging practice" items={stage.debugging} />
                          )}
                        </div>
                        {stage.project?.title && (
                          <div className="mt-4 rounded-2xl bg-[#FFF7EA] border border-[#F7D9A8] p-4 text-sm">
                            <div className="font-bold text-accent flex items-center gap-2"><Rocket size={14} className="text-[#C77800]" /> Project: {stage.project.title}</div>
                            {stage.project.desc && <div className="text-accent/70 font-medium mt-1">{stage.project.desc}</div>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleStage(i, !stage.done)}
                        className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${stage.done ? "bg-[#E7F6EE] border-[#BDE7CE] text-[#2E9D62]" : "border-[#ECE7F4] text-gray-400 hover:text-accent"}`}
                      >
                        {stage.done ? <CheckCircle size={15} /> : <Circle size={15} />}
                        <span className="hidden sm:inline">{stage.done ? "Done" : "Mark done"}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {roadmap.capstone?.title && (
                  <div className="rounded-3xl p-6 border-2 border-[#8B6FE8] bg-white shadow-sm">
                    <div className="font-heading font-black text-accent text-lg flex items-center gap-2"><Trophy size={18} className="text-[#F49B00]" /> Capstone: {roadmap.capstone.title}</div>
                    {roadmap.capstone.desc && <p className="text-accent/80 font-medium mt-2">{roadmap.capstone.desc}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StageList({ icon, title, items }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-wide text-gray-400 flex items-center gap-1.5 mb-2">{icon} {title}</div>
      <ul className="space-y-1.5">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2 text-accent/80 font-medium">
            <Lightbulb size={14} className="text-[#F49B00] shrink-0 mt-0.5" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
