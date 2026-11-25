// Counts study minutes per day in this browser (localStorage).
// The dashboard adds 1 minute for every minute it is open.
// Optional: call addStudyMinute(username) once a minute in LevelPage too,
// so time spent inside levels is also counted.

export function dayKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function studyKey(username) {
  return `cmx_study_${username || "guest"}`;
}

export function readStudy(username) {
  try {
    return JSON.parse(localStorage.getItem(studyKey(username)) || "{}") || {};
  } catch {
    return {};
  }
}

export function addStudyMinute(username) {
  try {
    const all = readStudy(username);
    const k = dayKey(new Date());
    all[k] = (all[k] || 0) + 1;
    localStorage.setItem(studyKey(username), JSON.stringify(all));
  } catch {
    /* storage blocked — ignore */
  }
}
