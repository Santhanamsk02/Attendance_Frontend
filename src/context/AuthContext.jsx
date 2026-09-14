import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("auth_user");
        return stored ? JSON.parse(stored) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
    const [role, setRole] = useState(() => localStorage.getItem("auth_role"));
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Here we could validate the token with the backend if we had a /me endpoint
        setIsChecking(false);
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_role", data.role);
        localStorage.setItem("auth_user", JSON.stringify(data.user_info));

        setToken(data.token);
        setRole(data.role);
        setUser(data.user_info);
        return data;
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
        localStorage.removeItem("auth_user");

        setToken(null);
        setRole(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout, isChecking, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
