const HISTORY_KEY = "tvreddy-history";
const DRAFT_KEY = "tvreddy-drafts";
const MAX = 100;

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

export function saveHistoryItem(item) {
  const list = loadHistory();
  list.unshift(item);
  const trimmed = list.slice(0, MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function deleteHistoryItem(id) {
  const list = loadHistory().filter((i) => i.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  return list;
}

export function saveDraft(draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch { return null; }
}

// Check similarity — simple word-set Jaccard
export function similarity(a, b) {
  const norm = (s) => (s || "").toLowerCase().split(/\s+/).filter(Boolean);
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / new Set([...A, ...B]).size;
}

export function findSimilar(offer, list = loadHistory()) {
  return list.slice(0, 20).find((it) => similarity(offer, it.offer) > 0.8);
}
