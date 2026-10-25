import { apiRequest } from "./api";

// Levels and projects per track, fetched once from the backend and cached.
const cache = new Map();

export function fetchCurriculum(language) {
  if (!cache.has(language)) {
    const request = apiRequest(`/api/curriculum/${language}`, { method: "GET", auth: false }).catch((err) => {
      cache.delete(language); // allow a retry after a network error
      throw err;
    });
    cache.set(language, request);
  }
  return cache.get(language);
}
