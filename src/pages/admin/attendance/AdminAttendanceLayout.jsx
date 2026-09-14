import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, ListTodo, Users, AlertTriangle, Download } from 'lucide-react';
import { apiClient } from '../../../services/api';
import ExportReportModal from './ExportReportModal';

export default function AdminAttendanceLayout() {
    const location = useLocation();
    const isStudentDetail = location.pathname.includes('/student/');

    const [isExportOpen, setIsExportOpen] = useState(false);

    const [filters, setFilters] = useState({
        department_id: '',
        batch_id: '',
        semester: '',
        section: ''
    });

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        apiClient.get('/institution/departments').then(res => setDepartments(res.data)).catch(() => { });
    }, []);

    if (isStudentDetail) {
        return (
            <div className="flex-1 w-full flex flex-col min-h-0 bg-slate-50">
                <Outlet />
            </div>
        );
    }

    const tabs = [
        { name: 'Overview', path: 'overview', icon: LayoutDashboard },
        { name: 'Sessions', path: 'sessions', icon: CalendarDays },
        { name: 'Directory', path: 'directory', icon: Users },
        { name: 'Alerts', path: 'alerts', icon: AlertTriangle }
    ];

    const navClass = ({ isActive }) =>
        `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
        }`;

    return (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-slate-50/50">
            {/* Header / Nav */}
            <div className="bg-white/70 backdrop-blur-xl border-b border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10 p-4 shrink-0">
                <div className="flex flex-col gap-4 max-w-7xl mx-auto">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
                            <button onClick={() => setIsExportOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg rounded-xl text-sm font-medium transition-all group">
                                <Download className="w-4 h-4 group-hover:block transition-all" />
                                Export
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">Monitor, analyze and manage student attendance across departments, batches, and semesters.</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <nav className="flex space-x-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <NavLink key={tab.path} to={tab.path} className={navClass}>
                                        <Icon className="w-4 h-4" />
                                        {tab.name}
                                    </NavLink>
                                )
                            })}
                        </nav>

                        <div className="flex gap-2 flex-wrap justify-end">
                            <select
                                className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                value={filters.department_id}
                                onChange={(e) => setFilters(f => ({ ...f, department_id: e.target.value }))}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>

                            <select
                                className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                value={filters.batch_id}
                                onChange={(e) => setFilters(f => ({ ...f, batch_id: e.target.value }))}
                            >
                                <option value="">All Batches</option>
                                {[2022, 2023, 2024, 2025].map(b => <option key={b} value={b.toString()}>{b} Batch</option>)}
                            </select>

                            <select
                                className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                value={filters.semester}
                                onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value }))}
                            >
                                <option value="">All Semesters</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>

                            <select
                                className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                value={filters.section}
                                onChange={(e) => setFilters(f => ({ ...f, section: e.target.value }))}
                            >
                                <option value="">All Sections</option>
                                {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <div className="max-w-7xl mx-auto w-full">
                    <Outlet context={{ filters }} />
                </div>
            </div>

            <ExportReportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} filters={filters} />
        </div>
    );
}
