// Returns today's date as a local "YYYY-MM-DD" string.
// We build it from local date parts on purpose: new Date().toISOString() is in UTC and
// can roll over to the wrong day in our timezone. See docs/API_CONTRACT.md (3.8).
export function todayLocalISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
