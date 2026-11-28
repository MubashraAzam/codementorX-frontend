// Data used by the new dashboard (PinkDashboard.jsx).
// Level and project names are copied from the existing Dashboard.jsx and
// Certificate.jsx, so everything stays in sync with the rest of the app.

export const LEVELS = {
  python: [
    "Hello World & Setup", "Variables & Types", "Input & Output", "Conditions", "Loops",
    "Functions", "Lists & Arrays", "Strings", "Dictionaries", "File Handling",
    "Error Handling", "OOP — Classes", "OOP — Inheritance", "Modules", "Problem Solving I",
    "Recursion", "Data Structures", "Algorithms", "Mini Project", "Final Challenge",
  ],
  cpp: [
    "Setup & First Program", "Variables & Types", "Input & Output", "Conditions", "Loops",
    "Functions", "Arrays", "Strings", "Pointers", "File Handling",
    "Error Handling", "OOP — Classes", "OOP — Inheritance", "Templates", "STL",
    "Recursion", "Data Structures", "Algorithms", "Mini Project", "Final Challenge",
  ],
};

export const PROJECTS = {
  python: [
    "Student Grade Calculator", "Library Book Manager", "Simple ATM Machine", "Weather Data Analyzer",
    "Contact Book App", "Quiz Game", "Expense Tracker", "Text-Based Adventure Game",
    "Student Management System", "Chat Bot (Rule-Based)",
  ],
  cpp: [
    "Temperature Converter", "Simple Calculator", "Number Guessing Game", "Student Record System",
    "Linked List Implementation", "Bank Account System", "Stack & Queue Library", "Mini Shell Interpreter",
    "Binary Search Tree", "Inventory Management System",
  ],
};

// Look of each track in the sidebar. Java / JavaScript / React are ready for v2.
export const TRACKS = {
  python: { name: "Python", tile: "py", color: "linear-gradient(135deg,#C2306A,#F07A8C)" },
  cpp: { name: "C++", tile: "C++", color: "linear-gradient(135deg,#5B1E5E,#D4609A)" },
  java: { name: "Java", tile: "Jv", color: "linear-gradient(135deg,#B4442E,#F29A7E)" },
  javascript: { name: "JavaScript", tile: "JS", color: "linear-gradient(135deg,#B07A12,#F2C14E)" },
  react: { name: "React", tile: "Re", color: "linear-gradient(135deg,#2C6E8F,#6FC3DF)" },
};

// Short tips the AI mentor card shows before the student asks anything.
export const TIPS = {
  general: [
    "Read the error message from the bottom up: the last line usually says what went wrong.",
    "Run your code after every small change. Small steps make bugs easy to find.",
    "Stuck? Explain your code line by line to the AI tutor. You often find the bug yourself.",
  ],
  java: [
    "Your class must be called Main, and every statement ends with a semicolon ;",
    "Use == for numbers but .equals() to compare two Strings.",
    "System.out.println() prints and moves to a new line; print() stays on the same line.",
  ],
  javascript: [
    "Use === instead of == so JavaScript does not change types behind your back.",
    "let can change, const cannot. Start with const and switch to let only when needed.",
    "console.log() is your best friend for seeing what a variable holds.",
  ],
  react: [
    "A component is just a function that returns JSX. Its name must start with a capital letter.",
    "Never change state directly. Always use the setter from useState.",
    "Each item in a list needs a unique key prop.",
  ],
  python: [
    "= stores a value, == compares two values. Mixing them up is the most common bug.",
    "Indentation is part of Python. Keep 4 spaces inside every if, for and def.",
    "Use print() to check a variable's value when your code does something strange.",
  ],
  cpp: [
    "In C++ 7 / 2 is 3, not 3.5. Write 7.0 / 2 to keep the decimal part.",
    "Every statement ends with ; — a missing semicolon is the top beginner error.",
    "Use cout to print a variable's value when your code does something strange.",
  ],
};

export const RULES = {
  totalLevels: 20,
  projectsNeeded: 5, // projects with 2★ or more needed for the AI viva
  projectPassStars: 2,
  vivaPassMark: 75, // same as PASS_THRESHOLD in Certificate.jsx
};
