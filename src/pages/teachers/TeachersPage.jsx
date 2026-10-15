import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Upload,
    Search,
    X,
    RefreshCw,
    Trash2,
} from "lucide-react";
import TeacherTable from "../../components/teachers/TeacherTable";
import TeacherFilters from "../../components/teachers/TeacherFilters";
import TeacherForm from "../../components/teachers/TeacherForm";
import TeacherImportModal from "../../components/teachers/TeacherImportModal";
import BulkActionBar from "../../components/teachers/BulkActionBar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import { teacherService } from "../../services/teacherService";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../hooks/useToast";

const INITIAL_FILTERS = {
    department: "",
    designation: "",
    status: "",
};

export default function TeachersPage() {
    const toast = useToast();

    const [teachers, setTeachers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 1,
    });
    const [isLoading, setIsLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 350);
    const [filters, setFilters] = useState(INITIAL_FILTERS);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTeachers = useCallback(
        async (page = 1) => {
            try {
                setIsLoading(true);
                const params = {
                    page,
                    limit: pagination.limit,
                    search: debouncedSearch || undefined,
                    department: filters.department || undefined,
                    designation: filters.designation || undefined,
                    status: filters.status || undefined,
                };

                const data = await teacherService.getTeachers(params);
                setTeachers(data.items || []);
                setPagination({
                    page: data.page,
                    limit: data.limit,
                    total: data.total,
                    total_pages: data.total_pages,
                });
            } catch (err) {
                toast.error(err.message || "Failed to fetch teacher records.");
            } finally {
                setIsLoading(false);
            }
        },
        [debouncedSearch, filters, pagination.limit, toast]
    );

    useEffect(() => {
        fetchTeachers(1);
    }, [debouncedSearch, filters, fetchTeachers]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            fetchTeachers(newPage);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setFilters(INITIAL_FILTERS);
    };

    const hasActiveFilters = Boolean(
        searchTerm || filters.department || filters.designation || filters.status
    );

    const handleToggleSelect = (teacherId) => {
        setSelectedIds((prev) =>
            prev.includes(teacherId)
                ? prev.filter((id) => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const handleToggleSelectAll = () => {
        const pageIds = teachers.map((s) => s.id);
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
        setSelectedTeacher(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (teacher) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (teacher) => {
        setTeacherToDelete(teacher);
        setIsDeleteDialogOpen(true);
    };

    const handleOpenBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleteDialogOpen(true);
    };

    const handleSaveTeacher = async (formData) => {
        try {
            setIsSubmitting(true);
            if (selectedTeacher && selectedTeacher.id) {
                await teacherService.updateTeacher(selectedTeacher.id, formData);
                toast.success(`Teacher ${formData.name} updated successfully.`);
            } else {
                await teacherService.createTeacher(formData);
                toast.success(`Teacher ${formData.name} created successfully.`);
            }
            setIsModalOpen(false);
            fetchTeachers(pagination.page);
        } catch (err) {
            toast.error(err.message || "Failed to save teacher.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!teacherToDelete) return;
        try {
            setIsDeleting(true);
            await teacherService.deleteTeacher(teacherToDelete.id);
            toast.success(
                `Teacher ${teacherToDelete.name} (${teacherToDelete.employee_id}) deleted successfully.`
            );
            setIsDeleteDialogOpen(false);
            setTeacherToDelete(null);
            setSelectedIds((prev) => prev.filter((id) => id !== teacherToDelete.id));

            const nextPage =
                teachers.length === 1 && pagination.page > 1
                    ? pagination.page - 1
                    : pagination.page;
            fetchTeachers(nextPage);
        } catch (err) {
            toast.error(err.message || "Failed to delete teacher.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            setIsDeleting(true);
            const res = await teacherService.bulkDelete(selectedIds);
            toast.success(`Deleted ${res.deleted_count} teacher(s) successfully.`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);

            const remainingOnPage = teachers.filter((s) => !selectedIds.includes(s.id));
            const nextPage =
                remainingOnPage.length === 0 && pagination.page > 1
                    ? pagination.page - 1
                    : pagination.page;
            fetchTeachers(nextPage);
        } catch (err) {
            toast.error(err.message || "Failed to bulk delete teachers.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmDeleteAll = async () => {
        try {
            setIsDeleting(true);
            const res = await teacherService.deleteAll();
            toast.success(res.message || `Deleted all ${res.deleted_count} teacher(s) successfully.`);
            setIsDeleteAllOpen(false);
            setSelectedIds([]);
            fetchTeachers(1);
        } catch (err) {
            toast.error(err.message || "Failed to delete all teachers.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
                        Teachers Directory
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                        Manage faculty records, departments, and roles.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setIsDeleteAllOpen(true)}
                        disabled={pagination.total === 0 || isLoading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200/60 shadow-2xs"
                        title="Delete all teachers"
                    >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        Delete All
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all duration-150"
                    >
                        <Upload className="w-4 h-4 text-slate-500" />
                        Import Teachers
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-150"
                    >
                        <Plus className="w-4 h-4" />
                        Add Teacher
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Employee ID (e.g. EMP001), Name, or Email..."
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

                <button
                    onClick={() => fetchTeachers(pagination.page)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-50 shadow-2xs transition-all duration-150"
                    title="Refresh Directory"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
                </button>
            </div>

            <TeacherFilters
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
                totalResults={pagination.total}
            />

            <TeacherTable
                teachers={teachers}
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

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
                isLoading={isLoading}
                itemName="teachers"
            />

            <BulkActionBar
                selectedCount={selectedIds.length}
                onClearSelection={handleClearSelection}
                onBulkDelete={handleOpenBulkDelete}
                isLoading={isDeleting}
            />

            <TeacherForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveTeacher}
                teacher={selectedTeacher}
                isLoading={isSubmitting}
            />

            <TeacherImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={() => fetchTeachers(1)}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Teacher Record"
                message={
                    teacherToDelete
                        ? `Are you sure you want to delete teacher "${teacherToDelete.name}" with Employee ID "${teacherToDelete.employee_id}"? This action cannot be undone.`
                        : "Are you sure you want to delete this teacher?"
                }
                confirmText="Delete Teacher"
                isLoading={isDeleting}
                variant="danger"
            />

            <ConfirmDialog
                isOpen={isBulkDeleteDialogOpen}
                onClose={() => setIsBulkDeleteDialogOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Bulk Delete Teachers"
                message={`Are you sure you want to permanently delete all ${selectedIds.length} selected teacher(s)?`}
                confirmText={`Delete ${selectedIds.length} Teachers`}
                isLoading={isDeleting}
                variant="danger"
            />

            {/* Delete All Teachers Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteAllOpen}
                onClose={() => setIsDeleteAllOpen(false)}
                onConfirm={handleConfirmDeleteAll}
                title="Delete All Teachers"
                message={`Are you sure you want to permanently delete ALL ${pagination.total} teacher record(s)? This action cannot be undone and will delete all associated timetables, course assignments, and attendance logs.`}
                confirmText={`Delete All (${pagination.total}) Teachers`}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
