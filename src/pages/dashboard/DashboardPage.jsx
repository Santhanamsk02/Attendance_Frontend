import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  UserCheck,
  UserPlus,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  GraduationCap
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import RecentStudentsTable from "../../components/dashboard/RecentStudentsTable";
import RecentTeachersTable from "../../components/dashboard/RecentTeachersTable";
import RecentSubjectsTable from "../../components/dashboard/RecentSubjectsTable";
import RecentDepartmentsTable from "../../components/dashboard/RecentDepartmentsTable";
import RecentBatchesTable from "../../components/dashboard/RecentBatchesTable";
import StudentModal from "../../components/students/StudentModal";
import BulkImportModal from "../../components/students/BulkImportModal";
import { apiClient } from "../../services/api";
import { studentService } from "../../services/studentService";
import { teacherService } from "../../services/teacherService";
import { subjectService } from "../../services/subjectService";
import { useToast } from "../../hooks/useToast";

export default function DashboardPage() {
  const toast = useToast();

  const [studentStats, setStudentStats] = useState({
    total_students: 0,
    departments: 0,
    active_students: 0,
    recently_added: 0,
  });
  const [teacherStats, setTeacherStats] = useState({
    total_teachers: 0,
    active_teachers: 0,
    inactive_teachers: 0,
    departments: 0,
  });
  const [subjectStats, setSubjectStats] = useState({
    total_subjects: 0,
    active_subjects: 0,
    inactive_subjects: 0,
    departments: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentTeachers, setRecentTeachers] = useState([]);
  const [recentSubjects, setRecentSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const [sStats, tStats, subStats] = await Promise.all([
        studentService.getStats(),
        teacherService.getStats(),
        subjectService.getStats()
      ]);
      setStudentStats(sStats);
      setTeacherStats(tStats);
      setSubjectStats(subStats);
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard metrics.");
    } finally {
      setIsLoadingStats(false);
    }

    try {
      setIsLoadingRecent(true);
      const [listParamsStudents, listParamsTeachers, listParamsSubjects, deptRes] = await Promise.all([
        studentService.getStudents({ limit: 5, page: 1 }),
        teacherService.getTeachers({ limit: 5, page: 1 }),
        subjectService.getSubjects({ limit: 5, page: 1 }),
        apiClient.get('/institution/departments')
      ]);
      setRecentStudents(listParamsStudents.items || []);
      setRecentTeachers(listParamsTeachers.items || []);
      setRecentSubjects(listParamsSubjects.items || []);

      const deptList = deptRes.data || [];
      setDepartments(deptList);

      const allBatches = [];
      for (const d of deptList) {
        const bRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
        const enrichedBatches = bRes.data.map(b => ({
          ...b,
          department_name: d.name,
          department_code: d.code,
        }));
        allBatches.push(...enrichedBatches);
      }
      setBatches(allBatches);

    } catch (err) {
      // Handled silently
    } finally {
      setIsLoadingRecent(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateStudent = async (formData) => {
    try {
      setIsSubmitting(true);
      await studentService.createStudent(formData);
      toast.success(`Student ${formData.name} added successfully!`);
      setIsAddModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || "Failed to add student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Top Banner / Welcome with Modern Crisp Styling */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Institutional Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-normal leading-relaxed">
            Real-time management of student cohorts, faculty assignments, courses, and department statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-xs transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs transition-all duration-150"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Bulk Import
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-0.5">
          Campus Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={studentStats.total_students}
            subtitle="Registered in database"
            icon={Users}
            color="sky"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Active Students"
            value={studentStats.active_students}
            subtitle="Eligible for attendance"
            icon={UserCheck}
            color="emerald"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Recent Students"
            value={studentStats.recently_added}
            subtitle="Recent enrollments"
            icon={UserPlus}
            color="amber"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Departments"
            value={studentStats.departments}
            subtitle="Active academic branches"
            icon={Building2}
            color="violet"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Total Faculty"
            value={teacherStats.total_teachers}
            subtitle="Registered teachers"
            icon={Users}
            color="violet"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Active Faculty"
            value={teacherStats.active_teachers}
            subtitle="Currently teaching"
            icon={UserCheck}
            color="emerald"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Total Subjects"
            value={subjectStats.total_subjects}
            subtitle="Offered courses"
            icon={BookOpen}
            color="sky"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Active Subjects"
            value={subjectStats.active_subjects}
            subtitle="Curriculum active"
            icon={ShieldCheck}
            color="amber"
            isLoading={isLoadingStats}
          />
        </div>
      </div>

      {/* Quick Actions & Recent Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Data */}
        <div className="lg:col-span-2 space-y-6">
          <RecentDepartmentsTable
            departments={departments}
            isLoading={isLoadingRecent}
          />
          <RecentBatchesTable
            batches={batches}
            isLoading={isLoadingRecent}
          />
          <RecentStudentsTable
            students={recentStudents}
            isLoading={isLoadingRecent}
          />
          <RecentTeachersTable
            teachers={recentTeachers}
            isLoading={isLoadingRecent}
          />
          <RecentSubjectsTable
            subjects={recentSubjects}
            isLoading={isLoadingRecent}
          />
        </div>

        {/* Right 1 Col: Shortcuts & Module Overview */}
        <div className="space-y-6">
          {/* Quick Actions Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 text-xs font-semibold text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Add Single Student</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Manual form registration
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 text-xs font-semibold text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Bulk Import Records</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Upload CSV or XLSX batch
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <Link
                to="/students"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 text-xs font-semibold text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Student Directory</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Search, bulk delete & filter
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              <Link
                to="/teachers"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 text-xs font-semibold text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Teacher Directory</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Manage faculty & subject allocations
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Student Modals */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateStudent}
        isLoading={isSubmitting}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={fetchDashboardData}
      />
    </div>
  );
}
