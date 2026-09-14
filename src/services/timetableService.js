// timetableService.js — API stub + localStorage draft persistence
// Backend timetable endpoints are not yet implemented.
// For Day 4, drafts are saved locally. Methods are ready for future API wiring.

import { apiClient } from "./api";

// ── Overrides Draft Keys (Still Local) ──────────────
const getOverridesDraftKey = (context) => {
    if (!context || !context.section) return "timetable_overrides_draft";
    return `timetable_overrides_${context.department}_${context.semester}_${context.section}`;
};

export const timetableService = {
    // ── Database Timetable ──────────────────

    async saveDraft(context, timetableData) {
        try {
            await apiClient.post("/timetable/", {
                department: context.department,
                academic_year: context.academic_year,
                semester: Number(context.semester),
                section_name: context.section,
                grid_data: timetableData
            });
        } catch (e) {
            console.error("Failed to save timetable to API.", e.response?.data || e);
            throw e;
        }
    },

    async loadDraft(context) {
        try {
            const { department, academic_year, semester, section } = context;
            const res = await apiClient.get("/timetable/", {
                params: {
                    department,
                    academic_year,
                    semester: Number(semester),
                    section_name: section
                }
            });
            if (res.data.exists && res.data.grid_data) {
                return res.data.grid_data;
            }
            return null;
        } catch (e) {
            console.error("Failed to load timetable from API.", e);
            return null;
        }
    },

    clearDraft(context) {
        // No-op for API right now (we actually wouldn't clear unless deleting)
    },

    // ── Overrides Draft persistence ────────────────────────
    saveOverridesDraft: (context, data) => {
        try {
            localStorage.setItem(getOverridesDraftKey(context), JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save overrides draft", error);
        }
    },
    loadOverridesDraft: (context) => {
        try {
            const data = localStorage.getItem(getOverridesDraftKey(context));
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error("Failed to load overrides draft", error);
            return null;
        }
    },
    clearOverridesDraft: (context) => {
        try {
            localStorage.removeItem(getOverridesDraftKey(context));
        } catch (error) {
            console.error("Failed to clear overrides draft", error);
        }
    },

    // ── Backend API methods ────────────────────────
    async getSectionsStatus(context) {
        try {
            const { department, academic_year, semester } = context;
            const res = await apiClient.get("/timetable/sections-status", {
                params: { department, academic_year, semester: Number(semester) }
            });
            return res.data.configured_sections || [];
        } catch (e) {
            console.error("Failed to fetch sections status", e);
            return [];
        }
    },

    // ── Future API methods (stubs) ────────────────────────

    // async getTimetable(context) {
    //   const { department, academic_year, semester, section } = context;
    //   const res = await apiClient.get("/timetables", { params: { department, academic_year, semester, section } });
    //   return res.data;
    // },

    // async saveTimetable(data) {
    //   const res = await apiClient.post("/timetables", data);
    //   return res.data;
    // },

    // async updateTimetable(id, data) {
    //   const res = await apiClient.put(`/timetables/${id}`, data);
    //   return res.data;
    // },

    // async deleteTimetable(id) {
    //   const res = await apiClient.delete(`/timetables/${id}`);
    //   return res.data;
    // },
};
