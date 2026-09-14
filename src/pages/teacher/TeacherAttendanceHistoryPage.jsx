import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { History, ListChecks, ChevronRight, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../services/api";

export default function TeacherAttendanceHistoryPage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatTime12Hour = (time24Str) => {
        if (!time24Str || time24Str === "Unknown Time") return time24Str;
        const formatSingle = (ts) => {
            if (!ts) return "";
            const [h, m] = ts.split(':');
            let hours = parseInt(h, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours}:${m} ${ampm}`;
        };

        if (time24Str.includes(' - ')) {
            const [start, end] = time24Str.split(' - ');
            return `${formatSingle(start)} - ${formatSingle(end)}`;
        }
        return formatSingle(time24Str);
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = sessionStorage.getItem('teacher_verification_token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const res = await apiClient.get('/attendance/sessions/history', {
                    headers: { "teacher-verification-token": token }
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load attendance history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Loading past sessions...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 relative pb-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Attendance History</h1>
                    <p className="text-sm md:text-base font-semibold text-slate-500 mt-1">Review finalized attendance sessions from previous classes.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl neu-card overflow-hidden h-fit flex-shrink-0 mb-8">
                <div className="overflow-x-auto">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject & Section</th>
                                <th>Time</th>
                                <th>Attendance</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((session, idx) => (
                                <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                                                <History className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">
                                                {new Date(session.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-[200px]">
                                        <p className="text-sm font-black text-slate-800 leading-tight truncate" title={session.subject}>
                                            <span className="text-slate-400 mr-2 font-mono text-xs">{session.code}</span>
                                            {session.subject}
                                        </p>
                                        <p className="text-xs md:text-sm font-bold text-slate-500 mt-0.5">{session.section}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-xs font-bold text-slate-500">{formatTime12Hour(session.time)}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-black text-emerald-600">{session.present}</span>
                                            <span className="text-xs font-bold text-slate-400">/ {session.total}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> {session.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <button
                                            onClick={() => navigate(`/teacher/history/session/${session.id}`)}
                                            className="p-2 text-sky-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {history.length === 0 && (
                    <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl neu-inset border border-slate-200/50 flex flex-col items-center mx-4 my-4 h-fit">
                        <ListChecks className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg text-slate-700">No History Available</h3>
                        <p className="mt-1">Finalized attendance sessions will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
