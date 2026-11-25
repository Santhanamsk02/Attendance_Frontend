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

export const ROMAN_YEARS = ["I", "II", "III", "IV"];

/**
 * Returns Roman numeral for an academic year (1..4) or computed from semester (1..8)
 * Also matches institutional academic batch strings and roll number prefixes:
 * - 2023-2027 / 2023... -> "IV"
 * - 2024-2028 / 2024... -> "III"
 * - 2025-2029 / 2025... -> "II"
 * - 2026-2030 / 2026... -> "I"
 */
export function getYearRoman(val) {
  if (!val && val !== 0) return "III";
  if (typeof val === "string") {
    const s = val.trim();
    if (s.includes("2023") || s.startsWith("2023")) return "IV";
    if (s.includes("2024") || s.startsWith("2024")) return "III";
    if (s.includes("2025") || s.startsWith("2025")) return "II";
    if (s.includes("2026") || s.startsWith("2026")) return "I";
  }
  const num = Number(val);
  if (isNaN(num) || num <= 0) return "III";
  // If it's already a year (1..4)
  if (num >= 1 && num <= 4) {
    return ROMAN_YEARS[num - 1] || "I";
  }
  // If it's a semester (5..8)
  const yr = Math.ceil(num / 2);
  return ROMAN_YEARS[yr - 1] || "III";
}

/**
 * Robust helper to resolve Year Roman numeral from a student object, roll number, or value.
 */
export function getStudentYear(student) {
  if (!student && student !== 0) return "III";
  if (typeof student === "object") {
    if (student.year_roman) return student.year_roman;
    const roll = student.roll_no || "";
    const batch = student.batch || student.academic_year || student.batch_name || "";
    if (batch.includes("2023") || roll.startsWith("2023")) return "IV";
    if (batch.includes("2024") || roll.startsWith("2024")) return "III";
    if (batch.includes("2025") || roll.startsWith("2025")) return "II";
    if (batch.includes("2026") || roll.startsWith("2026")) return "I";
    if (student.current_year) return getYearRoman(student.current_year);
    if (student.year) return getYearRoman(student.year);
    if (student.semester) return getYearRoman(student.semester);
    return "III";
  }
  return getYearRoman(student);
}

/**
 * Formats student year e.g. "Year IV"
 */
export function formatStudentYear(val) {
  const roman = getStudentYear(val);
  return roman ? `Year ${roman}` : "";
}
