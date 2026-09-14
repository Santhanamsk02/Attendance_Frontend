import React, { useState } from "react";
import { Plus, Info, AlertTriangle, Calendar as CalendarIcon, List } from "lucide-react";
import OverrideCalendar from "./OverrideCalendar";
import OverrideTable from "./OverrideTable";
import OverrideModal from "./OverrideModal";

export default function DateOverrides({ overridesHook }) {
    const { overrides, isDirty, draftRestored, addOverride, editOverride, removeOverride } = overridesHook;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewMode, setViewMode] = useState("calendar"); // calendar | list
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

    const handleOpenNew = (date) => {
        setSelectedDate(date);
        setEditingItem(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSave = (data) => {
        if (editingItem) {
            editOverride(editingItem.id, data);
        } else {
            addOverride(data);
        }
        setModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-700">Manage Overrides</h2>
                    <p className="text-sm font-semibold text-slate-500">
                        Set holidays, special working days, or modify periods for specific dates.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "calendar" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                            title="Calendar View"
                        >
                            <CalendarIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => handleOpenNew(new Date().toISOString().split("T")[0])}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Override
                    </button>
                </div>
            </div>

            {isDirty && (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 animate-fade-in">
                    <Info className="w-4 h-4" />
                    Unsaved override changes. Local draft auto-saved.
                </div>
            )}

            {viewMode === "calendar" ? (
                <OverrideCalendar
                    overrides={overrides}
                    onSelectDate={handleOpenNew}
                    onEditOverride={handleOpenEdit}
                    onDeleteOverride={removeOverride}
                />
            ) : (
                <OverrideTable
                    overrides={overrides}
                    onEdit={handleOpenEdit}
                    onDelete={removeOverride}
                />
            )}

            {modalOpen && (
                <OverrideModal
                    isOpen={modalOpen}
                    initialData={editingItem}
                    defaultDate={selectedDate}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
