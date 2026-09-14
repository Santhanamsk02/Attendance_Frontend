import { apiClient } from "./api";

const BASE = "/reports";

export const reportsService = {
  // Dashboard
  getDashboard: () => apiClient.get(`${BASE}/dashboard`),

  // Filter metadata
  getFilterMeta: () => apiClient.get(`${BASE}/meta/filters`),

  // Daily register
  getDailyRegister: (params) => apiClient.get(`${BASE}/daily`, { params }),
  exportDailyRegister: (params) =>
    apiClient.get(`${BASE}/daily/export`, {
      params,
      responseType: "blob",
    }),

  // Student profile
  getStudentReport: (studentId, params) =>
    apiClient.get(`${BASE}/student/${studentId}`, { params }),
  getStudentDayAnalysis: (studentId, date) =>
    apiClient.get(`${BASE}/student/${studentId}/day-analysis`, { params: { date } }),

  // Trends
  getTrends: (params) => apiClient.get(`${BASE}/trends`, { params }),
  getSummary: (params) => apiClient.get(`${BASE}/summary`, { params }),

  // Defaulters
  getDefaulters: (params) => apiClient.get(`${BASE}/defaulters`, { params }),
  exportDefaulters: (params) =>
    apiClient.get(`${BASE}/defaulters/export`, { params, responseType: "blob" }),

  // Data health
  getDataHealth: () => apiClient.get(`${BASE}/data-health`),
};

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
