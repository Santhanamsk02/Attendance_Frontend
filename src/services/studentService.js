import { apiClient } from "./api";

export const studentService = {
  /**
   * Fetches paginated students list with search and filters.
   */
  async getStudents(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });
    const response = await apiClient.get("/students", { params: cleanParams });
    return response.data;
  },

  /**
   * Fetches a single student by UUID.
   */
  async getStudent(id) {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  /**
   * Creates a new student.
   */
  async createStudent(studentData) {
    const response = await apiClient.post("/students", studentData);
    return response.data;
  },

  /**
   * Updates an existing student.
   */
  async updateStudent(id, studentData) {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return response.data;
  },

  /**
   * Deletes a student by UUID.
   */
  async deleteStudent(id) {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  },

  /**
   * Retrieves dashboard statistics.
   */
  async getStats() {
    const response = await apiClient.get("/students/stats");
    return response.data;
  },

  /**
   * Uploads CSV or XLSX file for bulk student import.
   */
  async importStudents(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/students/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Deletes multiple students in a single request.
   */
  async bulkDeleteStudents(studentIds) {
    const response = await apiClient.post("/students/bulk-delete", {
      student_ids: studentIds,
    });
    return response.data;
  },

  /**
   * Downloads sample import CSV template.
   */
  async downloadTemplate() {
    const response = await apiClient.get("/students/import-template", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

