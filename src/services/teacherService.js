import { apiClient } from "./api";

export const teacherService = {
    /**
     * Fetches paginated teachers list with search and filters.
     */
    async getTeachers(params = {}) {
        const cleanParams = {};
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
                cleanParams[key] = params[key];
            }
        });
        const response = await apiClient.get("/teachers", { params: cleanParams });
        return response.data;
    },

    /**
     * Fetches a single teacher by UUID.
     */
    async getTeacher(id) {
        const response = await apiClient.get(`/teachers/${id}`);
        return response.data;
    },

    /**
     * Creates a new teacher.
     */
    async createTeacher(teacherData) {
        const response = await apiClient.post("/teachers", teacherData);
        return response.data;
    },

    /**
     * Updates an existing teacher.
     */
    async updateTeacher(id, teacherData) {
        const response = await apiClient.put(`/teachers/${id}`, teacherData);
        return response.data;
    },

    /**
     * Deletes a teacher by UUID.
     */
    async deleteTeacher(id) {
        const response = await apiClient.delete(`/teachers/${id}`);
        return response.data;
    },

    /**
     * Retrieves dashboard statistics.
     */
    async getStats() {
        const response = await apiClient.get("/teachers/stats");
        return response.data;
    },

    /**
     * Uploads CSV or XLSX file for bulk teacher import.
     */
    async importTeachers(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post("/teachers/import", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    /**
     * Deletes multiple teachers in a single request.
     */
    async bulkDelete(teacherIds) {
        const response = await apiClient.post("/teachers/bulk", {
            teacher_ids: teacherIds,
        });
        return response.data;
    },

    async bulkDeleteTeachers(teacherIds) {
        return this.bulkDelete(teacherIds);
    },

    /**
     * Deletes all teachers from the database.
     */
    async deleteAllTeachers() {
        const response = await apiClient.post("/teachers/delete-all");
        return response.data;
    },

    async deleteAll() {
        return this.deleteAllTeachers();
    },

    /**
     * Downloads sample import CSV template.
     */
    async downloadTemplate() {
        const response = await apiClient.get("/teachers/import-template", {
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "teacher_import_template.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};
