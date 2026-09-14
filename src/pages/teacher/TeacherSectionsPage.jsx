import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/api";

export default function TeacherSectionsPage() {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const res = await apiClient.get("/teacher/sections");
                setSections(res.data);
            } catch (err) {
                console.error("Failed to fetch sections");
            } finally {
                setLoading(false);
            }
        };
        fetchSections();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Loading assigned sections...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">My Assigned Sections</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-500 mt-1">Student sections allocated to your teaching workload.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs border border-indigo-100">
                    <AlertCircle className="w-4 h-4" />
                    Read-only view
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sections.map(section => (
                    <div key={section.id} className="neu-card p-6 rounded-2xl bg-white border border-slate-100/50">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200/50">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 leading-tight">{section.name}</h3>
                                    <span className="text-sm font-bold text-slate-500">{section.student_count} Registered Students</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Allocated Subjects</h4>
                            <div className="flex flex-col gap-2">
                                {section.subjects_taught.map((subj, idx) => (
                                    <div key={idx} className="px-3 py-2 bg-white border border-slate-200/60 rounded-lg text-sm font-semibold text-slate-700 shadow-sm flex items-center gap-3 overflow-hidden">
                                        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-2 rounded uppercase flex-shrink-0">{subj.code}</span>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="truncate font-black text-sm" title={subj.name}>{subj.name}</span>
                                            {subj.title && <span className="text-xs text-slate-500 font-bold truncate leading-tight mt-0.5" title={subj.title}>{subj.title}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 text-right">
                            <button
                                onClick={() => {
                                    const encodedName = encodeURIComponent(section.name);
                                    // Just use the first subject code to resolve the roster context
                                    const subjectCode = section.subjects_taught.length > 0 ? section.subjects_taught[0].code : "";
                                    // Navigate to roster route
                                    navigate(`/teacher/sections/${section.id}?name=${encodedName}&sc=${subjectCode}&sec=${section.name.split('-').pop()}`);
                                }}
                                className="px-5 py-2 neu-btn text-indigo-600 text-sm font-bold rounded-lg hover:text-indigo-700"
                            >
                                View Students
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {sections.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl neu-inset border border-slate-200/50">
                    No sections assigned for the current academic session.
                </div>
            )}
        </div>
    );
}
