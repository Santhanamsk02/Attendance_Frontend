import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Users, Search, ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { apiClient } from "../../services/api";

export default function TeacherSectionRosterPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const subjectCode = searchParams.get("sc");
    const sectionName = searchParams.get("sec");
    const batchTitle = searchParams.get("name") || id;

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!subjectCode || !sectionName) {
            navigate("/teacher/sections");
            return;
        }

        const fetchRoster = async () => {
            try {
                const res = await apiClient.get(`/teacher/roster?subject_code=${subjectCode}&section_name=${sectionName}`);
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to fetch roster", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoster();
    }, [subjectCode, sectionName, navigate]);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/teacher/sections")}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Sections
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                <div>
                    <h1 className="text-[24px] font-black text-slate-800 tracking-tight leading-tight">
                        {batchTitle} Roster
                    </h1>
                    <p className="text-[15px] font-semibold text-slate-500 mt-1">
                        Viewing all {students.length} students enrolled in this cohort.
                    </p>
                </div>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student or roll no..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full md:w-64 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center animate-pulse text-slate-500 font-bold bg-white rounded-3xl border border-slate-100">
                    Loading roster data...
                </div>
            ) : (
                <div className="bg-white rounded-3xl neu-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Roll Number</th>
                                    <th>Student Details</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student, idx) => (
                                        <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-5">
                                                <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    {student.roll_no}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-sky-50 flex items-center justify-center font-bold text-indigo-600 border border-indigo-100 uppercase">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                        <p className="text-[11px] font-semibold text-slate-400 capitalize">{student.department?.name || "Unknown Department"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1">
                                                    {student.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
                                                        </div>
                                                    )}
                                                    {student.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full w-max text-xs font-bold border border-emerald-100">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Active
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-slate-500 font-semibold text-sm">
                                            No students found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
