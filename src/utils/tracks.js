// Display details for the five built-in tracks (Module 2.1).
// Levels and projects come from the backend (/api/curriculum/:language);
// this file only holds what the UI needs instantly: names, icons, colours.
export const TRACK_ORDER = ["python", "cpp", "java", "javascript", "react"];

export const TRACK_META = {
  python: {
    label: "Python", icon: "🐍", codeLang: "python", badge: "🏆 Most Popular",
    tagline: "The perfect first language — readable, powerful, and in demand everywhere.",
    focus: "Data science, web & AI projects", tile: "bg-blue-500",
  },
  cpp: {
    label: "C++", icon: "⚡", codeLang: "cpp", badge: "⚡ High Performance",
    tagline: "Master speed and control — the language behind games, systems, and OS.",
    focus: "Systems, games & OS projects", tile: "bg-indigo-600",
  },
  java: {
    label: "Java", icon: "☕", codeLang: "java", badge: "🏢 Industry Standard",
    tagline: "Strongly-typed OOP that powers Android apps and enterprise back-ends.",
    focus: "OOP, Android & backend projects", tile: "bg-orange-600",
  },
  javascript: {
    label: "JavaScript", icon: "🟨", codeLang: "javascript", badge: "🌐 Language of the Web",
    tagline: "Make web pages interactive and build full-stack apps with one language.",
    focus: "Web, DOM & async projects", tile: "bg-yellow-500",
  },
  react: {
    label: "React", icon: "⚛️", codeLang: "jsx", badge: "🚀 Modern Frontend",
    tagline: "Build fast, component-based user interfaces the way modern teams do.",
    focus: "Real UI & app projects", tile: "bg-cyan-600",
  },
};

export function trackMeta(language) {
  return TRACK_META[language] || { label: language || "Course", icon: "📘", codeLang: "", tile: "bg-gray-500" };
}
