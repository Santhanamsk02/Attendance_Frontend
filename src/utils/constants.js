export const DEPARTMENTS = [
  { value: "Information Technology", label: "Information Technology (IT)" },
  { value: "Computer Science", label: "Computer Science & Engineering (CSE)" },
  { value: "Electronics & Communication", label: "Electronics & Communication (ECE)" },
  { value: "Mechanical Engineering", label: "Mechanical Engineering (MECH)" },
  { value: "Artificial Intelligence & Data Science", label: "AI & Data Science (AI&DS)" },
  { value: "Civil Engineering", label: "Civil Engineering (CIVIL)" },
  { value: "Electrical & Electronics", label: "Electrical & Electronics (EEE)" },
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// 4-year degree cohort batches
export const ACADEMIC_YEARS = [
  "2023-2027",
  "2024-2028",
  "2025-2029",
  "2026-2030",
  "2022-2026",
  "2021-2025",
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];


export const SUBJECT_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "laboratory", label: "Laboratory" },
  { value: "elective", label: "Elective" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];

// ── Timetable constants ──────────────────────────────────

export const SESSION_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "laboratory", label: "Laboratory" },
  { value: "tutorial", label: "Tutorial" },
  { value: "other", label: "Other" },
];

export const DAYS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
];

export const BREAK_TYPES = [
  { value: "TEA_BREAK", label: "Tea Break" },
  { value: "LUNCH_BREAK", label: "Lunch Break" },
  { value: "CUSTOM_BREAK", label: "Custom Break" },
];

export const OVERRIDE_TYPES = [
  { value: "HOLIDAY", label: "Holiday" },
  { value: "SPECIAL_WORKING_DAY", label: "Special Working Day" },
  { value: "SPECIAL_CLASS", label: "Special Class" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "CUSTOM", label: "Custom Override" },
];

export const HALF_DAY_TYPES = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "CUSTOM", label: "Custom" },
];

export const DEFAULT_TIMELINE = [
  { type: "period", id: "period-1", number: 1, label: "Period 1", start: "08:00", end: "08:50" },
  { type: "period", id: "period-2", number: 2, label: "Period 2", start: "08:50", end: "09:40" },
  { type: "period", id: "period-3", number: 3, label: "Period 3", start: "09:40", end: "10:30" },
  { type: "break", id: "tea-break-1", label: "Tea Break", breakType: "TEA_BREAK", start: "10:30", end: "10:45" },
  { type: "period", id: "period-4", number: 4, label: "Period 4", start: "10:45", end: "11:40" },
  { type: "period", id: "period-5", number: 5, label: "Period 5", start: "11:40", end: "12:40" },
  { type: "break", id: "lunch-break-1", label: "Lunch Break", breakType: "LUNCH_BREAK", start: "12:40", end: "13:15" },
  { type: "period", id: "period-6", number: 6, label: "Period 6", start: "13:15", end: "13:55" },
  { type: "period", id: "period-7", number: 7, label: "Period 7", start: "13:55", end: "14:30" },
  { type: "period", id: "period-8", number: 8, label: "Period 8", start: "14:30", end: "15:15" },
];
