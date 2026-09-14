import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileSpreadsheet, Download, X, BadgeCheck, ShieldAlert, CheckCircle2, ArrowLeft } from "lucide-react";
import * as XLSX from 'xlsx';
import { apiClient } from "../../services/api";

export default function TeacherSessionReportPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            setLoadingReport(true);
            try {
                const token = sessionStorage.getItem('teacher_verification_token');
                const res = await apiClient.get(`/attendance/sessions/${sessionId}/report`, {
                    headers: { "teacher-verification-token": token }
                });
                setReportData(res.data);
            } catch (err) {
                console.error("Failed to load report", err);
                setError(err.response?.data?.detail || "Failed to load report data.");
            } finally {
                setLoadingReport(false);
            }
        };
        fetchReport();
    }, [sessionId]);

    const handleExportExcel = () => {
        if (!reportData) return;

        const wsData = [
            ["Roll Number", "Student Name", "Status", "Time", "Method"]
        ];

        reportData.students.forEach(st => {
            wsData.push([st.roll_number, st.name, st.status, st.time || "-", st.method || "-"]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

        const fileName = `${reportData.code}_${reportData.section.replace(/\s+/g, '')}_Attendance_${reportData.date}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    if (loadingReport) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl neu-card">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Aggregating records...</p>
                </div>
            </div>
        );
    }

    if (error || !reportData) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl neu-card">
                    <ShieldAlert className="w-12 h-12 text-rose-300 mb-2" />
                    <p className="text-slate-500 font-bold">Failed to load report. {error}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-100 font-bold rounded-xl text-slate-500">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 relative animate-fade-in pb-8">
            {/* Header Breadcrumb */}
            <button
                onClick={() => navigate('/teacher/attendance-history')}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to History
            </button>

            {/* Main Content Card */}
            <div className="bg-white rounded-[2.5rem] w-full flex flex-col shadow-[0_5px_30px_rgba(0,0,0,0.02)] overflow-hidden">
                {/* Header Component */}
                <div className="bg-gradient-to-br from-slate-50 to-white px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                            <FileSpreadsheet className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Session Analytics</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span className="text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100/50 block w-fit">{reportData.subject}</span>
                                <span className="text-slate-500">{reportData.section}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1"></span>
                                <span className="text-slate-500">{reportData.date}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportExcel}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 border-none"
                        >
                            <Download className="w-4 h-4" /> Export XLSX
                        </button>
                    </div>
                </div>

                {/* Body Component */}
                <div className="flex-1 bg-slate-50/50 p-6 md:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-emerald-100/50 shadow-[0_8px_30px_rgba(16,185,129,0.06)] flex items-center justify-between relative overflow-hidden group">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Total Present
                                </span>
                                <span className="text-5xl font-black text-slate-800 drop-shadow-sm">
                                    {reportData.students.filter(s => s.status === 'Present').length}
                                </span>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center relative z-10 border border-emerald-100/50">
                                <BadgeCheck className="w-8 h-8 text-emerald-500" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-rose-100/50 shadow-[0_8px_30px_rgba(244,63,94,0.06)] flex items-center justify-between relative overflow-hidden group">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                                    Total Absent
                                </span>
                                <span className="text-5xl font-black text-slate-800 drop-shadow-sm">
                                    {reportData.students.filter(s => s.status === 'Absent').length}
                                </span>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center relative z-10 border border-rose-100/50">
                                <ShieldAlert className="w-8 h-8 text-rose-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-4">
                        <div className="overflow-x-auto">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Student Identity</th>
                                        <th>Presence Status</th>
                                        <th>Audit Log</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.students.map((st, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 ${st.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {st.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{st.name}</p>
                                                        <p className="font-mono text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">{st.roll_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {st.status === 'Present' ? (
                                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-1.5 border border-emerald-100/50">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-1.5 border border-rose-100/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Absent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 pr-8 text-right">
                                                {st.time ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] md:text-xs font-bold text-slate-700">{st.time}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{st.method.replace('_', ' ')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] md:text-xs font-bold text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
