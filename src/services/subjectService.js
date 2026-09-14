import { apiClient } from "./api";

export const subjectService = {
    async getSubjects(params = {}) {
        const cleanParams = {};
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
                cleanParams[key] = params[key];
            }
        });
        const response = await apiClient.get("/subjects", { params: cleanParams });
        return response.data;
    },

    async getSubject(id) {
        const response = await apiClient.get(`/subjects/${id}`);
        return response.data;
    },

    async createSubject(data) {
        const response = await apiClient.post("/subjects", data);
        return response.data;
    },

    async updateSubject(id, data) {
        const response = await apiClient.put(`/subjects/${id}`, data);
        return response.data;
    },

    async deleteSubject(id) {
        const response = await apiClient.delete(`/subjects/${id}`);
        return response.data;
    },

    async getStats() {
        const response = await apiClient.get("/subjects/stats");
        return response.data;
    },

    async importSubjects(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post("/subjects/import", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    async bulkDelete(subjectIds) {
        const response = await apiClient.post("/subjects/bulk", {
            subject_ids: subjectIds,
        });
        return response.data;
    },

    async downloadTemplate() {
        const response = await apiClient.get("/subjects/import-template", {
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "subject_import_template.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};
