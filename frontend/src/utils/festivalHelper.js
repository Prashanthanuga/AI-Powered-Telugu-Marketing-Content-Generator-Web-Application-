// Approximate festival dates. Owner can override tone anytime.
const FESTIVALS_2026 = [
  { name: "Sankranti", date: "2026-01-14" },
  { name: "Ugadi", date: "2026-03-19" },
  { name: "Sri Rama Navami", date: "2026-03-27" },
  { name: "Ramzan (Eid al-Fitr)", date: "2026-03-20" },
  { name: "Bonalu", date: "2026-07-05" },
  { name: "Bathukamma", date: "2026-10-11" },
  { name: "Dasara", date: "2026-10-20" },
  { name: "Deepavali", date: "2026-11-08" },
  { name: "Christmas", date: "2026-12-25" },
  { name: "New Year", date: "2027-01-01" },
];

export function upcomingFestival() {
  const now = new Date();
  for (const f of FESTIVALS_2026) {
    const d = new Date(f.date);
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 7) return { ...f, daysAway: Math.ceil(diff) };
  }
  return null;
}
