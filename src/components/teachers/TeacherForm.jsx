import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import { STATUS_OPTIONS } from "../../utils/constants";
import { apiClient } from "../../services/api";

const INITIAL_FORM = {
    employee_id: "",
    name: "",
    email: "",
    phone: "",
    department: "",     // stores department_id value from the select
    designation: "",
    status: "active",
};

export default function TeacherForm({
    isOpen,
    onClose,
    onSubmit,
    teacher = null,
    isLoading = false,
}) {
    const isEdit = Boolean(teacher && teacher.id);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [departments, setDepartments] = useState([]);
    const [isFetchingDepts, setIsFetchingDepts] = useState(false);
    const [errors, setErrors] = useState({});

    // Fetch dynamic departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setIsFetchingDepts(true);
                const res = await apiClient.get("/institution/departments");
                setDepartments(Array.isArray(res.data) ? res.data : (res.data.items || []));
            } catch (error) {
                console.error("Failed to fetch departments", error);
            } finally {
                setIsFetchingDepts(false);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (teacher) {
            setFormData({
                employee_id: teacher.employee_id || "",
                name: teacher.name || "",
                email: teacher.email || "",
                phone: teacher.phone || "",
                department: teacher.department_id || (Array.isArray(departments) && departments.length > 0 ? departments[0].id : ""),
                designation: teacher.designation || "",
                status: teacher.status || "active",
            });
        } else {
            setFormData(INITIAL_FORM);
        }
        setErrors({});
    }, [teacher, isOpen]);

    const validate = () => {
        const newErrors = {};

        const trimmedEmpId = formData.employee_id.trim().toUpperCase();
        if (!trimmedEmpId) {
            newErrors.employee_id = "Employee ID is required";
        } else if (trimmedEmpId.length < 2) {
            newErrors.employee_id = "Employee ID must be at least 2 characters";
        }

        if (!formData.name.trim()) {
            newErrors.name = "Teacher name is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Teacher name must be at least 2 characters";
        }

        if (formData.email && formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                newErrors.email = "Please enter a valid email address";
            }
        }

        if (!formData.department) {
            newErrors.department = "Department is required";
        }

        if (formData.phone && formData.phone.trim()) {
            const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
            if (cleanPhone.length < 5) {
                newErrors.phone = "Please enter a valid phone number";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "employee_id") {
            formattedValue = value.toUpperCase().slice(0, 50);
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

        // Build payload with correct key names expected by the backend
        const { department, ...rest } = formData;
        const payload = {
            ...rest,
            department_id: department,
            employee_id: formData.employee_id.trim().toUpperCase(),
            name: formData.name.trim(),
            email: formData.email ? formData.email.trim().toLowerCase() : null,
            phone: formData.phone ? formData.phone.trim() : null,
            designation: formData.designation ? formData.designation.trim() : null,
        };

        onSubmit(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Teacher" : "Add Teacher"}
            subtitle={
                isEdit
                    ? `Update details for Employee ID ${teacher?.employee_id}`
                    : "Register a new teacher into the system"
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Employee ID */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                                Employee ID <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold neu-badge-violet">
                                {formData.employee_id.length} chars
                            </span>
                        </div>
                        <input
                            type="text"
                            name="employee_id"
                            maxLength={50}
                            value={formData.employee_id}
                            onChange={handleChange}
                            placeholder="e.g. EMP001"
                            disabled={isLoading}
                            className={`w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-mono font-bold tracking-wide focus:outline-none ${errors.employee_id ? "border-rose-400 focus:ring-rose-200" : ""
                                }`}
                        />
                        {errors.employee_id && (
                            <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.employee_id}</p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                            Teacher Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Dr. Kumar"
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
                            placeholder="teacher@example.com"
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
                            className={`w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-medium focus:outline-none ${errors.phone ? "border-rose-400 focus:ring-rose-200" : ""
                                }`}
                        />
                        {errors.phone && (
                            <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.phone}</p>
                        )}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                            Department <span className="text-rose-500">*</span>
                        </label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            disabled={isLoading || isFetchingDepts}
                            className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm bg-[#f4f8fd] font-semibold text-slate-700 focus:outline-none"
                        >
                            <option value="" disabled>Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </option>
                            ))}
                        </select>
                        {errors.department && (
                            <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.department}</p>
                        )}
                    </div>

                    {/* Designation */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                            Designation
                        </label>
                        <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            placeholder="e.g. Professor"
                            disabled={isLoading}
                            className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-sm font-medium focus:outline-none"
                        />
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
                        {isEdit ? "Update Teacher" : "Save Teacher"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
