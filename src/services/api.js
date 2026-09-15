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

let activeRequests = 0;

const showLoader = () => {
  activeRequests++;
  if (activeRequests === 1) {
    window.dispatchEvent(new Event("show_loader"));
  }
};

const hideLoader = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    window.dispatchEvent(new Event("hide_loader"));
  }
};

apiClient.interceptors.request.use((config) => {
  showLoader();
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  hideLoader();
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    hideLoader();
    return response;
  },
  (error) => {
    hideLoader();
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
