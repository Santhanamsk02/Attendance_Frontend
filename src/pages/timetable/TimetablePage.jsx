import React, { useState, useEffect, useCallback } from "react";
import {
    CalendarDays,
    Save,
    RotateCcw,
    Eye,
    AlertTriangle,
    CheckCircle,
    Info,
    X,
    RefreshCw,
    BookOpen,
} from "lucide-react";
import useTimetable from "../../hooks/useTimetable";
import TimetableContextSelector from "../../components/timetable/TimetableContextSelector";
import TimetableHeader from "../../components/timetable/TimetableHeader";
import TimelineConfig from "../../components/timetable/TimelineConfig";
import TimetableGrid from "../../components/timetable/TimetableGrid";
import TimetablePreview from "../../components/timetable/TimetablePreview";
import PeriodConfigModal from "../../components/timetable/PeriodConfigModal";
import BreakConfigModal from "../../components/timetable/BreakConfigModal";
import AssignmentModal from "../../components/timetable/AssignmentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

import TimetableSectionsList from "../../components/timetable/TimetableSectionsList";
import SectionAssignmentSetup from "../../components/timetable/SectionAssignmentSetup";
import SubjectPalette from "../../components/timetable/SubjectPalette";
import { subjectService } from "../../services/subjectService";
import { teacherService } from "../../services/teacherService";
import { timetableService } from "../../services/timetableService";
import { useToast } from "../../hooks/useToast";
import { DAYS } from "../../utils/constants";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TimetablePage() {
    const navigate = useNavigate();
    const toast = useToast();
    const tt = useTimetable();
    const [showAssignmentStep, setShowAssignmentStep] = useState(false);


    // ── Subject / Teacher data ────────────────────────
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // ── Modals ────────────────────────────────────────
    const [periodModal, setPeriodModal] = useState({ open: false, item: null });
    const [breakModal, setBreakModal] = useState({ open: false, item: null });
    const [assignModal, setAssignModal] = useState({
        open: false,
        entry: null,
        dayValue: "",
        item: null,
    });
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmCtxChange, setConfirmCtxChange] = useState(null); // pending new context
    const [showPreview, setShowPreview] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [showValidation, setShowValidation] = useState(false);

    // ── Fetch subjects/teachers when context changes ──
    useEffect(() => {
        if (!tt.context.department) return;
        (async () => {
            try {
                const res = await teacherService.getTeachers({
                    department: tt.context.department,
                    limit: 100,
                    status: "active",
                });
                setTeachers(res.items || []);
            } catch {
                setTeachers([]);
            }
        })();
    }, [tt.context.department]);

    useEffect(() => {
        if (!tt.context.department || !tt.context.semester) return;
        (async () => {
            try {
                const res = await subjectService.getSubjects({
                    department: tt.context.department,
                    semester: parseInt(tt.context.semester, 10),
                    limit: 100,
                    status: "active",
                });
                setSubjects(res.items || []);
            } catch {
                setSubjects([]);
            }
        })();
    }, [tt.context.department, tt.context.semester]);

    // ── Dismiss draft notice ──────────────────────────
    useEffect(() => {
        if (tt.draftRestored) {
            toast.success("Draft restored from previous session.");
            tt.dismissDraftNotice();
        }
    }, [tt.draftRestored]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Context change with dirty check ───────────────
    const handleContextChange = useCallback(
        (newCtx) => {
            if (tt.isDirty) {
                setConfirmCtxChange(newCtx);
            } else {
                tt.setContext(newCtx);
            }
        },
        [tt]
    );

    // ── Period CRUD ───────────────────────────────────
    const handleSavePeriod = useCallback(
        (data, insertIdx) => {
            if (periodModal.item) {
                tt.editPeriod(periodModal.item.id, data);
            } else {
                tt.addPeriod(data, insertIdx);
            }
        },
        [periodModal.item, tt]
    );

    // ── Break CRUD ────────────────────────────────────
    const handleSaveBreak = useCallback(
        (data, insertIdx) => {
            if (breakModal.item) {
                tt.editBreak(breakModal.item.id, data);
            } else {
                tt.addBreak(data, insertIdx);
            }
        },
        [breakModal.item, tt]
    );

    // ── Assignment ────────────────────────────────────
    const handleAssignCell = useCallback((dayValue, item) => {
        setAssignModal({
            open: true,
            entry: null,
            dayValue,
            item,
        });
    }, []);

    const handleEditCell = useCallback((dayValue, entry) => {
        const item = tt.timeline.find((i) => i.id === (entry.start_timeline_item_id || entry.timeline_item_id));
        setAssignModal({
            open: true,
            entry,
            dayValue,
            item: item || null,
        });
    }, [tt.timeline]);

    /**
     * Drop handler — called when a subject card from SubjectPalette is dropped on a cell.
     * Immediately assigns the cell without opening a modal.
     */
    const handleDropCell = useCallback((dayValue, item, payload) => {
        const isLab = payload.subject_type === "practical" || payload.subject_type === "laboratory";
        const existing = tt.getEntryForCell(dayValue, item.id);

        const entry = {
            id: existing ? existing.id : undefined, // Pass ID to trigger edit instead of assign
            timeline_item_id: item.id,
            start_timeline_item_id: existing ? existing.start_timeline_item_id : item.id,
            end_timeline_item_id: existing && !isLab ? existing.end_timeline_item_id : item.id,
            subject_id: payload.subject_id || null,
            subject_code: payload.subject_code || "",
            subject_name: payload.subject_name || "",
            teacher_id: payload.teacher_id || null,
            teacher_name: payload.teacher_name || "",
            session_type: isLab ? "lab" : "theory",
            room: "",
            span: existing && !isLab ? existing.span : 1, // Keep span if replacing theory/elective, reset to 1 for lab (so modal opens)
        };

        // If it's a practical, intercept and open the modal so user can configure the time span
        if (isLab) {
            setAssignModal({ open: true, entry, dayValue, item });
            return;
        }

        if (existing && existing.id) {
            tt.editEntry(dayValue, existing.id, entry);
        } else {
            tt.assignEntry(dayValue, entry);
        }

        toast.success(`${payload.subject_code} placed on ${DAYS.find(d => d.value === dayValue)?.label || dayValue}`);
    }, [tt, toast]);


    const handleSaveAssignment = useCallback(
        (data) => {
            if (assignModal.entry && assignModal.entry.id) {
                // Editing an existing entry
                tt.editEntry(assignModal.dayValue, assignModal.entry.id, data);
            } else {
                // Assigning a new entry (e.g. from the drag-drop handler or empty slot click)
                tt.assignEntry(assignModal.dayValue, data);
            }
        },
        [assignModal, tt]
    );

    const handleClearAssignment = useCallback(() => {
        if (assignModal.entry) {
            tt.clearEntry(assignModal.dayValue, assignModal.entry.id);
        }
    }, [assignModal, tt]);

    // ── Save ──────────────────────────────────────────
    const handleSave = useCallback(async () => {
        const errors = tt.validateTimetable();
        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidation(true);
            return;
        }
        try {
            await timetableService.saveDraft(tt.context, tt.getTimetableData());
            toast.success("Timetable saved to database.");
            // Optionally, mark dirty as false if you expose setIsDirty from hook.
            // But just resetting will require changes in useTimetable. For now, it's fine.
        } catch (e) {
            toast.error(e.message || "Failed to save timetable.");
        }
    }, [tt, toast]);

    // ── Reset ─────────────────────────────────────────
    const resetTimetable = useCallback(() => {
        tt.resetTimetable();
        timetableService.clearDraft();
        toast.success("Timetable reset to defaults.");
        setConfirmReset(false);
    }, [tt, toast]);


    // current period label for modal subtitle
    const currentPeriodLabel = assignModal.item
        ? `${assignModal.item.label} (${assignModal.item.start}–${assignModal.item.end})`
        : "";
    const currentDayLabel = DAYS.find((d) => d.value === assignModal.dayValue)?.label || "";

    return (
        <div className="space-y-6 pb-20">
            {/* ── Breadcrumbs ────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black tracking-wider text-slate-400 mb-1 px-1 uppercase">
                <span
                    onClick={() => navigate('/dashboard')}
                    className="hover:text-slate-800 cursor-pointer transition-colors"
                >
                    Dashboard
                </span>
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                <span
                    onClick={() => {
                        handleContextChange({ department: "", academic_year: "", semester: "", section: "" });
                        setShowAssignmentStep(false);
                    }}
                    className={!tt.context.department ? "text-violet-600" : "hover:text-slate-800 cursor-pointer transition-colors"}
                >
                    Timetable
                </span>

                {tt.context.department && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span
                            onClick={() => {
                                handleContextChange({ ...tt.context, academic_year: "", semester: "", section: "" });
                                setShowAssignmentStep(false);
                            }}
                            className={!tt.context.academic_year ? "text-violet-600" : "hover:text-slate-800 cursor-pointer transition-colors"}
                        >
                            {tt.context.department}
                        </span>
                    </>
                )}

                {tt.context.academic_year && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span
                            onClick={() => {
                                handleContextChange({ ...tt.context, semester: "", section: "" });
                                setShowAssignmentStep(false);
                            }}
                            className={!tt.context.semester ? "text-violet-600" : "hover:text-slate-800 cursor-pointer transition-colors"}
                        >
                            {tt.context.academic_year}
                        </span>
                    </>
                )}

                {tt.context.semester && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span
                            onClick={() => {
                                handleContextChange({ ...tt.context, section: "" });
                                setShowAssignmentStep(false);
                            }}
                            className={!tt.context.section ? "text-violet-600" : "hover:text-slate-800 cursor-pointer transition-colors"}
                        >
                            Sem {tt.context.semester}
                        </span>
                    </>
                )}

                {tt.context.section && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="text-violet-600">Sec {tt.context.section}</span>
                    </>
                )}
            </div>

            {/* ── Page Header ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
                        Timetable Management
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                        Create and manage department-wise, semester-wise academic timetables.
                    </p>
                </div>

                {tt.isSectionSelected && (
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all duration-150"
                        >
                            <Eye className="w-4 h-4 text-slate-500" />
                            Preview
                        </button>
                        <button
                            onClick={() =>
                                tt.isDirty ? setConfirmReset(true) : resetTimetable()
                            }
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all duration-150"
                            title="Reset to default template"
                        >
                            <RotateCcw className="w-4 h-4 text-slate-500" />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-150"
                        >
                            <Save className="w-4 h-4" />
                            Save Timetable
                        </button>
                    </div>
                )}
            </div>

            {/* ── Context Selector ───────────────────────── */}
            <TimetableContextSelector
                context={tt.context}
                onChange={handleContextChange}
            />

            {/* ── Empty state ────────────────────────────── */}
            {!tt.isContextComplete && (
                <div className="rounded-3xl neu-card p-12 text-center">
                    <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-slate-500">
                        Select department, academic year, semester, and section
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        to configure the timetable.
                    </p>
                </div>
            )}

            {/* ── Sections List ────────────────────────────── */}
            {tt.isContextComplete && !tt.isSectionSelected && (
                <TimetableSectionsList
                    context={tt.context}
                    onSelectSection={(sec) => {
                        tt.setContext({ ...tt.context, section: sec });
                        setShowAssignmentStep(true);  // go to assignment step first
                    }}
                />
            )}

            {/* ── Step 1: Subject-Teacher Assignment ──────── */}
            {tt.isSectionSelected && showAssignmentStep && (
                <SectionAssignmentSetup
                    context={tt.context}
                    onProceed={() => setShowAssignmentStep(false)}
                    onBack={() => {
                        tt.setContext({ ...tt.context, section: "" });
                        setShowAssignmentStep(false);
                    }}
                />
            )}

            {/* ── Workspace ──────────────────────────────── */}
            {tt.isSectionSelected && !showAssignmentStep && (
                <>
                    <div className="mb-2">
                        <button
                            onClick={() => {
                                setShowAssignmentStep(true);
                            }}
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl"
                        >
                            ← Back to Assignments
                        </button>
                        <button
                            onClick={() => {
                                if (tt.isDirty) {
                                    setConfirmCtxChange({ ...tt.context, section: "" });
                                } else {
                                    tt.setContext({ ...tt.context, section: "" });
                                    setShowAssignmentStep(false);
                                }
                            }}
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Sections
                        </button>
                    </div>

                    <div className="space-y-6">
                        <TimetableHeader context={tt.context} />

                        {/* Validation errors banner */}
                        {showValidation && validationErrors.length > 0 && (
                            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 animate-fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4" />
                                        {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""} found
                                    </div>
                                    <button onClick={() => setShowValidation(false)} className="text-rose-400 hover:text-rose-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <ul className="space-y-1">
                                    {validationErrors.map((err, i) => (
                                        <li key={i} className="text-[11px] text-rose-600 flex items-start gap-1.5">
                                            <span className="mt-0.5 shrink-0">•</span>
                                            {err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Dirty indicator */}
                        {tt.isDirty && (
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-600">
                                <Info className="w-3.5 h-3.5" />
                                Unsaved changes — draft auto-saved locally.
                            </div>
                        )}

                        <TimelineConfig
                            timeline={tt.timeline}
                            onEditPeriod={(item) => setPeriodModal({ open: true, item })}
                            onRemovePeriod={(id) => tt.removePeriod(id)}
                            onAddPeriod={() => setPeriodModal({ open: true, item: null })}
                            onEditBreak={(item) => setBreakModal({ open: true, item })}
                            onRemoveBreak={(id) => tt.removeBreak(id)}
                            onAddBreak={() => setBreakModal({ open: true, item: null })}
                            includeSaturday={tt.includeSaturday}
                            onToggleSaturday={tt.toggleSaturday}
                        />

                        {/* ── Two-column layout: palette + grid ── */}
                        <div className="flex gap-5 items-start">

                            {/* Subject Palette sidebar — sticky so it's always in view */}
                            <div className="w-56 xl:w-64 flex-shrink-0 sticky top-4 self-start">
                                <div className="rounded-3xl neu-card p-4">
                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                        Subjects · Drag to Place
                                    </h4>
                                    {/* Scrollable list — no page scroll interference with drag */}
                                    <div
                                        className="overflow-y-auto pr-1"
                                        style={{ maxHeight: "calc(100vh - 280px)" }}
                                    >
                                        <SubjectPalette context={tt.context} />
                                    </div>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 min-w-0">
                                <TimetableGrid
                                    timeline={tt.timeline}
                                    days={tt.days}
                                    getEntryForCell={tt.getEntryForCell}
                                    calculateGridSpan={tt.calculateGridSpan}
                                    onAssignCell={handleAssignCell}
                                    onEditCell={handleEditCell}
                                    onDropCell={handleDropCell}
                                />
                            </div>
                        </div>
                    </div>

                </>
            )}

            {/* ── Modals ─────────────────────────────────── */}
            <PeriodConfigModal
                isOpen={periodModal.open}
                onClose={() => setPeriodModal({ open: false, item: null })}
                onSave={handleSavePeriod}
                period={periodModal.item}
                timeline={tt.timeline}
            />

            <BreakConfigModal
                isOpen={breakModal.open}
                onClose={() => setBreakModal({ open: false, item: null })}
                onSave={handleSaveBreak}
                breakItem={breakModal.item}
                timeline={tt.timeline}
            />

            <AssignmentModal
                isOpen={assignModal.open}
                onClose={() =>
                    setAssignModal({ open: false, entry: null, dayValue: "", item: null })
                }
                onSave={handleSaveAssignment}
                onClear={handleClearAssignment}
                entry={assignModal.entry}
                item={assignModal.item}
                dayLabel={currentDayLabel}
                periodLabel={currentPeriodLabel}
                context={tt.context}
                timeline={tt.timeline}
            />

            <TimetablePreview
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                context={tt.context}
                timeline={tt.timeline}
                days={tt.days}
                getEntryForCell={tt.getEntryForCell}
                calculateGridSpan={tt.calculateGridSpan}
            />

            {/* Reset confirmation */}
            <ConfirmDialog
                isOpen={confirmReset}
                onClose={() => setConfirmReset(false)}
                onConfirm={resetTimetable}
                title="Reset Timetable?"
                message="This will remove all your current timetable changes and restore defaults."
                confirmText="Reset"
                variant="danger"
            />

            {/* Context change confirmation */}
            <ConfirmDialog
                isOpen={Boolean(confirmCtxChange)}
                onClose={() => setConfirmCtxChange(null)}
                onConfirm={() => {
                    tt.setContext(confirmCtxChange);
                    if (!confirmCtxChange.section) setShowAssignmentStep(false);
                    tt.resetTimetable();
                    setConfirmCtxChange(null);
                }}
                title="Unsaved Changes"
                message="You have unsaved timetable changes. Changing the academic context will discard them. Continue?"
                confirmText="Continue"
                variant="danger"
            />
        </div>
    );
}
