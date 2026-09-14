/**
 * 12 distinct, harmonious subject color palettes.
 * Each has: grad (gradient classes), light (bg + border), text, badge, dot, accent CSS color, avatarGrad.
 */
export const SUBJECT_PALETTES = [
    // 0 — Red
    { grad: "from-red-500 to-rose-500", light: "bg-red-50 border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700", dot: "bg-red-400", accent: "#ef4444", leftBorder: "border-l-red-500", cellBg: "rgba(254,226,226,0.85)" },
    // 1 — Orange
    { grad: "from-orange-500 to-amber-500", light: "bg-orange-50 border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400", accent: "#f97316", leftBorder: "border-l-orange-500", cellBg: "rgba(255,237,213,0.85)" },
    // 2 — Amber/Yellow
    { grad: "from-amber-400 to-yellow-500", light: "bg-amber-50 border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400", accent: "#f59e0b", leftBorder: "border-l-amber-500", cellBg: "rgba(254,243,199,0.85)" },
    // 3 — Emerald/Green
    { grad: "from-emerald-500 to-green-500", light: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400", accent: "#10b981", leftBorder: "border-l-emerald-500", cellBg: "rgba(209,250,229,0.85)" },
    // 4 — Teal
    { grad: "from-teal-500 to-emerald-600", light: "bg-teal-50 border-teal-200", text: "text-teal-700", badge: "bg-teal-100 text-teal-700", dot: "bg-teal-400", accent: "#14b8a6", leftBorder: "border-l-teal-500", cellBg: "rgba(204,251,241,0.85)" },
    // 5 — Cyan
    { grad: "from-cyan-500 to-blue-400", light: "bg-cyan-50 border-cyan-200", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-400", accent: "#06b6d4", leftBorder: "border-l-cyan-500", cellBg: "rgba(207,250,254,0.85)" },
    // 6 — Blue
    { grad: "from-blue-500 to-indigo-500", light: "bg-blue-50 border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400", accent: "#3b82f6", leftBorder: "border-l-blue-500", cellBg: "rgba(219,234,254,0.85)" },
    // 7 — Indigo
    { grad: "from-indigo-500 to-violet-500", light: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400", accent: "#6366f1", leftBorder: "border-l-indigo-500", cellBg: "rgba(224,231,255,0.85)" },
    // 8 — Violet/Purple
    { grad: "from-violet-500 to-purple-500", light: "bg-violet-50 border-violet-200", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400", accent: "#8b5cf6", leftBorder: "border-l-violet-500", cellBg: "rgba(237,233,254,0.85)" },
    // 9 — Fuchsia/Pink
    { grad: "from-fuchsia-500 to-pink-500", light: "bg-fuchsia-50 border-fuchsia-200", text: "text-fuchsia-700", badge: "bg-fuchsia-100 text-fuchsia-700", dot: "bg-fuchsia-400", accent: "#d946ef", leftBorder: "border-l-fuchsia-500", cellBg: "rgba(250,232,255,0.85)" },
];

/**
 * Returns a consistent palette for a given subject code.
 * Same subject code → always the same palette index.
 */
export function getSubjectPalette(subjectCode = "") {
    let hash = 0;
    for (let i = 0; i < subjectCode.length; i++) {
        hash = (hash * 31 + subjectCode.charCodeAt(i)) >>> 0;
    }
    return SUBJECT_PALETTES[hash % SUBJECT_PALETTES.length];
}
