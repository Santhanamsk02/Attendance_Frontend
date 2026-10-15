import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  User,
  MapPin,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Tag,
  FileText,
} from "lucide-react";
import specialTrainingService from "../../services/specialTrainingService";
import { useToast } from "../../context/ToastContext";
import { getSubjectPalette } from "../../utils/subjectColors";

export default function TrainingSubjectsModal({
  isOpen,
  onClose,
  training,
  onUpdated,
}) {
  const { success, error: showError } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Mode: "none" | "add" | "edit"
  const [formMode, setFormMode] = useState("none");
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formTrainer, setFormTrainer] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Deletion state
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Load subjects from DB
  const loadSubjects = async () => {
    if (!training?.id) return;
    setLoading(true);
    try {
      const data = await specialTrainingService.getSubjects(training.id);
      setSubjects(data || []);
    } catch (err) {
      console.error("Failed to load training subjects", err);
      showError("Failed to load subjects for this training.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && training?.id) {
      loadSubjects();
      setFormMode("none");
      setSearchQuery("");
      setConfirmDeleteId(null);
    }
  }, [isOpen, training?.id]);

  // Open add form
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormTrainer(training?.trainer_name || "");
    setFormVenue(training?.venue || "");
    setFormDescription("");
    setFormError("");
    setFormMode("add");
  };

  // Open edit form
  const handleOpenEdit = (subj) => {
    setEditingId(subj.id);
    setFormName(subj.name || "");
    setFormCode(subj.code || "");
    setFormTrainer(subj.trainer_name || "");
    setFormVenue(subj.venue || "");
    setFormDescription(subj.description || "");
    setFormError("");
    setFormMode("edit");
  };

  // Cancel form
  const handleCancelForm = () => {
    setFormMode("none");
    setEditingId(null);
    setFormError("");
  };

  // Submit Add / Edit
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError("Subject name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      name: trimmedName,
      code: formCode.trim() || null,
      trainer_name: formTrainer.trim() || null,
      venue: formVenue.trim() || null,
      description: formDescription.trim() || null,
    };

    try {
      if (formMode === "edit" && editingId) {
        await specialTrainingService.updateSubject(training.id, editingId, payload);
        success("Training subject updated successfully.");
      } else {
        await specialTrainingService.createSubject(training.id, payload);
        success("Training subject added successfully.");
      }
      handleCancelForm();
      await loadSubjects();
      onUpdated?.();
    } catch (err) {
      console.error("Failed to save training subject", err);
      const msg = err.response?.data?.detail || "Failed to save subject.";
      setFormError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete subject
  const handleDeleteSubject = async (subjectId) => {
    setDeletingId(subjectId);
    try {
      await specialTrainingService.deleteSubject(training.id, subjectId);
      success("Training subject deleted successfully.");
      setConfirmDeleteId(null);
      await loadSubjects();
      onUpdated?.();
    } catch (err) {
      console.error("Failed to delete training subject", err);
      showError("Failed to delete subject.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.trainer_name?.toLowerCase().includes(q) ||
        s.venue?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  if (!isOpen || !training) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Times_New_Roman',_Times,_serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/60">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  Manage Subjects · {training.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
                </span>
              </div>
              <p className="text-xs font-normal text-slate-500 mt-0.5">
                Cohort: <span className="font-bold text-slate-700">{training.batch_name}</span> · Configure subjects & modules persisted for timetable scheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Search + Add Button) */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects, codes, trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={loadSubjects}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
              title="Refresh subjects"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {formMode === "none" && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Add / Edit Form Card */}
        {formMode !== "none" && (
          <div className="px-6 py-4 bg-emerald-50/40 border-b border-emerald-100 animate-fade-in shrink-0">
            <form onSubmit={handleSaveSubject} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  {formMode === "edit" ? <Pencil className="w-3.5 h-3.5 text-emerald-700" /> : <Plus className="w-3.5 h-3.5 text-emerald-700" />}
                  {formMode === "edit" ? "Edit Training Subject" : "Add New Training Subject"}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Subject Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Web Development"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ST-FS01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Trainer / Instructor
                  </label>
                  <input
                    type="text"
                    placeholder={training.trainer_name || "Trainer Name"}
                    value={formTrainer}
                    onChange={(e) => setFormTrainer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Venue / Classroom
                  </label>
                  <input
                    type="text"
                    placeholder={training.venue || "e.g. Lab 4 or Auditorium"}
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Description / Syllabus Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of training topics covered..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{formMode === "edit" ? "Update Subject" : "Save Subject to DB"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Body / Subjects List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 opacity-60" />
              <p className="text-xs font-semibold">Loading subjects from database...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <div>
                <h4 className="text-sm font-bold text-slate-700">
                  {searchQuery ? "No matching subjects found" : "No training subjects configured yet"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-normal">
                  {searchQuery
                    ? "Try adjusting your search query to find the subject."
                    : "Add subjects and modules here so faculty can schedule and drag them directly onto the timetable grid."}
                </p>
              </div>
              {formMode === "none" && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Subject</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSubjects.map((subj) => {
                const pal = getSubjectPalette(subj.name);
                const isConfirmingDelete = confirmDeleteId === subj.id;
                const isDeletingThis = deletingId === subj.id;

                return (
                  <div
                    key={subj.id}
                    className={`relative rounded-2xl border ${pal.light} bg-white shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between`}
                  >
                    {/* Left vertical color accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                      style={{
                        background: `linear-gradient(to bottom, ${pal.accent}, ${pal.accent}aa)`,
                      }}
                    />

                    <div className="pl-4 pr-3.5 pt-3.5 pb-3">
                      {/* Top Row: Title + Code Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className={`text-sm font-bold ${pal.text} tracking-tight line-clamp-1`}>
                            {subj.name}
                          </h4>
                          {subj.code && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 mt-1">
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              {subj.code}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(subj)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Subject"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : subj.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Trainer & Venue info */}
                      <div className="space-y-1 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-normal text-slate-500">Trainer:</span>
                          <span className="text-[11px] font-bold text-slate-800 truncate">
                            {subj.trainer_name || training.trainer_name || "General Trainer"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-normal text-slate-500">Venue:</span>
                          <span className="text-[11px] font-bold text-slate-800 truncate">
                            {subj.venue || training.venue || "Campus Venue"}
                          </span>
                        </div>

                        {subj.description && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-normal line-clamp-2">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span>{subj.description}</span>
                          </div>
                        )}
                      </div>

                      {/* Delete Confirmation Banner */}
                      {isConfirmingDelete && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 animate-fade-in">
                          <div className="text-[11px] font-bold text-rose-800">
                            Delete this subject from DB?
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingThis}
                              onClick={() => handleDeleteSubject(subj.id)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                              {isDeletingThis ? "Deleting..." : "Confirm Delete"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-normal">
            Changes are saved directly in database and instantly reflected in timetable configurations.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
