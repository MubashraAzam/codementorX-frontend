// Level names + topics (same as the old LevelPage.jsx) and the fallback
// content used when the AI is slow or returns something we cannot read.

export const LEVELS = {
  python: [
    { title: "Hello World & Setup", cat: "beginner", sub: "print · comments · indentation" },
    { title: "Variables & Types", cat: "beginner", sub: "int · float · string · bool · type()" },
    { title: "Input & Output", cat: "beginner", sub: "input() · output · f-strings" },
    { title: "Conditions", cat: "beginner", sub: "if · elif · else · comparison operators" },
    { title: "Loops", cat: "beginner", sub: "for · while · break · continue · range()" },
    { title: "Functions", cat: "intermediate", sub: "def · parameters · return · scope" },
    { title: "Lists & Arrays", cat: "intermediate", sub: "list creation · indexing · slicing · methods" },
    { title: "Strings", cat: "intermediate", sub: "string methods · slicing · formatting" },
    { title: "Dictionaries", cat: "intermediate", sub: "key-value pairs · dict methods · iteration" },
    { title: "File Handling", cat: "intermediate", sub: "open() · read · write · with statement" },
    { title: "Error Handling", cat: "intermediate", sub: "try · except · finally · custom exceptions" },
    { title: "OOP — Classes", cat: "intermediate", sub: "class · __init__ · self · methods" },
    { title: "OOP — Inheritance", cat: "intermediate", sub: "inheritance · super() · polymorphism" },
    { title: "Modules", cat: "intermediate", sub: "import · pip · os · math · random" },
    { title: "Problem Solving I", cat: "intermediate", sub: "algorithms · Big-O · common patterns" },
    { title: "Recursion", cat: "advanced", sub: "recursive functions · base case · call stack" },
    { title: "Data Structures", cat: "advanced", sub: "stacks · queues · linked lists" },
    { title: "Algorithms", cat: "advanced", sub: "sorting · searching · binary search" },
    { title: "Mini Project", cat: "advanced", sub: "design · implementation · testing" },
    { title: "Final Challenge", cat: "advanced", sub: "capstone problems · review · certification" },
  ],
  cpp: [
    { title: "Setup & First Program", cat: "beginner", sub: "cout · cin · #include · main()" },
    { title: "Variables & Types", cat: "beginner", sub: "int · float · string · bool · auto" },
    { title: "Input & Output", cat: "beginner", sub: "cin · cout · endl · formatting" },
    { title: "Conditions", cat: "beginner", sub: "if · else if · else · switch" },
    { title: "Loops", cat: "beginner", sub: "for · while · do-while · break · continue" },
    { title: "Functions", cat: "intermediate", sub: "declaration · parameters · return · overloading" },
    { title: "Arrays", cat: "intermediate", sub: "1D/2D arrays · indexing · sorting" },
    { title: "Strings", cat: "intermediate", sub: "string class · methods · c-strings" },
    { title: "Pointers", cat: "intermediate", sub: "& · * · pointer arithmetic · references" },
    { title: "File Handling", cat: "intermediate", sub: "fstream · ifstream · ofstream · modes" },
    { title: "Error Handling", cat: "intermediate", sub: "try · catch · throw · exception classes" },
    { title: "OOP — Classes", cat: "intermediate", sub: "class · constructor · destructor · access specifiers" },
    { title: "OOP — Inheritance", cat: "intermediate", sub: "inheritance · virtual · polymorphism · override" },
    { title: "Templates", cat: "intermediate", sub: "function templates · class templates · generic programming" },
    { title: "STL", cat: "intermediate", sub: "vector · map · set · algorithms · iterators" },
    { title: "Recursion", cat: "advanced", sub: "recursive functions · base case · memoization" },
    { title: "Data Structures", cat: "advanced", sub: "linked list · stack · queue · tree" },
    { title: "Algorithms", cat: "advanced", sub: "sorting · searching · complexity · dynamic programming" },
    { title: "Mini Project", cat: "advanced", sub: "design · implementation · testing · documentation" },
    { title: "Final Challenge", cat: "advanced", sub: "capstone problems · review · certification" },
  ],
};

export const LANGS = {
  python: { name: "Python", ext: "py", fence: "python" },
  cpp: { name: "C++", ext: "cpp", fence: "cpp" },
  java: { name: "Java", ext: "java", fence: "java" },
  javascript: { name: "JavaScript", ext: "js", fence: "javascript" },
};

export const QUIZ_SIZE = 10;

// Stars from the MCQ score (same rule as before)
export function starsForScore(score) {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

export function topicsOf(level) {
  return (level?.sub || "").split("·").map((t) => t.trim()).filter(Boolean);
}

/* ---------------- fallbacks ---------------- */

export function fallbackOverview(level, langName) {
  const topics = topicsOf(level);
  return {
    bigIdea: `In this level you learn **${level.title}** in ${langName}: ${topics.join(", ")}. Open the full lesson for every detail with examples.`,
    flow: {
      type: "steps",
      title: "How it works",
      steps: topics.slice(0, 4).map((t, i) => ({ label: t, detail: i === 0 ? "Start here" : "Then this" })),
    },
    cards: topics.slice(0, 6).map((t) => ({ front: t.split(" ")[0], label: t, back: `Ask the tutor about ${t}` })),
    mistake: {
      title: "Read errors slowly",
      text: "Most beginner errors are a missing symbol or wrong indentation. Read the error line number first.",
      wrong: "",
      right: "",
    },
    recap: topics.slice(0, 4).map((t) => `I can use ${t}`),
    example: { file: `main.${langName === "C++" ? "cpp" : "py"}`, code: "", inputs: [] },
  };
}

export function fallbackQuiz(level) {
  return [
    { q: `Which topic is part of "${level.title}"?`, opts: [topicsOf(level)[0] || "this level", "Video editing", "Networking", "Printing photos"], ans: 0, exp: "It is one of this level's topics." },
  ];
}
