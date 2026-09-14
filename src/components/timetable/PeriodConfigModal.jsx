import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import Modal from "../common/Modal";

export default function PeriodConfigModal({
    isOpen,
    onClose,
    onSave,
    period = null,
    timeline = [],
}) {
    const isEdit = Boolean(period);
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [insertAfter, setInsertAfter] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (period) {
            setStart(period.start || "");
            setEnd(period.end || "");
            setInsertAfter("");
        } else {
            setStart("");
            setEnd("");
            setInsertAfter("");
        }
        setError("");
    }, [period, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!start || !end) {
            setError("Both start and end time are required.");
            return;
        }
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        if (sh * 60 + sm >= eh * 60 + em) {
            setError("Start time must be before end time.");
            return;
        }
        const insertIndex = insertAfter !== "" ? parseInt(insertAfter, 10) : null;
        onSave({ start, end }, insertIndex);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Period" : "Add Period"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Start Time *</label>
                        <input
                            type="time"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">End Time *</label>
                        <input
                            type="time"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        />
                    </div>
                </div>

                {!isEdit && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Insert After</label>
                        <select
                            value={insertAfter}
                            onChange={(e) => setInsertAfter(e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        >
                            <option value="">End of timeline</option>
                            {timeline.map((item, idx) => (
                                <option key={item.id} value={idx}>
                                    {item.label} ({item.start}–{item.end})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {error && <p className="text-rose-500 text-xs font-semibold">{error}</p>}

                <div className="flex justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 neu-btn"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isEdit ? "Update" : "Add Period"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
