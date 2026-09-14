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
      {/* Top Banner / Welcome with Light Blue to Light Violet Gradient */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-[6px_6px_24px_rgba(99,102,241,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] border border-white/30 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md mb-3 border border-white/25 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.4)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Overall Administration
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl leading-relaxed font-medium">
            Real-time overview of students, teachers, and registrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-900 font-extrabold text-xs shadow-[4px_4px_14px_rgba(0,0,0,0.15)] hover:bg-sky-50 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 text-violet-600" />
            Add Student
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs shadow-[2px_2px_10px_rgba(0,0,0,0.1)] transition-all backdrop-blur-md"
          >
            <Upload className="w-4 h-4 text-sky-200" />
            Bulk Import
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <h3 className="text-base font-black text-slate-800 tracking-tight ml-1">Statistics Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          title="Total Teachers"
          value={teacherStats.total_teachers}
          subtitle="Registered faculty"
          icon={Users}
          color="indigo"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Active Teachers"
          value={teacherStats.active_teachers}
          subtitle="Currently active"
          icon={UserCheck}
          color="teal"
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
          color="indigo"
          isLoading={isLoadingStats}
        />
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
          <div className="rounded-3xl neu-card p-6">
            <h3 className="text-sm font-black text-slate-800 mb-3.5">
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-slate-700 hover:text-violet-600 text-xs font-semibold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl neu-icon-well text-sky-600">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-violet-600">Add Single Student</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Manual form registration
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-slate-700 hover:text-violet-600 text-xs font-semibold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl neu-icon-well text-violet-600">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-violet-600">Bulk Import Records</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Upload CSV or XLSX batch
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </button>

              <Link
                to="/students"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-slate-700 hover:text-violet-600 text-xs font-semibold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl neu-icon-well text-sky-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-violet-600">Student Directory</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Search, bulk delete & filter
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
              </Link>

              <Link
                to="/teachers"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl neu-btn text-slate-700 hover:text-violet-600 text-xs font-semibold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl neu-icon-well text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-violet-600">Teacher Directory</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Search, bulk delete & filter
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
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
