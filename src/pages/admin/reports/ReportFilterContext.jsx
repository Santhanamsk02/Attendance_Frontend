import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { reportsService } from "../../../services/reportsService";

const ReportFilterContext = createContext(null);

export function ReportFilterProvider({ children }) {
  const [filters, setFilters] = useState({
    department_id: "",
    batch_id: "",
    section: "",
    semester: "",
    from_date: "",
    to_date: "",
  });
  const [meta, setMeta] = useState({ departments: [], sections: [], semesters: [], batches: [] });
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    setMetaLoading(true);
    reportsService.getFilterMeta()
      .then((r) => setMeta(r.data))
      .catch(() => {})
      .finally(() => setMetaLoading(false));
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ department_id: "", batch_id: "", section: "", semester: "", from_date: "", to_date: "" });
  }, []);

  return (
    <ReportFilterContext.Provider value={{ filters, updateFilter, resetFilters, meta, metaLoading }}>
      {children}
    </ReportFilterContext.Provider>
  );
}

export function useReportFilters() {
  const ctx = useContext(ReportFilterContext);
  if (!ctx) throw new Error("useReportFilters must be used within ReportFilterProvider");
  return ctx;
}
