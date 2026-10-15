import React, { useState, useEffect } from 'react';
import { Building2, GraduationCap, Plus, Save, ServerCrash, Pencil, Trash2, Sparkles, Award, Users, Calendar, Clock, BookOpen } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiClient } from '../../../services/api';
import specialTrainingService from '../../../services/specialTrainingService';
import SpecialTrainingModal from '../../../components/training/SpecialTrainingModal';
import TrainingEnrollmentModal from '../../../components/training/TrainingEnrollmentModal';
import TrainingSubjectsModal from '../../../components/training/TrainingSubjectsModal';
import TrainingTimetableModal from '../../../components/training/TrainingTimetableModal';

export default function InstitutionSetupPage() {
    const [activeView, setActiveView] = useState("departments"); // "departments" | "special_training"
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { success, error: showError } = useToast();

    // Special Training states
    const [trainings, setTrainings] = useState([]);
    const [loadingTrainings, setLoadingTrainings] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [editingTraining, setEditingTraining] = useState(null);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [selectedTrainingForEnroll, setSelectedTrainingForEnroll] = useState(null);
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
    const [selectedTrainingForSubjects, setSelectedTrainingForSubjects] = useState(null);
    const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
    const [selectedTrainingForTimetable, setSelectedTrainingForTimetable] = useState(null);

    // Form inputs
    const [deptForm, setDeptForm] = useState({ name: '', code: '', morning_entry_time: '' });
    const [batchForm, setBatchForm] = useState({
        department_id: '',
        batch_name: '',
        current_year: 1,
        current_semester: 1,
        sections_count: 5
    });

    const [isAddingDept, setIsAddingDept] = useState(false);
    const [editingDeptId, setEditingDeptId] = useState(null);

    const [isAddingBatch, setIsAddingBatch] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });


    const fetchInstitutionData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/institution/departments?include_batches=true');
            const deptList = res.data;

            const loadedDepts = await Promise.all(deptList.map(async (d) => {
                const batchRes = await apiClient.get(`/institution/departments/${d.id}/batches`);
                return { ...d, batches: batchRes.data };
            }));

            setDepartments(loadedDepts);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to load institutional hierarchy.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTrainings = async () => {
        try {
            setLoadingTrainings(true);
            const data = await specialTrainingService.getAll();
            setTrainings(data || []);
        } catch (err) {
            console.error("Failed to load special trainings", err);
        } finally {
            setLoadingTrainings(false);
        }
    };

    useEffect(() => {
        fetchInstitutionData();
        fetchTrainings();
    }, []);

    const handleSaveTraining = async (formData) => {
        try {
            if (editingTraining?.id) {
                await specialTrainingService.update(editingTraining.id, formData);
                success(`Training updated successfully.`);
            } else {
                await specialTrainingService.create(formData);
                success(`Special training ${formData.name} created successfully.`);
            }
            setIsTrainingModalOpen(false);
            setEditingTraining(null);
            fetchTrainings();
        } catch (err) {
            showError(err.response?.data?.detail || err.message || "Failed to save training");
        }
    };

    const handleDeleteTraining = (training) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Special Training',
            message: `Are you sure you want to delete "${training.name}"? All enrollments and timetable slots for this training will be removed.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await specialTrainingService.delete(training.id);
                    success(`Training deleted successfully.`);
                    fetchTrainings();
                } catch (err) {
                    showError(err.response?.data?.detail || err.message || "Failed to delete training");
                }
            }
        });
    };


    // Helper handlers to open forms
    const openAddDept = () => {
        setDeptForm({ name: '', code: '', morning_entry_time: '' });
        setEditingDeptId(null);
        setIsAddingDept(true);
    };

    const openEditDept = (dept) => {
        setDeptForm({ name: dept.name, code: dept.code, morning_entry_time: dept.morning_entry_time || '' });
        setEditingDeptId(dept.id);
        setIsAddingDept(true);
    };

    const openAddBatch = () => {
        setBatchForm({ department_id: '', batch_name: '', current_year: 1, current_semester: 1, sections_count: 5 });
        setEditingBatchId(null);
        setIsAddingBatch(true);
    };

    const openEditBatch = (deptId, batch) => {
        setBatchForm({
            department_id: deptId,
            batch_name: batch.batch_name,
            current_year: batch.current_year,
            current_semester: batch.current_semester,
            sections_count: batch.sections_count
        });
        setEditingBatchId(batch.id);
        setIsAddingBatch(true);
    };

    const closeDeptForm = () => {
        setIsAddingDept(false);
        setEditingDeptId(null);
    };

    const closeBatchForm = () => {
        setIsAddingBatch(false);
        setEditingBatchId(null);
    };

    const handleCreateOrUpdateDepartment = async (e) => {
        e.preventDefault();
        try {
            if (editingDeptId) {
                await apiClient.put(`/institution/departments/${editingDeptId}`, deptForm);
                success(`Department updated successfully.`);
            } else {
                await apiClient.post('/institution/departments', deptForm);
                success(`Department ${deptForm.name} created successfully.`);
            }
            closeDeptForm();
            fetchInstitutionData();
        } catch (err) {
            showError(err.message || "Failed to save department");
        }
    };

    const handleCreateOrUpdateBatch = async (e) => {
        e.preventDefault();
        if (!batchForm.department_id) {
            showError("Please select a department first.");
            return;
        }

        const payload = {
            batch_name: batchForm.batch_name,
            current_year: parseInt(batchForm.current_year),
            current_semester: parseInt(batchForm.current_semester),
            sections_count: parseInt(batchForm.sections_count),
        };

        try {
            if (editingBatchId) {
                await apiClient.put(`/institution/departments/${batchForm.department_id}/batches/${editingBatchId}`, payload);
                success(`Batch updated successfully.`);
            } else {
                await apiClient.post(`/institution/departments/${batchForm.department_id}/batches`, payload);
                success(`Batch ${batchForm.batch_name} created successfully.`);
            }
            closeBatchForm();
            fetchInstitutionData();
        } catch (err) {
            showError(err.message || "Failed to save batch");
        }
    };

    const handleDeleteDepartment = (deptId, name) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Department',
            message: `Are you sure you want to delete the ${name} department? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await apiClient.delete(`/institution/departments/${deptId}`);
                    success(`Department ${name} deleted successfully.`);
                    fetchInstitutionData();
                } catch (err) {
                    showError(err.response?.data?.detail || err.message || "Failed to delete department");
                }
            }
        });
    };

    const handleDeleteBatch = (deptId, batchId, name) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Batch',
            message: `Are you sure you want to delete the ${name} batch? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await apiClient.delete(`/institution/departments/${deptId}/batches/${batchId}`);
                    success(`Batch ${name} deleted successfully.`);
                    fetchInstitutionData();
                } catch (err) {
                    showError(err.response?.data?.detail || err.message || "Failed to delete batch");
                }
            }
        });
    };


    if (loading && departments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 opacity-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading institution architecture...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl neu-card mx-4">
                <ServerCrash className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h3 className="text-rose-800 font-bold text-lg">System Error</h3>
                <p className="text-rose-600 text-sm mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-[24px] font-black text-slate-800 tracking-tight leading-tight">Institution Architecture</h1>
                    <p className="text-[15px] font-semibold text-slate-500 mt-1">
                        {activeView === "departments"
                            ? "Manage global structural namespaces (Departments & Cohorts)."
                            : "Configure Final Year Special Training programs, shared timetables, and multi-staff attendance."}
                    </p>
                </div>
                {activeView === "departments" ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={openAddBatch}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all duration-150"
                        >
                            <GraduationCap className="w-4 h-4 text-slate-500" /> Add Batch
                        </button>
                        <button
                            onClick={openAddDept}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-150"
                        >
                            <Building2 className="w-4 h-4" /> Add Department
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setEditingTraining(null);
                            setIsTrainingModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all duration-150"
                    >
                        <Sparkles className="w-4 h-4" /> Create Special Training
                    </button>
                )}
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/50 p-1 rounded-2xl border border-slate-200/70 max-w-fit shadow-2xs">
                <button
                    onClick={() => setActiveView("departments")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeView === "departments"
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                >
                    <Building2 className={`w-3.5 h-3.5 ${activeView === "departments" ? "text-indigo-600" : "text-slate-400"}`} />
                    Departments & Cohorts
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeView === "departments" ? "bg-indigo-50 text-indigo-700" : "bg-slate-200 text-slate-600"
                    }`}>
                        {departments.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveView("special_training")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeView === "special_training"
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                >
                    <Sparkles className={`w-3.5 h-3.5 ${activeView === "special_training" ? "text-violet-600" : "text-slate-400"}`} />
                    Final Year Special Trainings
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeView === "special_training" ? "bg-violet-50 text-violet-700" : "bg-slate-200 text-slate-600"
                    }`}>
                        {trainings.length}
                    </span>
                </button>
            </div>


            {/* VIEW 1: DEPARTMENTS & COHORTS */}
            {activeView === "departments" && (
                <>
                    {/* Department Modal */}

            {isAddingDept && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="neu-card border border-slate-100 p-6 bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative">
                        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                            {editingDeptId ? 'Edit Department' : 'Register New Department'}
                        </h2>
                        <form onSubmit={handleCreateOrUpdateDepartment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Department Full Name</label>
                                <input type="text" required value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="e.g. Information Technology" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Department Code</label>
                                <input type="text" required value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} placeholder="e.g. IT" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Morning Entry Time (Optional)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="time" 
                                        value={(deptForm.morning_entry_time || "").split("-")[0] || ""} 
                                        onChange={e => {
                                            const end = (deptForm.morning_entry_time || "").split("-")[1] || "";
                                            setDeptForm({ ...deptForm, morning_entry_time: e.target.value || end ? `${e.target.value}-${end}` : "" });
                                        }} 
                                        className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    />
                                    <span className="text-slate-400 font-bold text-sm">to</span>
                                    <input 
                                        type="time" 
                                        value={(deptForm.morning_entry_time || "").split("-")[1] || ""} 
                                        onChange={e => {
                                            const start = (deptForm.morning_entry_time || "").split("-")[0] || "";
                                            setDeptForm({ ...deptForm, morning_entry_time: start || e.target.value ? `${start}-${e.target.value}` : "" });
                                        }} 
                                        className="w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 ml-1 font-semibold">Leave blank to disable morning entry.</p>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={closeDeptForm} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Modal */}
            {isAddingBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="neu-card border border-indigo-100 p-6 bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative">
                        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-500" />
                            {editingBatchId ? 'Edit form Configuration' : 'Activate New Batch'}
                        </h2>
                        <form onSubmit={handleCreateOrUpdateBatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Parent Department</label>
                                <select
                                    required
                                    disabled={!!editingBatchId}
                                    value={batchForm.department_id}
                                    onChange={e => setBatchForm({ ...batchForm, department_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <option value="">Select Department...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Batch Label</label>
                                <input type="text" required value={batchForm.batch_name} onChange={e => setBatchForm({ ...batchForm, batch_name: e.target.value })} placeholder="2023-2027" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Current Year</label>
                                <input type="number" min="1" max="4" required value={batchForm.current_year} onChange={e => setBatchForm({ ...batchForm, current_year: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Current Semester</label>
                                <input type="number" min="1" max="8" required value={batchForm.current_semester} onChange={e => setBatchForm({ ...batchForm, current_semester: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Section Count</label>
                                <input type="number" min="1" max="26" required value={batchForm.sections_count} onChange={e => setBatchForm({ ...batchForm, sections_count: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            <div className="lg:col-span-5 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={closeBatchForm} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Existing Infrastructure List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {departments.map(dept => (
                    <div key={dept.id} className="neu-card bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[17px] font-black text-slate-800 tracking-tight">{dept.name}</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditDept(dept)}
                                            className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                            title="Edit Department"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                            title="Delete Department"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Code: {dept.code}</p>
                                    {dept.morning_entry_time && (
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 rounded">
                                            Morning Entry: {dept.morning_entry_time}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                                <Building2 className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-2">Active Batches ({dept.batches?.length || 0})</h4>

                            {dept.batches?.length === 0 ? (
                                <p className="text-xs text-slate-400 font-semibold italic text-center py-4 bg-slate-50 rounded-xl">No active batches assigned.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(dept.batches || []).map(batch => (
                                        <div key={batch.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/60 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3 shrink-0 mb-3 sm:mb-0">
                                                <div className="w-8 h-8 rounded-xl bg-white text-indigo-500 flex items-center justify-center shadow-sm shrink-0">
                                                    <GraduationCap className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-700">{batch.batch_name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year {batch.current_year} · Sem {batch.current_semester}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center items-end gap-3 w-full sm:w-auto">
                                                <div className="flex flex-wrap justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity max-w-[280px]">
                                                    {Array.from({ length: batch.sections_count }).map((_, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-[10px] font-black text-indigo-700 shrink-0 shadow-[inset_1px_1px_3px_rgba(255,255,255,1)]">
                                                            {String.fromCharCode(65 + i)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => openEditBatch(dept.id, batch)}
                                                        className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition-all"
                                                        title="Edit Batch"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBatch(dept.id, batch.id, batch.batch_name)}
                                                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                                                        title="Delete Batch"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {departments.length === 0 && !loading && (
                <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">No Departments Established</h3>
                    <p className="text-sm font-semibold text-slate-400 mt-2 max-w-sm mx-auto">Create your first department above to begin constructing the institutional architecture.</p>
                </div>
            )}
        </>
    )}

            {/* VIEW 2: FINAL YEAR SPECIAL TRAINING PROGRAMS */}
            {activeView === "special_training" && (
                <div className="space-y-6">
                    {loadingTrainings ? (
                        <div className="p-12 text-center text-sm font-semibold text-slate-400 animate-pulse">
                            Loading special training programs...
                        </div>
                    ) : trainings.length === 0 ? (
                        <div className="p-12 text-center bg-white/80 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div className="max-w-md mx-auto">
                                <h3 className="text-lg font-bold text-slate-800">No Final Year Special Trainings Created</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Create shared training programs for final year cohorts across multiple departments. You can schedule shared timetables, assign trainers to take class, and assign multiple teachers to take attendance concurrently.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingTraining(null);
                                    setIsTrainingModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" /> Create Special Training
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {trainings.map(t => (
                                <div
                                    key={t.id}
                                    className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-5 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                                                        FINAL YEAR BATCH: {t.batch_name}
                                                    </span>
                                                    {t.venue && (
                                                        <span className="text-[11px] font-semibold text-slate-500">
                                                            • {t.venue}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{t.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        setEditingTraining(t);
                                                        setIsTrainingModalOpen(true);
                                                    }}
                                                    className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                                    title="Edit Training Details"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTraining(t)}
                                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                                    title="Delete Special Training"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {t.trainer_name && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                                <Award className="w-4 h-4 text-violet-500 shrink-0" />
                                                <span>
                                                    Trainer: <strong className="text-slate-800">{t.trainer_name}</strong>
                                                    {t.trainer_organization && (
                                                        <span className="text-slate-400"> ({t.trainer_organization})</span>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {t.description && (
                                            <p className="text-xs text-slate-500 font-medium line-clamp-2">
                                                {t.description}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                            <div className="bg-indigo-50/50 border border-indigo-100/70 p-3 rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Enrolled Students</span>
                                                <p className="text-lg font-black text-slate-900 mt-0.5">
                                                    {t.enrolled_count} <span className="text-xs font-semibold text-slate-500 font-normal">({t.departments_count} Depts)</span>
                                                </p>
                                            </div>
                                            <div className="bg-emerald-50/50 border border-emerald-100/70 p-3 rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Training Subjects</span>
                                                <p className="text-lg font-black text-slate-900 mt-0.5">
                                                    {t.subjects_count || 0} <span className="text-xs font-semibold text-slate-500 font-normal">Configured</span>
                                                </p>
                                            </div>
                                            <div className="bg-violet-50/50 border border-violet-100/70 p-3 rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-violet-700">Timetable Slots</span>
                                                <p className="text-lg font-black text-slate-900 mt-0.5">
                                                    {t.timetable_slots_count} <span className="text-xs font-semibold text-slate-500 font-normal">Scheduled</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                setSelectedTrainingForEnroll(t);
                                                setIsEnrollModalOpen(true);
                                            }}
                                            className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            Manage Students
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedTrainingForSubjects(t);
                                                setIsSubjectsModalOpen(true);
                                            }}
                                            className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            Manage Subjects
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedTrainingForTimetable(t);
                                                setIsTimetableModalOpen(true);
                                            }}
                                            className="px-3 py-2 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Calendar className="w-3.5 h-3.5" />
                                            Timetable & Staff
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Special Training Modals */}
            <SpecialTrainingModal
                isOpen={isTrainingModalOpen}
                onClose={() => {
                    setIsTrainingModalOpen(false);
                    setEditingTraining(null);
                }}
                onSave={handleSaveTraining}
                editingTraining={editingTraining}
            />

            <TrainingEnrollmentModal
                isOpen={isEnrollModalOpen}
                onClose={() => {
                    setIsEnrollModalOpen(false);
                    setSelectedTrainingForEnroll(null);
                }}
                training={selectedTrainingForEnroll}
                onUpdated={fetchTrainings}
            />

            <TrainingSubjectsModal
                isOpen={isSubjectsModalOpen}
                onClose={() => {
                    setIsSubjectsModalOpen(false);
                    setSelectedTrainingForSubjects(null);
                }}
                training={selectedTrainingForSubjects}
                onUpdated={fetchTrainings}
            />

            <TrainingTimetableModal
                isOpen={isTimetableModalOpen}
                onClose={() => {
                    setIsTimetableModalOpen(false);
                    setSelectedTrainingForTimetable(null);
                }}
                training={selectedTrainingForTimetable}
                onUpdated={fetchTrainings}
            />

            {/* Confirmation Modal */}

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="neu-card border border-slate-100 p-6 bg-white rounded-3xl shadow-2xl w-full max-w-md relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-black text-slate-800">{confirmModal.title}</h2>
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mb-6">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                            <button onClick={confirmModal.onConfirm} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
