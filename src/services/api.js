import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "An unexpected error occurred. Please try again.";
    if (error.response) {
      const data = error.response.data;
      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.errors)) {
        message = data.errors.join(", ");
      } else if (Array.isArray(data?.detail)) {
        message = data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else if (data?.message) {
        message = data.message;
      }
    } else if (error.request) {
      message = "Unable to connect to the backend server. Please verify the API is running.";
    } else {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);
