import { useState, useCallback, useEffect, useRef } from "react";
import { timetableService } from "../services/timetableService";

export default function useTimetableOverrides() {
    const [overrides, setOverrides] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);
    const initialised = useRef(false);

    // Restore draft on mount
    useEffect(() => {
        if (initialised.current) return;
        initialised.current = true;
        const draft = timetableService.loadOverridesDraft();
        if (draft && draft.overrides) {
            setOverrides(draft.overrides);
            setDraftRestored(true);
        }
    }, []);

    // Save to draft on change
    useEffect(() => {
        if (!isDirty) return;
        const timeout = setTimeout(() => {
            timetableService.saveOverridesDraft({ overrides });
            setIsDirty(false);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [overrides, isDirty]);

    const markDirty = () => setIsDirty(true);

    const addOverride = useCallback((overrideData) => {
        setOverrides((prev) => {
            // Remove any existing override for the same date before adding
            const filtered = prev.filter((o) => o.date !== overrideData.date);
            return [...filtered, { id: crypto.randomUUID(), ...overrideData }];
        });
        markDirty();
    }, []);

    const editOverride = useCallback((id, updates) => {
        setOverrides((prev) =>
            prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
        );
        markDirty();
    }, []);

    const removeOverride = useCallback((id) => {
        setOverrides((prev) => prev.filter((o) => o.id !== id));
        markDirty();
    }, []);

    const getOverrideForDate = useCallback(
        (dateString) => {
            return overrides.find((o) => o.date === dateString) || null;
        },
        [overrides]
    );

    const getActualTimetable = useCallback(
        (dateString, weeklyDays, timeline) => {
            const override = overrides.find((o) => o.date === dateString);

            const dateObj = new Date(dateString);
            const dayIndex = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const baseDayValue = dayMap[dayIndex];

            const baseDay = weeklyDays.find(d => d.day === baseDayValue);
            const baseEntries = baseDay ? baseDay.entries : [];

            if (!override) return baseEntries;

            switch (override.type) {
                case "HOLIDAY":
                    return [];
                case "SPECIAL_WORKING_DAY":
                    const sourceDay = weeklyDays.find(d => d.day === override.sourceDay);
                    return sourceDay ? sourceDay.entries : [];
                case "HALF_DAY":
                    return baseEntries.filter(entry => {
                        const startId = entry.start_timeline_item_id || entry.timeline_item_id;
                        const period = timeline.find(p => p.id === startId);
                        if (!period) return false;
                        const [h] = period.start.split(":").map(Number);
                        if (override.halfDayType === "MORNING") return h < 13;
                        if (override.halfDayType === "AFTERNOON") return h >= 13;
                        return true;
                    });
                case "SPECIAL_CLASS":
                case "CUSTOM":
                    return override.customEntries || baseEntries;
                default:
                    return baseEntries;
            }
        },
        [overrides]
    );

    const clearDraft = useCallback(() => {
        timetableService.clearOverridesDraft();
        setOverrides([]);
        setDraftRestored(false);
    }, []);

    return {
        overrides,
        isDirty,
        draftRestored,
        addOverride,
        editOverride,
        removeOverride,
        getOverrideForDate,
        getActualTimetable,
        clearDraft,
    };
}
