import React, { useEffect, useState } from "react";
import { CheckCircle, Plus, Edit2, Users, AlertCircle, Loader } from "lucide-react";
import { timetableService } from "../../services/timetableService";
import { apiClient } from "../../services/api";

export default function TimetableSectionsList({ context, onSelectSection }) {
    const [configuredSections, setConfiguredSections] = useState([]);
    const [sections, setSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);

    useEffect(() => {
        if (!context.department || !context.academic_year) {
            setSections([]);
            return;
        }
        let mounted = true;
        setLoadingSections(true);
        (async () => {
            try {
                // Fetch departments to find the correct batch for this context
                const deptRes = await apiClient.get('/institution/departments');
                const deptObj = deptRes.data.find(d => d.code === context.department);
                if (!deptObj) { setSections([]); return; }

                const batchRes = await apiClient.get(`/institution/departments/${deptObj.id}/batches`);
                const batch = batchRes.data.find(b => b.batch_name === context.academic_year);
                if (!batch) {
                    if (mounted) setSections([]);
                    return;
                }

                const sectionsRes = await apiClient.get(`/institution/batches/${batch.id}/sections`);
                const derived = sectionsRes.data.map(s => s.id);
                if (mounted) setSections(derived);
            } catch {
                if (mounted) setSections([]);
            } finally {
                if (mounted) setLoadingSections(false);
            }
        })();
        return () => { mounted = false; };
    }, [context.department, context.academic_year]);

    useEffect(() => {
        let mounted = true;
        const fetchStatus = async () => {
            const configured = await timetableService.getSectionsStatus(context);
            if (mounted) {
                setConfiguredSections(configured);
            }
        };
        fetchStatus();
        return () => { mounted = false; };
    }, [context.department, context.academic_year, context.semester]);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-lg font-black text-slate-800">
                    Available Sections
                </h3>
                <span className="text-sm font-bold text-slate-500">
                    Select a section to configure its timetable
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingSections ? (
                    <div className="col-span-3 flex items-center justify-center gap-2 py-10 text-slate-400">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Loading sections…</span>
                    </div>
                ) : sections.length === 0 ? (
                    <div className="col-span-3 py-10 text-center text-sm font-semibold text-slate-400">
                        No sections found for this batch. Please configure the batch in Institution Setup first.
                    </div>
                ) : (
                    sections.map((section) => {
                        const isConfigured = configuredSections.includes(section);
                        return (
                            <div
                                key={section}
                                className={`relative rounded-2xl p-5 border overflow-hidden transition-all duration-300 ${isConfigured ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {section}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-700">Section {section}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {isConfigured ? (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="text-xs font-semibold text-emerald-600">Configured</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className="text-xs font-semibold text-amber-600">Not Configured</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                                        <Users className="w-4 h-4" />
                                    </div>
                                </div>

                                <button
                                    onClick={() => onSelectSection(section)}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 ${isConfigured ? 'bg-slate-100/50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-white shadow-md'}`}
                                >
                                    {isConfigured ? (
                                        <>
                                            <Edit2 className="w-4 h-4" /> View / Edit Timetable
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" /> Configure Timetable
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
