import React, { useState, useEffect } from "react";
import { X, Sparkles, Building2, Calendar, UserCheck, MapPin, AlignLeft } from "lucide-react";
import { apiClient } from "../../services/api";

export default function SpecialTrainingModal({ isOpen, onClose, onSave, editingTraining = null }) {
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    batch_name: "",
    batch_id: "",
    trainer_name: "",
    trainer_organization: "",
    venue: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch batches from DB
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const res = await apiClient.get("/institution/departments?include_batches=true");
        const allBatches = [];
        const seenNames = new Set();

        res.data?.forEach((d) => {
          d.batches?.forEach((b) => {
            if (!seenNames.has(b.batch_name)) {
              seenNames.add(b.batch_name);
              allBatches.push({
                id: b.id,
                batch_name: b.batch_name,
                current_year: b.current_year,
                department_name: d.name,
              });
            }
          });
        });

        setBatches(allBatches);

        if (editingTraining) {
          setFormData({
            name: editingTraining.name || "",
            batch_name: editingTraining.batch_name || (allBatches[0]?.batch_name || ""),
            batch_id: editingTraining.batch_id || "",
            trainer_name: editingTraining.trainer_name || "",
            trainer_organization: editingTraining.trainer_organization || "",
            venue: editingTraining.venue || "",
            start_date: editingTraining.start_date || "",
            end_date: editingTraining.end_date || "",
            description: editingTraining.description || "",
          });
        } else {
          setFormData({
            name: "",
            batch_name: allBatches[0]?.batch_name || "",
            batch_id: allBatches[0]?.id || "",
            trainer_name: "",
            trainer_organization: "",
            venue: "",
            start_date: "",
            end_date: "",
            description: "",
          });
        }
      } catch (err) {
        console.error("Failed to load batches", err);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, [isOpen, editingTraining]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.batch_name) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200/80 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingTraining ? "Edit Special Training" : "Create Final Year Special Training"}
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Shared placement/skill training across multiple departments
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Training Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Full Stack Web Development & Placement Training"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Training Batch (From DB) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.batch_name}
                onChange={(e) => {
                  const bName = e.target.value;
                  const bObj = batches.find((b) => b.batch_name === bName);
                  setFormData({ ...formData, batch_name: bName, batch_id: bObj?.id || "" });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {batches.map((b) => (
                  <option key={b.id || b.batch_name} value={b.batch_name}>
                    {b.batch_name} (Year {b.current_year})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Trainer Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Kumar"
                value={formData.trainer_name}
                onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Trainer Organization
              </label>
              <input
                type="text"
                placeholder="e.g. TalentSprint / AWS Academy"
                value={formData.trainer_organization}
                onChange={(e) => setFormData({ ...formData, trainer_organization: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Default Venue / Classroom
              </label>
              <input
                type="text"
                placeholder="e.g. Auditorium / Lab 3"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key objectives, syllabus outline, or attendance instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {saving ? "Saving..." : editingTraining ? "Update Training" : "Create Training"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
