import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherVerifyPage from "./pages/teacher/TeacherVerifyPage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import TeacherProfilePage from "./pages/teacher/TeacherProfilePage";
import TeacherSubjectsPage from "./pages/teacher/TeacherSubjectsPage";
import TeacherSectionsPage from "./pages/teacher/TeacherSectionsPage";
import TeacherSectionRosterPage from "./pages/teacher/TeacherSectionRosterPage";
import TeacherTimetablePage from "./pages/teacher/TeacherTimetablePage";
import TeacherTodayClassesPage from "./pages/teacher/TeacherTodayClassesPage";
import AttendanceRegistryPage from "./pages/teacher/AttendanceRegistryPage";
import TeacherAttendanceHistoryPage from "./pages/teacher/TeacherAttendanceHistoryPage";
import TeacherSessionReportPage from "./pages/teacher/TeacherSessionReportPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AdminAttendanceLayout from "./pages/admin/attendance/AdminAttendanceLayout";
import AdminAttendanceOverview from "./pages/admin/attendance/AdminAttendanceOverview";
import AdminAttendanceSessions from "./pages/admin/attendance/AdminAttendanceSessions";
import AdminAttendanceAlerts from "./pages/admin/attendance/AdminAttendanceAlerts";
import StudentAttendanceDirectory from "./pages/admin/attendance/StudentAttendanceDirectory";
import StudentAttendanceDetail from "./pages/admin/attendance/StudentAttendanceDetail";
import StudentsPage from "./pages/students/StudentsPage";
import TeachersPage from "./pages/teachers/TeachersPage";
import SubjectsPage from "./pages/subjects/SubjectsPage";
import TimetablePage from "./pages/timetable/TimetablePage";
import CalendarPage from "./pages/calendar/CalendarPage";
import CalendarOverridePage from "./pages/calendar/CalendarOverridePage";
import InstitutionSetupPage from "./pages/admin/institution/InstitutionSetupPage";
import AdminReportsPage from "./pages/admin/reports/AdminReportsPage";
import ReportDashboard from "./pages/admin/reports/ReportDashboard";
import DailyRegisterReport from "./pages/admin/reports/DailyRegisterReport";
import StudentProfileReport from "./pages/admin/reports/StudentProfileReport";
import TrendsAnalyticsReport from "./pages/admin/reports/TrendsAnalyticsReport";
import DefaultersReport from "./pages/admin/reports/DefaultersReport";
import SpecialTrainingReportsPage from "./pages/admin/reports/SpecialTrainingReportsPage";
import TrainingAttendancePage from "./pages/teacher/TrainingAttendancePage";


import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import { Sparkles, ArrowLeft } from "lucide-react";
import GlobalLoader from "./components/GlobalLoader";

function PlaceholderModule({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm mb-4">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title} Module</h2>
      <p className="text-sm text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">
        This module is scheduled for development in future phases. For Day 1, please explore the fully functional <strong>Admin Dashboard</strong> and <strong>Student Management</strong> modules.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <GlobalLoader />
      <ToastProvider>
        <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Validation Route */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="/teacher/verify" element={<TeacherVerifyPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="timetable" element={<TimetablePage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="calendar/configure" element={<CalendarOverridePage />} />
                <Route path="attendance" element={<AdminAttendanceLayout />}>


                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<AdminAttendanceOverview />} />
                  <Route path="sessions" element={<AdminAttendanceSessions />} />
                  <Route path="alerts" element={<AdminAttendanceAlerts />} />
                  <Route path="directory" element={<StudentAttendanceDirectory />} />
                  <Route path="student/:studentId" element={<StudentAttendanceDetail />} />
                </Route>
                <Route path="reports" element={<AdminReportsPage />}>
                  <Route index element={<Navigate to="daily" replace />} />
                  <Route path="dashboard" element={<ReportDashboard />} />
                  <Route path="daily" element={<DailyRegisterReport />} />
                  <Route path="student" element={<StudentProfileReport />} />
                  <Route path="trends" element={<TrendsAnalyticsReport />} />
                  <Route path="defaulters" element={<DefaultersReport />} />
                  <Route path="training" element={<SpecialTrainingReportsPage />} />
                </Route>
                <Route path="institution" element={<InstitutionSetupPage />} />
              </Route>
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboardPage />} />
                <Route path="timetable" element={<TeacherTimetablePage />} />
                <Route path="today" element={<TeacherTodayClassesPage />} />
                <Route path="training-attendance" element={<TrainingAttendancePage />} />
                <Route path="attendance" element={<AttendanceRegistryPage />} />
                <Route path="attendance-history" element={<TeacherAttendanceHistoryPage />} />
                <Route path="history/session/:sessionId" element={<TeacherSessionReportPage />} />
                <Route path="subjects" element={<TeacherSubjectsPage />} />
                <Route path="sections" element={<TeacherSectionsPage />} />
                <Route path="sections/:id" element={<TeacherSectionRosterPage />} />
                <Route path="profile" element={<TeacherProfilePage />} />
                <Route path="notifications" element={<PlaceholderModule title="Notifications" />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
    </>
  );
}
