import { apiClient } from "./api";

const BASE_PATH = "/admin/attendance/dashboard";

const cleanFilters = (filters) => {
    if (!filters) return {};
    const cleaned = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value !== "" && value !== null && value !== undefined) {
            cleaned[key] = value;
        }
    }
    return cleaned;
};

export const getOverview = async (filters) => {
    const res = await apiClient.get(`${BASE_PATH}/overview`, { params: cleanFilters(filters) });
    return res.data;
};

export const getSessions = async (filters, page = 1, pageSize = 20) => {
    const res = await apiClient.get(`${BASE_PATH}/sessions`, { params: { ...cleanFilters(filters), page, page_size: pageSize } });
    return res.data;
};

export const getAlerts = async (filters, threshold = 75, page = 1, pageSize = 20) => {
    const res = await apiClient.get(`${BASE_PATH}/alerts`, { params: { ...cleanFilters(filters), threshold, page, page_size: pageSize } });
    return res.data;
};

export const getSubjects = async (filters) => {
    const res = await apiClient.get(`${BASE_PATH}/subjects`, { params: cleanFilters(filters) });
    return res.data;
};

export const getDepartmentsReport = async (filters) => {
    const res = await apiClient.get(`${BASE_PATH}/departments`, { params: cleanFilters(filters) });
    return res.data;
};

export const getSectionsReport = async (filters) => {
    const res = await apiClient.get(`${BASE_PATH}/sections`, { params: cleanFilters(filters) });
    return res.data;
};

export const getTeachersReport = async (filters) => {
    const res = await apiClient.get(`${BASE_PATH}/teachers`, { params: cleanFilters(filters) });
    return res.data;
};

export const getDetailedReport = async (filters) => {
    const res = await apiClient.get(`${BASE_PATH}/report/detailed`, { params: cleanFilters(filters) });
    return res.data;
};
