import React from "react";
import { DEPARTMENTS } from "../../utils/constants";

export default function TimetableHeader({ context }) {
    const deptLabel =
        DEPARTMENTS.find((d) => d.value === context.department)?.label ||
        context.department;

    return (
        <div className="text-center mb-8 select-none">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Panimalar Engineering College
            </p>
            <p className="text-[16px] font-black text-slate-700 uppercase tracking-wider">
                Department of {deptLabel}
            </p>
            <p className="text-[13px] font-semibold text-slate-500 mt-2">
                Semester {context.semester} &nbsp;|&nbsp; {context.academic_year} &nbsp;|&nbsp; Section {context.section}
            </p>
        </div>
    );
}
