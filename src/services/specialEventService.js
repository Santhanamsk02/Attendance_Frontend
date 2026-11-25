import { apiClient } from "./api";

export const specialEventService = {
    async getEvents(params = {}) {
        const res = await apiClient.get("/special-events", { params });
        return res.data;
    },

    async getEventById(id) {
        const res = await apiClient.get(`/special-events/${id}`);
        return res.data;
    },

    async createEvent(data) {
        const res = await apiClient.post("/special-events", data);
        return res.data;
    },

    async updateEvent(id, data) {
        const res = await apiClient.put(`/special-events/${id}`, data);
        return res.data;
    },

    async deleteEvent(id) {
        const res = await apiClient.delete(`/special-events/${id}`);
        return res.data;
    },

    async getEventStudents(id, params = {}) {
        const res = await apiClient.get(`/special-events/${id}/students`, { params });
        return res.data;
    },

    async addStudentsToEvent(id, studentIds) {
        const res = await apiClient.post(`/special-events/${id}/students`, studentIds);
        return res.data;
    },

    async removeStudentFromEvent(id, studentId) {
        const res = await apiClient.delete(`/special-events/${id}/students/${studentId}`);
        return res.data;
    },

    async getEventAttendance(id, date) {
        const res = await apiClient.get(`/special-events/${id}/attendance`, {
            params: { date }
        });
        return res.data;
    },

    async submitEventAttendance(id, payload) {
        const res = await apiClient.post(`/special-events/${id}/attendance`, payload);
        return res.data;
    },

    async getEventReports(id) {
        const res = await apiClient.get(`/special-events/${id}/reports`);
        return res.data;
    },

    async assignTeachersToEvent(id, teacherIds) {
        const res = await apiClient.post(`/special-events/${id}/teachers`, { teacher_ids: teacherIds });
        return res.data;
    },

    async getStudentEvents(studentId) {
        const res = await apiClient.get(`/special-events/student/${studentId}`);
        return res.data;
    },

    async getStudentAttendanceHistory(studentId) {
        const res = await apiClient.get(`/special-events/student/${studentId}/attendance`);
        return res.data;
    },

    async getTeacherAttendanceHistory() {
        const res = await apiClient.get("/special-events/teacher/my-attendance");
        return res.data;
    },

    async getClassEvents(params = {}) {
        const res = await apiClient.get("/special-events/class/events", { params });
        return res.data;
    },

    async getFilterOptions() {
        const res = await apiClient.get("/special-events/meta/filter-options");
        return res.data;
    }
};
