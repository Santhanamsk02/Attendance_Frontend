import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Upload,
  Search,
  X,
  RefreshCw,
  Trash2,
} from "lucide-react";
import StudentTable from "../../components/students/StudentTable";
import StudentFilters from "../../components/students/StudentFilters";
import StudentModal from "../../components/students/StudentModal";
import BulkImportModal from "../../components/students/BulkImportModal";
import BulkActionBar from "../../components/students/BulkActionBar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import { studentService } from "../../services/studentService";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../hooks/useToast";

const INITIAL_FILTERS = {
  department_id: "",
  batch_id: "",
  semester: "",
  section: "",
  academic_year: "",
  status: "",
};

export default function StudentsPage() {
  const toast = useToast();

  // Data states
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const params = {
          page,
          limit: pagination.limit,
          search: debouncedSearch || undefined,
          department_id: filters.department_id || undefined,
          batch_id: filters.batch_id || undefined,
          semester: filters.semester ? parseInt(filters.semester, 10) : undefined,
          section: filters.section || undefined,
          academic_year: filters.academic_year || undefined,
          status: filters.status || undefined,
        };

        const data = await studentService.getStudents(params);
        setStudents(data.items || []);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          total_pages: data.total_pages,
        });
      } catch (err) {
        toast.error(err.message || "Failed to fetch student records.");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, filters, pagination.limit, toast]
  );

  useEffect(() => {
    fetchStudents(1);
  }, [debouncedSearch, filters, fetchStudents]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchStudents(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    filters.department_id ||
    filters.batch_id ||
    filters.semester ||
    filters.section ||
    filters.academic_year ||
    filters.status
  );

  const handleToggleSelect = (studentId) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = students.map((s) => s.id);
    const isAllPageSelected = pageIds.every((id) => selectedIds.includes(id));

    if (isAllPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  const handleSaveStudent = async (formData) => {
    try {
      setIsSubmitting(true);
      if (selectedStudent && selectedStudent.id) {
        await studentService.updateStudent(selectedStudent.id, formData);
        toast.success(`Student ${formData.name} updated successfully.`);
      } else {
        await studentService.createStudent(formData);
        toast.success(`Student ${formData.name} created successfully.`);
      }
      setIsModalOpen(false);
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err.message || "Failed to save student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      await studentService.deleteStudent(studentToDelete.id);
      toast.success(
        `Student ${studentToDelete.name} (${studentToDelete.roll_no}) deleted successfully.`
      );
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
      setSelectedIds((prev) => prev.filter((id) => id !== studentToDelete.id));

      const nextPage =
        students.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      fetchStudents(nextPage);
    } catch (err) {
      toast.error(err.message || "Failed to delete student.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsDeleting(true);
      const res = await studentService.bulkDeleteStudents(selectedIds);
      toast.success(`Deleted ${res.deleted_count} student(s) successfully.`);
      setIsBulkDeleteDialogOpen(false);
      setSelectedIds([]);

      const remainingOnPage = students.filter((s) => !selectedIds.includes(s.id));
      const nextPage =
        remainingOnPage.length === 0 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      fetchStudents(nextPage);
    } catch (err) {
      toast.error(err.message || "Failed to bulk delete students.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    try {
      setIsDeleting(true);
      const res = await studentService.deleteAll();
      toast.success(res.message || `Deleted all ${res.deleted_count} student(s) successfully.`);
      setIsDeleteAllOpen(false);
      setSelectedIds([]);
      fetchStudents(1);
    } catch (err) {
      toast.error(err.message || "Failed to delete all students.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
            Students Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Manage student enrollment records, academic branches, and 12-char ID barcodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDeleteAllOpen(true)}
            disabled={pagination.total === 0 || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200/60 shadow-2xs"
            title="Delete all students"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            Delete All
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all duration-150"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Import Students
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Crisp Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by 12-char Roll Number (e.g. 2023PECIT410), Student Name, or Email..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all duration-150"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchStudents(pagination.page)}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-50 shadow-2xs transition-all duration-150"
          title="Refresh Directory"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
        </button>
      </div>

      {/* Filter Options */}
      <StudentFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        totalResults={pagination.total}
      />

      {/* Student Data Table with Multi-Selection */}
      <StudentTable
        students={students}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onAdd={handleOpenAdd}
        onImport={() => setIsImportModalOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Pagination Controls */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.total_pages}
        totalItems={pagination.total}
        limit={pagination.limit}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleOpenBulkDelete}
        isLoading={isDeleting}
      />

      {/* Add / Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStudent}
        student={selectedStudent}
        isLoading={isSubmitting}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => fetchStudents(1)}
      />

      {/* Delete Single Student Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Record"
        message={
          studentToDelete
            ? `Are you sure you want to delete student "${studentToDelete.name}" with roll number "${studentToDelete.roll_no}"? This action cannot be undone.`
            : "Are you sure you want to delete this student?"
        }
        confirmText="Delete Student"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Bulk Delete Students"
        message={`Are you sure you want to permanently delete all ${selectedIds.length} selected student(s)? This action will remove their records from the attendance registry.`}
        confirmText={`Delete ${selectedIds.length} Students`}
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Delete All Students Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Delete All Students"
        message={`Are you sure you want to permanently delete ALL ${pagination.total} student record(s)? This action cannot be undone and will delete all associated attendance marks and enrollment history.`}
        confirmText={`Delete All (${pagination.total}) Students`}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
