import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TeacherHeader from "../components/teacher/TeacherHeader";
import TeacherSidebar from "../components/teacher/TeacherSidebar";

export default function TeacherLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
            <TeacherSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onCollapsedChange={setSidebarCollapsed}
            />
            {/* Main Content — shifts based on sidebar collapsed state */}
            <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300
                ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}
            >
                <TeacherHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
                    <div className="w-full h-full animate-fade-in relative z-10 text-slate-700">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
