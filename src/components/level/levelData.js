// Small display data for the level page. Level titles/topics come from the
// backend curriculum (Module 2.1) through the `levels` prop of LevelPage.

export const LANGS = {
  python: { name: "Python", ext: "py", fence: "python" },
  cpp: { name: "C++", ext: "cpp", fence: "cpp" },
  java: { name: "Java", ext: "java", fence: "java" },
  javascript: { name: "JavaScript", ext: "js", fence: "javascript" },
  react: { name: "React", ext: "jsx", fence: "javascript" },
};

export const QUESTION_TYPE = {
  concept: "Concept",
  output: "Predict the output",
  debug: "Find the bug",
};

// "en" / "ur" in the UI  ->  "English" / "Urdu" for the server
export const SERVER_LANG = { en: "English", ur: "Urdu" };

export function topicsOf(level) {
  return (level?.sub || "").split("·").map((t) => t.trim()).filter(Boolean);
}
