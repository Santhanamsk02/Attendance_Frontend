import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import Modal from "../common/Modal";
import { apiClient } from "../../services/api";
import { SUBJECT_TYPES, STATUS_OPTIONS } from "../../utils/constants";

const EMPTY_FORM = {
    subject_code: "",
    subject_title: "",
    subject_name: "",
    department_id: "",
    batch_id: "",
    semester: "",
    subject_type: "",
    credits: "",
    description: "",
    status: "active",
};

export default function SubjectForm({
    isOpen,
    onClose,
    onSave,
    editingSubject = null,
    isSubmitting = false,
}) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        if (isOpen && departments.length === 0) {
            const fetchDepts = async () => {
                try {
                    const res = await apiClient.get('/institution/departments');
                    const fullDepts = await Promise.all(res.data.map(async (d) => {
                        const batchRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
                        return { ...d, batches: batchRes.data };
                    }));
                    setDepartments(fullDepts);
                } catch (err) {
                    console.error("Failed to load departments", err);
                }
            };
            fetchDepts();
        }
    }, [isOpen, departments.length]);

    useEffect(() => {
        if (editingSubject) {
            setFormData({
                subject_code: editingSubject.subject_code || "",
                subject_title: editingSubject.subject_title || "",
                subject_name: editingSubject.subject_name || "",
                department_id: editingSubject.department_id || "",
                // Temporarily store academic_year to derive batch_id after departments load
                academic_year: editingSubject.academic_year || "",
                batch_id: "", // Calculated below
                semester: editingSubject.semester?.toString() || "",
                subject_type: editingSubject.subject_type || "",
                credits: editingSubject.credits?.toString() || "",
                description: editingSubject.description || "",
                status: editingSubject.status || "active",
            });
        } else {
            setFormData(EMPTY_FORM);
        }
        setErrors({});
    }, [editingSubject, isOpen]);

    // Derived batch mapping for edits
    useEffect(() => {
        if (editingSubject && departments.length > 0 && formData.department_id && formData.academic_year && !formData.batch_id) {
            const dept = departments.find(d => d.id === formData.department_id);
            if (dept?.batches) {
                const batch = dept.batches.find(b => b.batch_name === formData.academic_year);
                if (batch) {
                    setFormData(prev => ({ ...prev, batch_id: batch.id }));
                }
            }
        }
    }, [departments, editingSubject, formData.department_id, formData.academic_year, formData.batch_id]);

    const validate = () => {
        const errs = {};
        if (!formData.subject_code.trim()) errs.subject_code = "Subject code is required";
        if (!formData.subject_name.trim()) errs.subject_name = "Subject name is required";
        if (formData.subject_name.trim().length > 0 && formData.subject_name.trim().length < 1)
            errs.subject_name = "Min 1 character";
        if (!formData.department_id) errs.department_id = "Department is required";
        if (!formData.batch_id && !formData.academic_year) errs.batch_id = "Academic year is required";
        if (!formData.semester) errs.semester = "Semester is required";
        if (!formData.subject_type) errs.subject_type = "Subject type is required";
        if (formData.credits && (isNaN(formData.credits) || Number(formData.credits) < 0 || Number(formData.credits) > 10))
            errs.credits = "Credits must be 0-10";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const selectedDept = departments.find(d => d.id === formData.department_id);
        const selectedBatch = selectedDept?.batches?.find(b => b.id === formData.batch_id);

        const payload = {
            subject_code: formData.subject_code.trim().toUpperCase(),
            subject_name: formData.subject_name.trim(),
            subject_title: formData.subject_title?.trim() || null,
            department_id: formData.department_id,
            academic_year: selectedBatch ? selectedBatch.batch_name : formData.academic_year,
            semester: parseInt(formData.semester),
            subject_type: formData.subject_type,
            credits: formData.credits ? parseInt(formData.credits) : null,
            description: formData.description?.trim() || null,
            status: formData.status,
        };
        onSave(payload);
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const title = editingSubject ? "Edit Subject" : "Add Subject";

    const selectedDept = departments.find(d => d.id === formData.department_id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Subject Code */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Subject Code *</label>
                        <input
                            type="text"
                            value={formData.subject_code}
                            onChange={(e) => handleChange("subject_code", e.target.value)}
                            placeholder="e.g. IT501"
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.subject_code ? "ring-2 ring-rose-400" : ""}`}
                        />
                        {errors.subject_code && <p className="text-rose-500 text-[10px] mt-0.5">{errors.subject_code}</p>}
                    </div>

                    {/* Subject Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Subject Title</label>
                        <input
                            type="text"
                            value={formData.subject_title}
                            onChange={(e) => handleChange("subject_title", e.target.value)}
                            placeholder="e.g. Data Structures and Algorithms"
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.subject_title ? "ring-2 ring-rose-400" : ""}`}
                        />
                        {errors.subject_title && <p className="text-rose-500 text-[10px] mt-0.5">{errors.subject_title}</p>}
                    </div>

                    {/* Subject Name (Short Name) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Short Name *</label>
                        <input
                            type="text"
                            value={formData.subject_name}
                            onChange={(e) => handleChange("subject_name", e.target.value)}
                            placeholder="e.g. DSA"
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.subject_name ? "ring-2 ring-rose-400" : ""}`}
                        />
                        {errors.subject_name && <p className="text-rose-500 text-[10px] mt-0.5">{errors.subject_name}</p>}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Department *</label>
                        <select
                            value={formData.department_id}
                            onChange={(e) => {
                                handleChange("department_id", e.target.value);
                                handleChange("batch_id", "");
                                handleChange("semester", "");
                            }}
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.department_id ? "ring-2 ring-rose-400" : ""}`}
                        >
                            <option value="">Select Department...</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                            ))}
                        </select>
                        {errors.department_id && <p className="text-rose-500 text-[10px] mt-0.5">{errors.department_id}</p>}
                    </div>

                    {/* Academic Year */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year (Batch) *</label>
                        <select
                            value={formData.batch_id}
                            onChange={(e) => handleChange("batch_id", e.target.value)}
                            disabled={!formData.department_id}
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none disabled:opacity-50 ${errors.batch_id ? "ring-2 ring-rose-400" : ""}`}
                        >
                            <option value="">Select Year...</option>
                            {selectedDept?.batches?.map((b) => (
                                <option key={b.id} value={b.id}>{b.batch_name}</option>
                            ))}
                        </select>
                        {errors.batch_id && <p className="text-rose-500 text-[10px] mt-0.5">{errors.batch_id}</p>}
                    </div>

                    {/* Semester */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Semester *</label>
                        <select
                            value={formData.semester}
                            onChange={(e) => handleChange("semester", e.target.value)}
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.semester ? "ring-2 ring-rose-400" : ""}`}
                        >
                            <option value="">Select Semester...</option>
                            {Array.from({ length: 8 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                            ))}
                        </select>
                        {errors.semester && <p className="text-rose-500 text-[10px] mt-0.5">{errors.semester}</p>}
                    </div>

                    {/* Subject Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Subject Type *</label>
                        <select
                            value={formData.subject_type}
                            onChange={(e) => handleChange("subject_type", e.target.value)}
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.subject_type ? "ring-2 ring-rose-400" : ""}`}
                        >
                            <option value="">Select Type...</option>
                            {SUBJECT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {errors.subject_type && <p className="text-rose-500 text-[10px] mt-0.5">{errors.subject_type}</p>}
                    </div>

                    {/* Credits */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Credits</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={formData.credits}
                            onChange={(e) => handleChange("credits", e.target.value)}
                            placeholder="0-10"
                            className={`w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none ${errors.credits ? "ring-2 ring-rose-400" : ""}`}
                        />
                        {errors.credits && <p className="text-rose-500 text-[10px] mt-0.5">{errors.credits}</p>}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange("status", e.target.value)}
                            className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Brief description (optional)"
                        rows={2}
                        className="w-full rounded-xl neu-input px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 neu-btn hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-200/50 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? "Saving..." : editingSubject ? "Update Subject" : "Add Subject"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
