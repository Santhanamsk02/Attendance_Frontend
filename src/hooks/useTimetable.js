import { useState, useCallback, useRef, useEffect } from "react";
import { DAYS, DEFAULT_TIMELINE } from "../utils/constants";
import { timetableService } from "../services/timetableService";

// ── helpers ──────────────────────────────────────────────

let _counter = Date.now();
const uid = (prefix = "id") => `${prefix}-${++_counter}`;

const buildEmptyDays = (includeSaturday = false) =>
    DAYS.filter(d => includeSaturday || d.value !== "SAT").map((d) => ({ day: d.value, entries: [] }));

const cloneTimeline = (tl) => tl.map((item) => ({ ...item }));

// Renumber period labels after timeline mutations
const renumberPeriods = (timeline) => {
    let num = 1;
    return timeline.map((item) => {
        if (item.type === "period") {
            return { ...item, number: num, label: `Period ${num++}` };
        }
        return { ...item };
    });
};

// ── validation helpers ───────────────────────────────────

const timeToMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

const periodsOnly = (timeline) => timeline.filter((i) => i.type === "period");

const getConsecutivePeriodIds = (timeline, startId, endId) => {
    const periods = periodsOnly(timeline);
    const si = periods.findIndex((p) => p.id === startId);
    const ei = periods.findIndex((p) => p.id === endId);
    if (si === -1 || ei === -1 || si > ei) return null;

    // Check no break exists between start and end in the full timeline
    const fullStart = timeline.findIndex((i) => i.id === startId);
    const fullEnd = timeline.findIndex((i) => i.id === endId);
    for (let i = fullStart; i <= fullEnd; i++) {
        if (timeline[i].type === "break") return null; // break inside span
    }

    return periods.slice(si, ei + 1).map((p) => p.id);
};

// ── main hook ────────────────────────────────────────────

export default function useTimetable() {
    const [context, setContextState] = useState({
        department: "",
        academic_year: "",
        semester: "",
        section: "",
    });

    const [timeline, setTimeline] = useState(() => cloneTimeline(DEFAULT_TIMELINE));
    const [days, setDays] = useState(buildEmptyDays);
    const [isDirty, setIsDirty] = useState(false);
    const [includeSaturday, setIncludeSaturday] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);
    const initialised = useRef(false);

    // ── Dynamic Draft Loading on Section Change ──────────
    useEffect(() => {
        if (!context.section) return; // Wait until section is set

        let mounted = true;

        const load = async () => {
            console.log("Loading draft for context:", context);
            let draft = await timetableService.loadDraft(context);
            if (!mounted) return;

            console.log("Draft received from service:", draft);

            // Defensive parsing just in case it's a string
            if (typeof draft === 'string') {
                try {
                    draft = JSON.parse(draft);
                    console.log("Parsed string draft to JSON:", draft);
                } catch (e) {
                    console.error("Failed to parse draft string", e);
                }
            }

            if (draft) {
                console.log("Draft valid! Arrays:", draft.timeline?.length, draft.days?.length);
                if (draft.timeline?.length) setTimeline(draft.timeline);
                if (draft.includeSaturday !== undefined) {
                    setIncludeSaturday(draft.includeSaturday);
                    if (draft.days?.length) setDays(draft.days);
                } else if (draft.days?.length) {
                    setDays(draft.days);
                }
                if (initialised.current) {
                    setDraftRestored(true);
                }
            } else {
                console.log("No draft found, loading templates.");
                // Reset to defaults if no draft for this section
                setTimeline(cloneTimeline(DEFAULT_TIMELINE));
                setDays(buildEmptyDays(includeSaturday));
                setIsDirty(false);
            }
            initialised.current = true;
        }

        load();

        return () => { mounted = false; };

    }, [context.department, context.academic_year, context.semester, context.section]);

    const markDirty = useCallback(() => setIsDirty(true), []);

    // ── Context ──────────────────────────────────────────
    const setContext = useCallback((newCtx) => {
        setContextState(newCtx);
    }, []);

    const isContextComplete = Boolean(
        context.department && context.academic_year && context.semester
    );

    const isSectionSelected = Boolean(context.section);

    const toggleSaturday = useCallback(() => {
        setIncludeSaturday((prev) => {
            const next = !prev;
            setDays((oldDays) => {
                if (next) {
                    // Add saturday to end if missing
                    if (!oldDays.find((d) => d.day === "SAT")) {
                        return [...oldDays, { day: "SAT", entries: [] }];
                    }
                    return oldDays;
                } else {
                    // Remove saturday
                    return oldDays.filter((d) => d.day !== "SAT");
                }
            });
            markDirty();
            return next;
        });
    }, [markDirty]);

    // ── Timeline operations ──────────────────────────────

    const addPeriod = useCallback((periodData, insertAfterIndex = null) => {
        setTimeline((prev) => {
            const newItem = {
                type: "period",
                id: uid("period"),
                number: 0,
                label: "",
                start: periodData.start || "",
                end: periodData.end || "",
            };
            const next = [...prev];
            if (insertAfterIndex !== null && insertAfterIndex >= 0 && insertAfterIndex < prev.length) {
                next.splice(insertAfterIndex + 1, 0, newItem);
            } else {
                next.push(newItem);
            }
            return renumberPeriods(next);
        });
        // Add empty slot in every day
        setDays((prev) =>
            prev.map((d) => ({ ...d, entries: [...d.entries] }))
        );
        markDirty();
    }, [markDirty]);

    const editPeriod = useCallback((periodId, updates) => {
        setTimeline((prev) =>
            prev.map((item) =>
                item.id === periodId ? { ...item, ...updates } : item
            )
        );
        markDirty();
    }, [markDirty]);

    const removePeriod = useCallback((periodId) => {
        setTimeline((prev) => renumberPeriods(prev.filter((i) => i.id !== periodId)));
        // Remove any entries referencing this period
        setDays((prev) =>
            prev.map((d) => ({
                ...d,
                entries: d.entries.filter((e) => {
                    if (e.timeline_item_id === periodId) return false;
                    if (e.start_timeline_item_id === periodId || e.end_timeline_item_id === periodId) return false;
                    // Also remove if this period is inside a span
                    return true;
                }),
            }))
        );
        markDirty();
    }, [markDirty]);

    const addBreak = useCallback((breakData, insertAfterIndex = null) => {
        setTimeline((prev) => {
            const newItem = {
                type: "break",
                id: uid("break"),
                label: breakData.label || "Break",
                breakType: breakData.breakType || "CUSTOM_BREAK",
                start: breakData.start || "",
                end: breakData.end || "",
            };
            const next = [...prev];
            if (insertAfterIndex !== null && insertAfterIndex >= 0 && insertAfterIndex < prev.length) {
                next.splice(insertAfterIndex + 1, 0, newItem);
            } else {
                next.push(newItem);
            }
            return renumberPeriods(next);
        });
        markDirty();
    }, [markDirty]);

    const editBreak = useCallback((breakId, updates) => {
        setTimeline((prev) =>
            prev.map((item) =>
                item.id === breakId ? { ...item, ...updates } : item
            )
        );
        markDirty();
    }, [markDirty]);

    const removeBreak = useCallback((breakId) => {
        setTimeline((prev) => renumberPeriods(prev.filter((i) => i.id !== breakId)));
        markDirty();
    }, [markDirty]);

    // ── Entry / Assignment operations ────────────────────

    const assignEntry = useCallback((dayValue, entryData) => {
        setDays((prev) =>
            prev.map((d) => {
                if (d.day !== dayValue) return d;
                const newEntry = {
                    id: uid("entry"),
                    day: dayValue,
                    timeline_item_id: entryData.timeline_item_id || null,
                    start_timeline_item_id: entryData.start_timeline_item_id || entryData.timeline_item_id || null,
                    end_timeline_item_id: entryData.end_timeline_item_id || entryData.timeline_item_id || null,
                    subject_id: entryData.subject_id || null,
                    subject_code: entryData.subject_code || "",
                    subject_name: entryData.subject_name || "",
                    teacher_id: entryData.teacher_id || null,
                    teacher_name: entryData.teacher_name || "",
                    session_type: entryData.session_type || "theory",
                    room: entryData.room || "",
                    span: entryData.span || 1,
                };
                return { ...d, entries: [...d.entries, newEntry] };
            })
        );
        markDirty();
    }, [markDirty]);

    const editEntry = useCallback((dayValue, entryId, updates) => {
        setDays((prev) =>
            prev.map((d) => {
                if (d.day !== dayValue) return d;
                return {
                    ...d,
                    entries: d.entries.map((e) =>
                        e.id === entryId ? { ...e, ...updates } : e
                    ),
                };
            })
        );
        markDirty();
    }, [markDirty]);

    const clearEntry = useCallback((dayValue, entryId) => {
        setDays((prev) =>
            prev.map((d) => {
                if (d.day !== dayValue) return d;
                return { ...d, entries: d.entries.filter((e) => e.id !== entryId) };
            })
        );
        markDirty();
    }, [markDirty]);

    // ── Query helpers ────────────────────────────────────

    const getEntryForCell = useCallback(
        (dayValue, timelineItemId) => {
            const dayData = days.find((d) => d.day === dayValue);
            if (!dayData) return null;
            // Direct match
            const direct = dayData.entries.find((e) => e.timeline_item_id === timelineItemId);
            if (direct) return direct;
            // Check if this period is inside a spanned entry
            const periods = periodsOnly(timeline);
            for (const entry of dayData.entries) {
                if (entry.span > 1) {
                    const startIdx = periods.findIndex((p) => p.id === entry.start_timeline_item_id);
                    const endIdx = periods.findIndex((p) => p.id === entry.end_timeline_item_id);
                    const thisIdx = periods.findIndex((p) => p.id === timelineItemId);
                    if (thisIdx > startIdx && thisIdx <= endIdx) {
                        return { ...entry, _isSpanned: true };
                    }
                }
            }
            return null;
        },
        [days, timeline]
    );

    const getEntriesForDay = useCallback(
        (dayValue) => {
            const dayData = days.find((d) => d.day === dayValue);
            return dayData ? dayData.entries : [];
        },
        [days]
    );

    // Calculate CSS grid column span for a spanned entry
    const calculateGridSpan = useCallback(
        (entry) => {
            if (entry.span <= 1) return 1;
            const startIdx = timeline.findIndex((i) => i.id === entry.start_timeline_item_id);
            const endIdx = timeline.findIndex((i) => i.id === entry.end_timeline_item_id);
            if (startIdx === -1 || endIdx === -1) return 1;
            return endIdx - startIdx + 1;
        },
        [timeline]
    );

    // ── Validation ───────────────────────────────────────

    const validateTimetable = useCallback(() => {
        const errors = [];

        // 1. Period time validation
        periodsOnly(timeline).forEach((p) => {
            if (!p.start || !p.end) {
                errors.push(`${p.label} is missing start or end time.`);
            } else if (timeToMinutes(p.start) >= timeToMinutes(p.end)) {
                errors.push(`${p.label}: start time must be before end time.`);
            }
        });

        // 2. Timeline overlap check
        for (let i = 0; i < timeline.length - 1; i++) {
            const curr = timeline[i];
            const next = timeline[i + 1];
            if (curr.end && next.start && timeToMinutes(curr.end) > timeToMinutes(next.start)) {
                errors.push(`"${curr.label}" and "${next.label}" have overlapping times.`);
            }
        }

        // 3. Entry validation + teacher conflict detection
        const teacherSlots = {}; // `${teacher_id}-${day}-${periodId}` → entry
        for (const dayData of days) {
            for (const entry of dayData.entries) {
                if (!entry.subject_id) {
                    errors.push(`${DAYS.find((d) => d.value === dayData.day)?.label || dayData.day}: Missing subject assignment.`);
                }
                if (!entry.teacher_id) {
                    errors.push(`${DAYS.find((d) => d.value === dayData.day)?.label || dayData.day}: Missing teacher for ${entry.subject_code || "a period"}.`);
                }

                // Span validation
                if (entry.span > 1) {
                    const spannedIds = getConsecutivePeriodIds(timeline, entry.start_timeline_item_id, entry.end_timeline_item_id);
                    if (!spannedIds) {
                        errors.push(`${DAYS.find((d) => d.value === dayData.day)?.label || dayData.day}: Lab span for ${entry.subject_code} includes non-consecutive periods or a break.`);
                    }
                }

                // Teacher conflict
                if (entry.teacher_id) {
                    const periods = periodsOnly(timeline);
                    const startIdx = periods.findIndex((p) => p.id === (entry.start_timeline_item_id || entry.timeline_item_id));
                    const endIdx = entry.span > 1
                        ? periods.findIndex((p) => p.id === entry.end_timeline_item_id)
                        : startIdx;
                    for (let pi = startIdx; pi <= endIdx; pi++) {
                        const key = `${entry.teacher_id}-${dayData.day}-${periods[pi]?.id}`;
                        if (teacherSlots[key]) {
                            const existing = teacherSlots[key];
                            if (existing.id !== entry.id) {
                                const dayLabel = DAYS.find((d) => d.value === dayData.day)?.label || dayData.day;
                                errors.push(
                                    `Teacher conflict: ${entry.teacher_name} is assigned to both "${existing.subject_code}" and "${entry.subject_code}" on ${dayLabel} ${periods[pi]?.label}.`
                                );
                            }
                        } else {
                            teacherSlots[key] = entry;
                        }
                    }
                }
            }
        }

        return errors;
    }, [timeline, days]);

    // ── Reset / Clear ────────────────────────────────────

    const resetTimetable = useCallback(() => {
        setTimeline(cloneTimeline(DEFAULT_TIMELINE));
        setDays(buildEmptyDays());
        setIsDirty(false);
    }, []);

    const clearDraft = useCallback(() => {
        timetableService.clearDraft(context);
        setDraftRestored(false);
    }, [context]);

    const dismissDraftNotice = useCallback(() => {
        setDraftRestored(false);
    }, []);

    // ── Serialise for save ───────────────────────────────

    const getTimetableData = useCallback(() => ({
        context,
        timeline,
        days,
    }), [context, timeline, days]);

    return {
        // state
        context,
        timeline,
        days,
        isDirty,
        includeSaturday,
        draftRestored,
        isContextComplete,
        isSectionSelected,

        // context
        setContext,
        toggleSaturday,

        // timeline
        addPeriod,
        editPeriod,
        removePeriod,
        addBreak,
        editBreak,
        removeBreak,

        // entries
        assignEntry,
        editEntry,
        clearEntry,

        // queries
        getEntryForCell,
        getEntriesForDay,
        calculateGridSpan,
        periodsOnly: () => periodsOnly(timeline),

        // validation
        validateTimetable,

        // persistence
        resetTimetable,
        clearDraft,
        dismissDraftNotice,
        getTimetableData,
    };
}
