import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Users,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Building2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import specialTrainingService from "../../services/specialTrainingService";
import { apiClient } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function TrainingEnrollmentModal({ isOpen, onClose, training, onUpdated }) {
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState("available"); // "available" or "enrolled"
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allBatches, setAllBatches] = useState(false);

  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection state
  const [selectedAvailableIds, setSelectedAvailableIds] = useState(new Set());
  const [selectedEnrolledIds, setSelectedEnrolledIds] = useState(new Set());
  const [processing, setProcessing] = useState(false);

  // Load departments
  useEffect(() => {
    if (!isOpen) return;
    const fetchDepts = async () => {
      try {
        const res = await apiClient.get("/institution/departments");
        setDepartments(res.data || []);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepts();
  }, [isOpen]);

  // Load students for this training
  const fetchStudents = async () => {
    if (!training?.id) return;
    setLoading(true);
    try {
      const data = await specialTrainingService.getStudents(training.id, {
        department_id: selectedDept || undefined,
        section: selectedSection || undefined,
        search: searchQuery || undefined,
        all_batches: allBatches,
      });
      setEnrolledStudents(data.enrolled || []);
      setAvailableStudents(data.available || []);
      setSelectedAvailableIds(new Set());
      setSelectedEnrolledIds(new Set());
    } catch (err) {
      console.error("Failed to fetch students", err);
      showError("Failed to fetch students for this training.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && training?.id) {
      fetchStudents();
    }
  }, [isOpen, training?.id, selectedDept, selectedSection, searchQuery, allBatches]);

  if (!isOpen || !training) return null;

  // Bulk Enroll Action
  const handleEnrollSelected = async () => {
    const ids = Array.from(selectedAvailableIds);
    if (ids.length === 0) return;

    setProcessing(true);
    try {
      const res = await specialTrainingService.enrollStudents(training.id, ids);
      success(res.message || `Enrolled ${ids.length} students!`);
      fetchStudents();
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.detail || err.message || "Failed to enroll students");
    } finally {
      setProcessing(false);
    }
  };

  // Bulk Unenroll Action
  const handleUnenrollSelected = async () => {
    const ids = Array.from(selectedEnrolledIds);
    if (ids.length === 0) return;

    setProcessing(true);
    try {
      const res = await specialTrainingService.unenrollStudents(training.id, ids);
      success(res.message || `Unenrolled ${ids.length} students.`);
      fetchStudents();
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.detail || err.message || "Failed to unenroll students");
    } finally {
      setProcessing(false);
    }
  };

  // Toggle selection
  const toggleAvailable = (id) => {
    setSelectedAvailableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllAvailable = () => {
    if (selectedAvailableIds.size === availableStudents.length) {
      setSelectedAvailableIds(new Set());
    } else {
      setSelectedAvailableIds(new Set(availableStudents.map((s) => s.id)));
    }
  };

  const toggleEnrolled = (id) => {
    setSelectedEnrolledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllEnrolled = () => {
    if (selectedEnrolledIds.size === enrolledStudents.length) {
      setSelectedEnrolledIds(new Set());
    } else {
      setSelectedEnrolledIds(new Set(enrolledStudents.map((s) => s.id)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200/80 animate-scale-up space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Enroll Students: {training.name}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Batch: <strong className="text-indigo-600 font-bold">{training.batch_name}</strong> • Multi-Department Roster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "available"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Eligible Students to Enroll
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-600">
                {availableStudents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "enrolled"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Currently Enrolled Roster
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600">
                {enrolledStudents.length}
              </span>
            </button>
          </div>

          {/* Action button */}
          {activeTab === "available" && (
            <button
              onClick={handleEnrollSelected}
              disabled={selectedAvailableIds.size === 0 || processing}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 shadow-xs transition-all flex items-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Enroll Selected ({selectedAvailableIds.size})
            </button>
          )}

          {activeTab === "enrolled" && (
            <button
              onClick={handleUnenrollSelected}
              disabled={selectedEnrolledIds.size === 0 || processing}
              className="px-5 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/50 disabled:opacity-40 shadow-xs transition-all flex items-center gap-2"
            >
              <UserMinus className="w-3.5 h-3.5" />
              Unenroll Selected ({selectedEnrolledIds.size})
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full appearance-none px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 pr-8 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="allBatchesCheck"
              checked={allBatches}
              onChange={(e) => setAllBatches(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="allBatchesCheck" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
              Include Other Batches
            </label>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl min-h-[260px]">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
              Loading student roster...
            </div>
          ) : activeTab === "available" ? (
            availableStudents.length === 0 ? (
              <div className="p-12 text-center text-xs font-semibold text-slate-400">
                No eligible students found to enroll matching the filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          availableStudents.length > 0 &&
                          selectedAvailableIds.size === availableStudents.length
                        }
                        onChange={toggleAllAvailable}
                        className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-4">Roll Number</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {availableStudents.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => toggleAvailable(s.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedAvailableIds.has(s.id) ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <td className="py-2 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAvailableIds.has(s.id)}
                          onChange={() => toggleAvailable(s.id)}
                          className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-slate-900">{s.roll_no}</td>
                      <td className="py-2 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.department_name}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-600">{s.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : enrolledStudents.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-400">
              No students enrolled in this training yet. Switch to "Eligible Students" to enroll.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        enrolledStudents.length > 0 &&
                        selectedEnrolledIds.size === enrolledStudents.length
                      }
                      onChange={toggleAllEnrolled}
                      className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-4">Roll Number</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Section</th>
                  <th className="py-2.5 px-4">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {enrolledStudents.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => toggleEnrolled(s.id)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      selectedEnrolledIds.has(s.id) ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="py-2 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedEnrolledIds.has(s.id)}
                        onChange={() => toggleEnrolled(s.id)}
                        className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-slate-900">{s.roll_no}</td>
                    <td className="py-2 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.department_name}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-600">{s.section}</td>
                    <td className="py-2 px-4 text-slate-400 text-[11px]">
                      {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500">
            Total Enrolled: <strong className="text-slate-800">{enrolledStudents.length}</strong> students across multiple departments
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
