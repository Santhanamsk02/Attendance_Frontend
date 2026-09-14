import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, User, Activity } from 'lucide-react';
import { apiClient } from '../../../../services/api';

export default function SessionDrawer({ sessionId, isOpen, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && sessionId) {
            setLoading(true);
            apiClient.get(`/admin/attendance/history/session/${sessionId}`)
                .then(res => setData(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [isOpen, sessionId]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Session Breakdown</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Detailed view of individual attendance markings.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                    {loading ? (
                        <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                            <Activity className="w-8 h-8 animate-pulse mb-3 text-indigo-400" />
                            <p className="font-semibold">Extracting Session Matrix...</p>
                        </div>
                    ) : !data ? (
                        <div className="p-10 text-center text-slate-500">No data found.</div>
                    ) : (
                        <div className="p-6 space-y-6">

                            {/* Session Meta */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Subject</p>
                                        <p className="font-bold text-slate-800 leading-tight">{data.session.subjectName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Teacher</p>
                                        <p className="font-semibold text-slate-600 leading-tight">{data.session.teacherName}</p>
                                    </div>
                                </div>
                                <div className="w-px bg-slate-100 hidden md:block"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Date</p>
                                            <p className="font-semibold text-slate-700 leading-tight">{data.session.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Period</p>
                                            <p className="font-semibold text-indigo-600 leading-tight bg-indigo-50 px-2 py-0.5 rounded-md inline-block">P{data.session.period}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${(data.summary.present / data.summary.total) * 100 >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(data.summary.present / data.summary.total) * 100}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mt-1.5">
                                            <span className="text-emerald-600">{data.summary.present} Present</span>
                                            <span className="text-rose-500">{data.summary.absent} Absent</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Students List */}
                            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" /> Student Ledger ({data.summary.total})</h3>
                                </div>
                                <ul className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {data.marks.map(mark => (
                                        <li key={mark.student_id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm leading-tight mb-0.5">{mark.student_name}</p>
                                                <p className="text-xs font-semibold text-slate-400">{mark.roll_no}</p>
                                            </div>
                                            {mark.status === "Present" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 font-bold text-xs border border-emerald-100">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-500 font-bold text-xs border border-rose-100">
                                                    <XCircle className="w-3.5 h-3.5" /> Absent
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
