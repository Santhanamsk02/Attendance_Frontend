import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, RotateCcw, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../services/api";
import Pagination from "../../../components/common/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";

export default function StudentAttendanceDirectory() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [students, setStudents] = useState([]);

    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isDeptsLoading, setIsDeptsLoading] = useState(false);
    const [sections, setSections] = useState([]);
    const [isSectionsLoading, setIsSectionsLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 350);
    const [filters, setFilters] = useState({
        departmentId: "",
        batchId: "",
        section: ""
    });

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                setIsDeptsLoading(true);
                const res = await apiClient.get('/institution/departments');
                const fullDepts = await Promise.all(res.data.map(async (d) => {
                    const batchRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
                    return { ...d, batches: batchRes.data };
                }));
                setDepartments(fullDepts);
            } catch (err) {
                console.error("Failed to load departments", err);
            } finally {
                setIsDeptsLoading(false);
            }
        };
        fetchDepts();
    }, []);

    useEffect(() => {
        const fetchSections = async () => {
            if (!filters.batchId) {
                setSections([]);
                return;
            }
            setIsSectionsLoading(true);
            try {
                const res = await apiClient.get(`/institution/batches/${filters.batchId}/sections`);
                setSections(res.data);
            } catch (err) {
                console.error("Failed to load sections", err);
                setSections([]);
            } finally {
                setIsSectionsLoading(false);
            }
        };
        fetchSections();
    }, [filters.batchId]);

    const fetchStudents = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const params = {
                page,
                page_size: pagination.limit,
                query: debouncedSearch || undefined,
                departmentId: filters.departmentId || undefined,
                batchId: filters.batchId || undefined,
                section: filters.section || undefined,
            };

            const res = await apiClient.get('/admin/attendance/students', { params });
            setStudents(res.data.items);
            setPagination(prev => ({
                ...prev,
                page: res.data.page,
                total: res.data.total
            }));
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, filters, pagination.limit]);

    useEffect(() => {
        fetchStudents(1);
    }, [fetchStudents]);

    const handleFilterChange = (key, value) => {
        const updates = { ...filters };
        updates[key] = value;
        if (key === "departmentId") {
            updates.batchId = "";
            updates.section = "";
        }
        if (key === "batchId") {
            updates.section = "";
        }
        setFilters(updates);
    };

    const handleResetFilters = () => {
        setFilters({ departmentId: "", batchId: "", section: "" });
        setSearchTerm("");
    };

    const selectedDept = departments.find(d => d.id === filters.departmentId);
    const selectedBatch = selectedDept?.batches?.find(b => b.id === filters.batchId);

    const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Attendance Directory</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Filter and view comprehensive attendance reports for individual students.</p>
                </div>
            </div>

            {/* Filters Segment */}
            <div className="rounded-3xl neu-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100/80">
                    <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                        <div className="p-1.5 rounded-xl neu-icon-well text-sky-600">
                            <Filter className="w-3.5 h-3.5" />
                        </div>
                        <span>Directory Segmentation</span>
                    </div>
                    <button onClick={handleResetFilters} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">
                        <RotateCcw className="w-3 h-3" /> Clear All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Search User</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Roll # or Name"
                                className="w-full pl-9 pr-3 py-2 rounded-xl neu-input text-xs font-semibold focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Department</label>
                        <select
                            value={filters.departmentId}
                            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
                            disabled={isDeptsLoading}
                            className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Batch</label>
                        <select
                            value={filters.batchId}
                            onChange={(e) => handleFilterChange("batchId", e.target.value)}
                            disabled={!filters.departmentId || isDeptsLoading}
                            className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
                        >
                            <option value="">All Batches</option>
                            {selectedDept?.batches?.map(b => (
                                <option key={b.id} value={b.id}>{b.batch_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Section</label>
                        <select
                            value={filters.section}
                            onChange={(e) => handleFilterChange("section", e.target.value)}
                            disabled={!filters.batchId || isSectionsLoading}
                            className="w-full rounded-xl neu-input px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none disabled:opacity-50"
                        >
                            <option value="">All Sections</option>
                            {sections.map((sec) => (
                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Directory List */}
            <div className="rounded-3xl neu-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Department</th>
                                <th>Batch</th>
                                <th>Section</th>
                                <th>Current Year</th>
                                <th>Attendance Rate</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-semibold">
                                        <div className="animate-pulse">Loading directory...</div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-semibold">
                                        No students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                students.map((st) => (
                                    <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                    {st.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{st.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{st.roll_no}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p className="font-bold text-slate-800">{st.department_code || st.department_name}</p>
                                        </td>
                                        <td>
                                            <p className="font-semibold text-slate-600">{st.batch_name}</p>
                                        </td>
                                        <td>
                                            <p className="font-semibold text-slate-600">{st.section}</p>
                                        </td>
                                        <td>
                                            <p className="font-semibold text-slate-600">{st.current_year || (st.academic_year || st.batch_name)}</p>
                                        </td>
                                        <td className="text-center">
                                            {st.expected_sessions > 0 ? (
                                                <div className="inline-flex items-center justify-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${st.attendance_percentage > 85 ? 'bg-emerald-50 text-emerald-600' :
                                                        st.attendance_percentage > 75 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {st.attendance_percentage}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">No Sessions</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => navigate(`/attendance/student/${st.id}`)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors shadow-sm border border-emerald-100"
                                            >
                                                View Report <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!isLoading && students.length > 0 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={totalPages}
                    totalItems={pagination.total}
                    limit={pagination.limit}
                    onPageChange={(p) => fetchStudents(p)}
                />
            )}
        </div>
    );
}
