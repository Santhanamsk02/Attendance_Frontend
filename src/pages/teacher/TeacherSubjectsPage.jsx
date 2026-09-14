import React, { useState, useEffect } from "react";
import { BookOpen, AlertCircle } from "lucide-react";
import { apiClient } from "../../services/api";

export default function TeacherSubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await apiClient.get("/teacher/subjects");
                setSubjects(res.data);
            } catch (err) {
                console.error("Failed to fetch subjects");
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Loading assigned subjects...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">My Assigned Subjects</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-500 mt-1">Subjects currently allocated to your teaching workload.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs border border-indigo-100">
                    <AlertCircle className="w-4 h-4" />
                    Read-only view
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map(subject => (
                    <div key={subject.id} className="neu-card p-6 rounded-2xl bg-white flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${subject.type === 'theory' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    {subject.type}
                                </span>
                            </div>
                            <div className="flex flex-col mb-4">
                                <h3 className="text-base font-black text-slate-800 leading-tight mb-1">{subject.name}</h3>
                                {subject.title && <p className="text-sm font-bold text-slate-500 line-clamp-1">{subject.title}</p>}
                            </div>
                            <p className="text-sm font-bold text-slate-500 font-mono mb-4">{subject.code}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Semester {subject.semester}</span>
                            {subject.sections?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {subject.sections.map(sec => (
                                        <span key={sec} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded shadow-sm text-[10px]">
                                            Sec {sec}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {subjects.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl neu-inset border border-slate-200/50">
                    No subjects assigned for the current academic session.
                </div>
            )}
        </div>
    );
}
