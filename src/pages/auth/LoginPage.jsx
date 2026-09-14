import React, { useState, useEffect } from "react";
import { LogIn, Mail, Lock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated, role } = useAuth();
    const { success, error: showError } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            if (role === "admin") navigate("/dashboard");
            else navigate("/teacher/dashboard");
        }
    }, [isAuthenticated, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(email, password);
            success(`Successfully logged in as ${data.user_info.name}`);

            if (data.role === "admin") {
                navigate("/dashboard");
            } else {
                navigate("/teacher/verify");
            }
        } catch (err) {
            const msg = err.response?.data?.detail || "Login failed. Please verify your credentials.";
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 neu-card z-10 animate-fade-in mx-4">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl neu-raised text-indigo-600 mb-4">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Email <span className="font-normal opacity-70">(or employee logic)</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Mail className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                placeholder="name@pec.edu"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <LogIn className="w-4 h-4" />
                                )}
                                {loading ? "Signing in..." : "Sign In"}
                            </span>
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-[11px] font-semibold text-slate-400">
                            Teacher default password is your Employee ID
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
