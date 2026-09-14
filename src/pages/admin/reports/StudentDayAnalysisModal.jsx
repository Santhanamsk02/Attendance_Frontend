import React, { useEffect, useState } from "react";
import { X, Calendar, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { reportsService } from "../../../services/reportsService";

const StatusPill = ({ status, isMorning = false }) => {
  if (status === "PRESENT") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E8E5A] bg-[#1E8E5A]/10 px-2.5 py-1 rounded-full border border-[#1E8E5A]/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Present
      </span>
    );
  }
  if (status === "ABSENT") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D64550] bg-[#D64550]/10 px-2.5 py-1 rounded-full border border-[#D64550]/20">
        <XCircle className="w-3.5 h-3.5" />
        Absent
      </span>
    );
  }
  if (status === "NOT_CONDUCTED" || status === "NOT_TAKEN" || status === "NO_DATA") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5C6773] bg-[#5C6773]/10 px-2.5 py-1 rounded-full border border-[#5C6773]/20">
        <Clock className="w-3.5 h-3.5" />
        {isMorning ? "Not Conducted" : "Not Taken"}
      </span>
    );
  }
  return null;
};

export default function StudentDayAnalysisModal({ studentId, date, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsService.getStudentDayAnalysis(studentId, date);
        setData(response.data);
      } catch (err) {
        console.error("Failed to load day analysis:", err);
        setError("Failed to load analysis for this date.");
      } finally {
        setLoading(false);
      }
    };
    if (studentId && date) fetchAnalysis();
  }, [studentId, date]);

  // Handle Escape to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!studentId || !date) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#F6F5F1] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5"
        onClick={e => e.stopPropagation()} // trap clicks inside modal
      >
        {/* Header (Ink Navy) */}
        <div className="bg-[#14213D] text-white px-6 py-5 flex items-start justify-between relative shrink-0">
          <div className="flex-1 pr-4">
            {loading ? (
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
            ) : (
              <h2 className="text-xl font-serif font-semibold tracking-wide">
                {data?.student?.name || "Student Analysis"}
              </h2>
            )}
            
            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/70 font-medium">
              {loading ? (
                <div className="h-4 w-64 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{data?.student?.roll_no}</span>
                  <span>&bull;</span>
                  <span>{data?.student?.department} &middot; {data?.student?.batch}</span>
                  <span>&bull;</span>
                  <span>Year {data?.student?.year} &middot; Sec {data?.student?.section}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {!loading && data && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 text-[10px] text-white/60 font-medium uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <StatusPill status={data.day_status} />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <div className="h-16 bg-slate-200/50 rounded-xl animate-pulse"></div>
              <div className="h-48 bg-slate-200/50 rounded-xl animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-slate-600 font-medium">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Removed Legacy Note */}

              {/* Morning Entry */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Morning Entry</h3>
                    <p className="text-xs text-slate-500 font-medium">Daily Roll Call</p>
                  </div>
                </div>
                <StatusPill status={data.morning_entry.status} isMorning={true} />
              </div>

              {/* Period Grid */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Period Schedule
                  </h3>
                </div>
                {data.periods.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm font-medium">
                    No periods scheduled for this section today.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500">Period</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500">Subject</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500">Teacher</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.periods.map((p, idx) => {
                          const isNotTaken = p.status === "NOT_TAKEN" || p.status === "NOT_CONDUCTED" || p.status === "NO_DATA";
                          const isAbsent = p.status === "ABSENT";
                          const isPresent = p.status === "PRESENT";

                          let rowClass = "transition-colors ";
                          if (isNotTaken) rowClass += "bg-yellow-100 hover:bg-yellow-200";
                          else if (isAbsent) rowClass += "bg-red-100 hover:bg-red-200";
                          else if (isPresent) rowClass += "bg-emerald-100 hover:bg-emerald-200";
                          else rowClass += "hover:bg-slate-100";

                          return (
                            <tr key={idx} className={rowClass}>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {p.span > 1 
                                    ? `Periods ${p.period_id.replace('period-', '')}–${parseInt(p.period_id.replace('period-', '')) + p.span - 1}` 
                                    : p.period_id.replace('period-', 'P')}
                                </span>
                              </td>
                              <td className={`px-4 py-3 font-medium ${isNotTaken ? "text-slate-500" : "text-slate-800"}`}>
                                <div className="flex items-center gap-2">
                                  <span>{p.subject}</span>
                                  {p.type === 'laboratory' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                                      LAB
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`px-4 py-3 ${isNotTaken ? "text-slate-400" : "text-slate-600"}`}>
                                {p.teacher}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <StatusPill status={p.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
