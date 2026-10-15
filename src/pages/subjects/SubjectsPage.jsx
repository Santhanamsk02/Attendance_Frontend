import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Upload,
    Search,
    X,
    RefreshCw,
    BookOpen,
    Trash2,
} from "lucide-react";
import SubjectTable from "../../components/subjects/SubjectTable";
import SubjectFilters from "../../components/subjects/SubjectFilters";
import SubjectForm from "../../components/subjects/SubjectForm";
import SubjectImportModal from "../../components/subjects/SubjectImportModal";
import BulkActionBar from "../../components/subjects/BulkActionBar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import { subjectService } from "../../services/subjectService";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../hooks/useToast";

const INITIAL_FILTERS = {
    department: "",
    academic_year: "",
    semester: "",
    subject_type: "",
    status: "",
};

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [selectedIds, setSelectedIds] = useState([]);

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [deletingSubject, setDeletingSubject] = useState(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debouncedSearch = useDebounce(search, 500);
    const toast = useToast();

    const fetchSubjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await subjectService.getSubjects({
                page,
                limit,
                search: debouncedSearch,
                ...filters,
            });
            setSubjects(data.items);
            setTotal(data.total);
            setTotalPages(data.total_pages);
        } catch (err) {
            toast.error(err.message || "Failed to fetch subjects");
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, filters, toast]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    // Reset page when search or filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filters]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleResetFilters = () => {
        setFilters(INITIAL_FILTERS);
        setSearch("");
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (subjects.length === 0) return;
        if (selectedIds.length === subjects.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(subjects.map((s) => s.id));
        }
    };

    const handleSaveSubject = async (formData) => {
        setIsSubmitting(true);
        try {
            if (editingSubject) {
                await subjectService.updateSubject(editingSubject.id, formData);
                toast.success("Subject updated successfully");
            } else {
                await subjectService.createSubject(formData);
                toast.success("Subject created successfully");
            }
            setIsAddOpen(false);
            setEditingSubject(null);
            fetchSubjects();
        } catch (err) {
            toast.error(err.message || "Failed to save subject");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingSubject) return;
        setIsSubmitting(true);
        try {
            await subjectService.deleteSubject(deletingSubject.id);
            toast.success("Subject deleted successfully");
            setIsDeleteOpen(false);
            setDeletingSubject(null);
            setSelectedIds((prev) => prev.filter((id) => id !== deletingSubject.id));
            fetchSubjects();
        } catch (err) {
            toast.error(err.message || "Failed to delete subject");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsSubmitting(true);
        try {
            const res = await subjectService.bulkDelete(selectedIds);
            toast.success(res.message || `Deleted ${res.deleted_count} subjects`);
            setIsBulkDeleteOpen(false);
            setSelectedIds([]);
            fetchSubjects();
        } catch (err) {
            toast.error(err.message || "Failed to delete subjects");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDeleteAll = async () => {
        setIsSubmitting(true);
        try {
            const res = await subjectService.deleteAll();
            toast.success(res.message || `Deleted all ${res.deleted_count} subject(s)`);
            setIsDeleteAllOpen(false);
            setSelectedIds([]);
            fetchSubjects();
        } catch (err) {
            toast.error(err.message || "Failed to delete all subjects");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
                        Subjects Directory
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                        Manage course subjects, theory and lab assignments.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setIsDeleteAllOpen(true)}
                        disabled={total === 0 || loading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200/60 shadow-2xs"
                        title="Delete all subjects"
                    >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        Delete All
                    </button>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all duration-150"
                    >
                        <Upload className="w-4 h-4 text-slate-500" />
                        Import Subjects
                    </button>
                    <button
                        onClick={() => {
                            setEditingSubject(null);
                            setIsAddOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-150"
                    >
                        <Plus className="w-4 h-4" />
                        Add Subject
                    </button>
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Modern Inset Search Bar */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by subject code, name, or department..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all duration-150"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Refresh button */}
                <button
                    onClick={fetchSubjects}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-50 shadow-2xs transition-all duration-150"
                    title="Refresh Directory"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <SubjectFilters
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
            />

            <SubjectTable
                subjects={subjects}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onEdit={(subj) => {
                    setEditingSubject(subj);
                    setIsAddOpen(true);
                }}
                onDelete={(subj) => {
                    setDeletingSubject(subj);
                    setIsDeleteOpen(true);
                }}
                isLoading={loading}
            />

            {!loading && subjects.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    limit={limit}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Floating Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedIds.length}
                onClearSelection={() => setSelectedIds([])}
                onBulkDelete={() => setIsBulkDeleteOpen(true)}
                isLoading={isSubmitting}
            />

            {/* Modals */}
            <SubjectForm
                isOpen={isAddOpen}
                onClose={() => {
                    setIsAddOpen(false);
                    setEditingSubject(null);
                }}
                onSave={handleSaveSubject}
                editingSubject={editingSubject}
                isSubmitting={isSubmitting}
            />

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Subject"
                message={`Are you sure you want to delete ${deletingSubject?.subject_code} - ${deletingSubject?.subject_name}?`}
                isLoading={isSubmitting}
            />

            <ConfirmDialog
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Delete Multiple Subjects"
                message={`Are you sure you want to delete ${selectedIds.length} selected subjects?`}
                isLoading={isSubmitting}
            />

            {/* Delete All Subjects Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteAllOpen}
                onClose={() => setIsDeleteAllOpen(false)}
                onConfirm={handleConfirmDeleteAll}
                title="Delete All Subjects"
                message={`Are you sure you want to permanently delete ALL ${total} subject(s)? This action cannot be undone and will delete associated timetable entries and section assignments.`}
                confirmText={`Delete All (${total}) Subjects`}
                isLoading={isSubmitting}
                variant="danger"
            />

            <SubjectImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={() => {
                    fetchSubjects();
                }}
            />
        </div>
    );
}
