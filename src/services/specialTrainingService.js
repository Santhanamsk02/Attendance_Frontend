import { apiClient } from "./api";

const specialTrainingService = {
  // Trainings CRUD
  getAll: async () => {
    const res = await apiClient.get("/special-trainings");
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/special-trainings/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiClient.post("/special-trainings", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/special-trainings/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/special-trainings/${id}`);
    return res.data;
  },

  // Multi-department student enrollment
  getStudents: async (trainingId, params = {}) => {
    const query = new URLSearchParams();
    if (params.department_id) query.append("department_id", params.department_id);
    if (params.section) query.append("section", params.section);
    if (params.search) query.append("search", params.search);
    if (params.all_batches) query.append("all_batches", "true");

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get(`/special-trainings/${trainingId}/students${qs}`);
    return res.data;
  },

  enrollStudents: async (trainingId, studentIds) => {
    const res = await apiClient.post(`/special-trainings/${trainingId}/enroll`, {
      student_ids: studentIds,
    });
    return res.data;
  },

  unenrollStudents: async (trainingId, studentIds) => {
    const res = await apiClient.post(`/special-trainings/${trainingId}/unenroll`, {
      student_ids: studentIds,
    });
    return res.data;
  },

  // Training Subjects CRUD
  getSubjects: async (trainingId) => {
    const res = await apiClient.get(`/special-trainings/${trainingId}/subjects`);
    return res.data;
  },

  createSubject: async (trainingId, data) => {
    const res = await apiClient.post(`/special-trainings/${trainingId}/subjects`, data);
    return res.data;
  },

  updateSubject: async (trainingId, subjectId, data) => {
    const res = await apiClient.put(`/special-trainings/${trainingId}/subjects/${subjectId}`, data);
    return res.data;
  },

  deleteSubject: async (trainingId, subjectId) => {
    const res = await apiClient.delete(`/special-trainings/${trainingId}/subjects/${subjectId}`);
    return res.data;
  },

  // Timetable & Multi-Staff
  getTimetable: async (trainingId) => {
    const res = await apiClient.get(`/special-trainings/${trainingId}/timetable`);
    return res.data;
  },

  saveTimetableSlot: async (trainingId, data) => {
    const res = await apiClient.post(`/special-trainings/${trainingId}/timetable`, data);
    return res.data;
  },

  deleteTimetableSlot: async (trainingId, slotId) => {
    const res = await apiClient.delete(`/special-trainings/${trainingId}/timetable/${slotId}`);
    return res.data;
  },

  // Timeline structure
  getTimelineStructure: async (trainingId) => {
    const res = await apiClient.get(`/special-trainings/${trainingId}/timeline-structure`);
    return res.data;
  },

  saveTimelineStructure: async (trainingId, data) => {
    const res = await apiClient.put(`/special-trainings/${trainingId}/timeline-structure`, data);
    return res.data;
  },

  // Teacher portal & attendance taking
  getTeacherTodayTrainings: async (teacherId = null) => {
    const query = teacherId ? `?teacher_id=${teacherId}` : "";
    const res = await apiClient.get(`/special-trainings/teacher/today${query}`);
    return res.data;
  },

  startOrGetSession: async (data) => {
    const res = await apiClient.post("/special-trainings/sessions/start-or-get", data);
    return res.data;
  },

  getSessionDetails: async (sessionId) => {
    const res = await apiClient.get(`/special-trainings/sessions/${sessionId}`);
    return res.data;
  },

  markStudent: async (sessionId, data) => {
    const res = await apiClient.post(`/special-trainings/sessions/${sessionId}/mark`, data);
    return res.data;
  },

  submitSession: async (sessionId, data) => {
    const res = await apiClient.post(`/special-trainings/sessions/${sessionId}/submit`, data);
    return res.data;
  },

  // Reports
  getDailyReport: async (trainingId, params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append("date", params.date);
    if (params.department_id) query.append("department_id", params.department_id);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get(`/special-trainings/${trainingId}/reports/daily${qs}`);
    return res.data;
  },

  getStudentWiseReport: async (trainingId, params = {}) => {
    const query = new URLSearchParams();
    if (params.department_id) query.append("department_id", params.department_id);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get(`/special-trainings/${trainingId}/reports/student-wise${qs}`);
    return res.data;
  },

  getAbsenteesReport: async (trainingId, params = {}) => {
    const query = new URLSearchParams();
    if (params.min_absent_days !== undefined && params.min_absent_days !== null) {
      query.append("min_absent_days", params.min_absent_days);
    }
    if (params.max_percentage !== undefined && params.max_percentage !== null) {
      query.append("max_percentage", params.max_percentage);
    }
    if (params.department_id) query.append("department_id", params.department_id);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get(`/special-trainings/${trainingId}/reports/absentees${qs}`);
    return res.data;
  },
};

export default specialTrainingService;
