import { apiClient } from "./api";

export const authService = {
    async login(email, password) {
        const response = await apiClient.post("/auth/login", { email, password });
        return response.data;
    }
};
