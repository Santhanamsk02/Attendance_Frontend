import React from "react";

export default function TableSkeleton({ rows = 6, cols = 8 }) {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-6 py-4">
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
          <div className="h-4 w-36 bg-slate-200 rounded"></div>
          <div className="h-4 w-44 bg-slate-100 rounded hidden md:block"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-4 w-12 bg-slate-100 rounded"></div>
          <div className="h-4 w-12 bg-slate-100 rounded hidden sm:block"></div>
          <div className="h-4 w-20 bg-slate-100 rounded hidden lg:block"></div>
          <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
          <div className="ml-auto flex gap-2">
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
