import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import { apiClient } from "../../services/api";
import { STATUS_OPTIONS } from "../../utils/constants";

const INITIAL_FORM = {
  roll_no: "",
  name: "",
  email: "",
  phone: "",
  department_id: "",
  batch_id: "",
  semester: 1,
  section: "A",
  academic_year: "",
  status: "active",
};

export default function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  student = null,
  isLoading = false,
}) {
  const isEdit = Boolean(student && student.id);
  const [formData, setFormData] = useState(INITIAL_FORM);
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
    if (student) {
      setFormData({
        roll_no: student.roll_no || "",
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        department_id: student.department_id || "",
        batch_id: student.batch_id || "",
        semester: student.semester || 1,
        section: student.section || "A",
        academic_year: student.academic_year || "",
        status: student.status || "active",
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrors({});
  }, [student, isOpen]);

  const validate = () => {
    const newErrors = {};

    const trimmedRoll = formData.roll_no.trim().toUpperCase();
    if (!trimmedRoll) {
      newErrors.roll_no = "Roll number is required";
    } else if (trimmedRoll.length < 3) {
      newErrors.roll_no = "Roll number must be at least 3 characters";
    } else if (!/^[A-Za-z0-9\-_/]+$/.test(trimmedRoll)) {
      newErrors.roll_no = "Roll number contains invalid characters";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Student name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Student name must be at least 2 characters";
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }

    if (!formData.batch_id) {
      newErrors.batch_id = "Batch is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "roll_no") {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9\-_/]/g, "").slice(0, 30);
    } else if (name === "section") {
      formattedValue = value.toUpperCase().slice(0, 10);
    } else if (name === "semester") {
      formattedValue = parseInt(value, 10) || "";
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedDept = departments.find(d => d.id === formData.department_id);
    const selectedBatch = selectedDept?.batches?.find(b => b.id === formData.batch_id);

    const payload = {
      ...formData,
      roll_no: formData.roll_no.trim().toUpperCase(),
      name: formData.name.trim(),
      section: formData.section.trim().toUpperCase(),
      email: formData.email ? formData.email.trim().toLowerCase() : null,
      phone: formData.phone ? formData.phone.trim() : null,
      semester: selectedBatch ? selectedBatch.current_semester : formData.semester,
      academic_year: selectedBatch ? selectedBatch.batch_name : formData.academic_year,
    };

    onSubmit(payload);
  };

  const selectedDept = departments.find(d => d.id === formData.department_id);
  const selectedBatch = selectedDept?.batches?.find(b => b.id === formData.batch_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Student Record" : "Add New Student"}
      subtitle={
        isEdit
          ? `Update details for roll number ${student?.roll_no}`
          : "Register a new student into the college attendance directory"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Roll Number (Flexible length) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold neu-badge-violet">
                {formData.roll_no.length} chars
              </span>
            </div>
            <input
              type="text"
              name="roll_no"
              maxLength={30}
              value={formData.roll_no}
              onChange={handleChange}
              placeholder="e.g. 2023PECCSE100, 2023PECAIDS230"
              disabled={isLoading}
              className={`w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-mono font-bold tracking-wide focus:outline-none ${errors.roll_no ? "border-rose-400 focus:ring-rose-200" : ""
                }`}
            />
            {errors.roll_no && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.roll_no}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Examples: <span className="font-mono text-violet-700 font-bold">2023PECCSE100</span>, <span className="font-mono text-sky-700 font-bold">2023PECAIDS230</span>
            </p>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Arun Kumar"
              disabled={isLoading}
              className={`w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-semibold focus:outline-none ${errors.name ? "border-rose-400 focus:ring-rose-200" : ""
                }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              disabled={isLoading}
              className={`w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-medium focus:outline-none ${errors.email ? "border-rose-400 focus:ring-rose-200" : ""
                }`}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              disabled={isLoading}
              className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-medium focus:outline-none"
            />
          </div>

          {/* Department */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  department_id: e.target.value,
                  batch_id: "",
                  semester: 1,
                  section: "A"
                }));
              }}
              disabled={isLoading}
              className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm bg-[#f4f8fd] font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">Select Department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            {errors.department_id && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.department_id}</p>
            )}
          </div>

          {/* Academic Batch (4-Year Gap Cohort) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Academic Batch <span className="text-rose-500">*</span>
            </label>
            <select
              name="batch_id"
              value={formData.batch_id}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  batch_id: e.target.value,
                  section: "A"
                }));
              }}
              disabled={isLoading || !formData.department_id}
              className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm bg-[#f4f8fd] font-semibold text-slate-700 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select Batch...</option>
              {selectedDept?.batches?.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.batch_name}
                </option>
              ))}
            </select>
            {errors.batch_id && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.batch_id}</p>
            )}
          </div>

          {/* Section (Dropdown) */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Section <span className="text-rose-500">*</span>
            </label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              disabled={isLoading || !formData.batch_id}
              className={`w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-bold text-slate-700 bg-[#f4f8fd] focus:outline-none disabled:opacity-50 ${errors.section ? "border-rose-400 focus:ring-rose-200" : ""
                }`}
            >
              {selectedBatch && Array.from({ length: selectedBatch.sections_count }).map((_, i) => (
                <option key={i} value={String.fromCharCode(65 + i)}>
                  Section {String.fromCharCode(65 + i)}
                </option>
              ))}
            </select>
            {errors.section && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.section}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm bg-[#f4f8fd] font-semibold text-slate-700 focus:outline-none"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100/80 pt-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-2xl neu-btn px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl neu-btn-primary px-6 py-2.5 text-xs font-extrabold disabled:opacity-60"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Update Student" : "Save Student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
