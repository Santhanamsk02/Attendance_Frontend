/**
 * Formats ISO date string to readable format e.g. "Aug 12, 2026, 11:30 AM"
 */
export function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Returns department shorthand badge
 */
export function getDepartmentShort(dept) {
  if (!dept) return "";
  const map = {
    "Information Technology": "IT",
    "Computer Science": "CSE",
    "Electronics & Communication": "ECE",
    "Mechanical Engineering": "MECH",
    "Artificial Intelligence & Data Science": "AI&DS",
    "Civil Engineering": "CIVIL",
    "Electrical & Electronics": "EEE",
  };
  return map[dept] || dept;
}
