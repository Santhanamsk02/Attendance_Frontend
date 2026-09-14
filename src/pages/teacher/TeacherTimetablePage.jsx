import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/api";
import TimetableGrid from "../../components/timetable/TimetableGrid";
import { DAYS } from "../../utils/constants";

export default function TeacherTimetablePage() {
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const res = await apiClient.get("/teacher/timetable");
                setTimetable(res.data);
            } catch (err) {
                console.error("Failed to fetch timetable");
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, []);

    const processedData = useMemo(() => {
        if (!timetable) return { timeline: [], days: [], entryLookup: {} };
        const timeline = timetable.timeline || [];
        const grid = timetable.grid || {};
        const entryLookup = {};
        const periods = timeline.filter(t => t.type === 'period');

        // We need to pass the same `days` format expected by TimetableGrid: [{ day: "MON" }, { day: "TUE" }]
        // We will include Saturday if it exists in the grid or typically just M-F, depends on DAYS constant.
        // For simplicity, we just use the DAYS constant from utils.

        // Generate the days array, filtering out Saturday if it has no classes assigned
        const processedDays = DAYS.filter(day => {
            if (day.value === 'SAT') {
                const satGrid = grid[day.label] || {};
                return Object.keys(satGrid).length > 0;
            }
            return true;
        });

        // Pre-process grid to attach start/end timeline_item_ids for `TimetableGrid` to work
        processedDays.forEach(day => {
            const dayValue = day.value;
            let skipUntilIdx = -1;

            timeline.forEach((item, colIdx) => {
                if (colIdx <= skipUntilIdx) {
                    // Mark as spanned
                    entryLookup[`${dayValue}-${item.id}`] = { _isSpanned: true };
                    return;
                }

                const slotData = grid[day.label]?.[item.id];
                if (slotData) {
                    const startIdx = colIdx;
                    let endIdx = colIdx;

                    if (slotData.span > 1) {
                        let periodsIncluded = 1;
                        let scanIdx = colIdx + 1;
                        while (scanIdx < timeline.length && periodsIncluded < slotData.span) {
                            if (timeline[scanIdx].type === 'period') {
                                periodsIncluded++;
                            }
                            scanIdx++;
                        }
                        endIdx = scanIdx - 1;
                        skipUntilIdx = endIdx;

                        // Fill intermediate cells with _isSpanned
                        for (let i = startIdx + 1; i <= endIdx; i++) {
                            entryLookup[`${dayValue}-${timeline[i].id}`] = { _isSpanned: true };
                        }
                    }

                    entryLookup[`${dayValue}-${item.id}`] = {
                        id: `${dayValue}-${item.id}`,
                        timeline_item_id: item.id,
                        start_timeline_item_id: item.id,
                        end_timeline_item_id: timeline[endIdx].id,
                        subject_name: slotData.subject || "",
                        subject_code: slotData.code || "",
                        session_type: slotData.type === 'theory' ? 'theory' : 'lab',
                        type: slotData.type,
                        room: slotData.room || "",
                        section: slotData.section_display || slotData.section || "",
                        span: slotData.span || 1
                    };
                }
            });
        });

        return { timeline, days: processedDays, entryLookup };
    }, [timetable]);

    const getEntryForCell = useCallback((dayValue, timelineItemId) => {
        return processedData.entryLookup[`${dayValue}-${timelineItemId}`] || null;
    }, [processedData.entryLookup]);

    const calculateGridSpan = useCallback((entry) => {
        if (!entry || entry.span <= 1) return 1;
        const startIdx = processedData.timeline.findIndex(i => i.id === entry.start_timeline_item_id);
        const endIdx = processedData.timeline.findIndex(i => i.id === entry.end_timeline_item_id);
        return endIdx !== -1 && startIdx !== -1 ? (endIdx - startIdx + 1) : 1;
    }, [processedData.timeline]);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Loading timetable...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">My Weekly Timetable</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-500 mt-1">Read-only view of your assigned schedule.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs border border-indigo-100 self-start md:self-auto">
                    <AlertCircle className="w-4 h-4" />
                    Read-only view
                </div>
            </div>

            <TimetableGrid
                timeline={processedData.timeline}
                days={processedData.days}
                getEntryForCell={getEntryForCell}
                calculateGridSpan={calculateGridSpan}
                onAssignCell={() => { }}
                onEditCell={() => { }}
                onDropCell={() => { }}
                readOnly={true}
                colorByKey="section"
            />
        </div>
    );
}
