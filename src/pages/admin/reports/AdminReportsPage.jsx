import React from "react";
import { Outlet } from "react-router-dom";
import { ReportFilterProvider } from "./ReportFilterContext";

export default function AdminReportsPage() {
  return (
    <ReportFilterProvider>
      <div className="flex flex-col min-h-0 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Comprehensive analytics across sections, batches, and departments.
          </p>
        </div>

        {/* Tab Content replaced with Outlet */}
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
    </ReportFilterProvider>
  );
}
