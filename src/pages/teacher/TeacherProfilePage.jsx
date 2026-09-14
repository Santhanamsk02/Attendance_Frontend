import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Building2, Briefcase, BadgeCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../services/api";

export default function TeacherProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get("/teacher/profile");
                setProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Loading profile data...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="neu-card p-6 rounded-3xl relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-emerald-200/50 flex-shrink-0">
                        {profile?.name?.substring(0, 2).toUpperCase() || "FA"}
                    </div>

                    <div className="flex-1 text-center md:text-left mt-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">{profile?.name}</h1>
                            {profile?.status === "active" && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 self-center md:self-auto">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Active Account
                                </span>
                            )}
                        </div>
                        <p className="text-sm md:text-base font-semibold text-emerald-600 mt-2">{profile?.designation}</p>
                        <p className="text-sm font-medium text-slate-500">{profile?.department}</p>
                    </div>
                </div>
            </div>

            <div className="neu-card p-6 rounded-3xl bg-white">
                <h2 className="text-lg font-black text-slate-800 mb-6">Contact & Identification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Employee ID</p>
                            <p className="text-sm md:text-base font-semibold text-slate-700">{profile?.employee_id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Email Address</p>
                            <p className="text-sm md:text-base font-semibold text-slate-700">{profile?.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Phone Number</p>
                            <p className="text-sm md:text-base font-semibold text-slate-700">{profile?.phone}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Core Department</p>
                            <p className="text-sm md:text-base font-semibold text-slate-700">{profile?.department}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-8">
                <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Profile information is managed by the College Administration.
                </p>
            </div>
        </div>
    );
}
