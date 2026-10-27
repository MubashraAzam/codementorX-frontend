import { apiRequest } from "./api";

// Module 3 — calls to the AI mentor. The server builds every prompt; we only
// send the level, the student's language preference and their own text/code.
export function mentor(path, { language, levelIndex, uiLang = "English", ...rest }) {
  return apiRequest(`/api/mentor/${path}`, {
    method: "POST",
    body: { language, levelIndex, uiLang, ...rest },
  });
}
