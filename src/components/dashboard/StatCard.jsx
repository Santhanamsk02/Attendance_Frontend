import React from "react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "sky",
  isLoading = false,
}) {
  const colorMap = {
    sky: {
      well: "bg-sky-50 text-sky-600 border border-sky-100",
      pill: "bg-sky-50 text-sky-700 border border-sky-200/60",
    },
    violet: {
      well: "bg-indigo-50 text-indigo-600 border border-indigo-100",
      pill: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
    },
    blue: {
      well: "bg-blue-50 text-blue-600 border border-blue-100",
      pill: "bg-blue-50 text-blue-700 border border-blue-200/60",
    },
    emerald: {
      well: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      pill: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    },
    amber: {
      well: "bg-amber-50 text-amber-600 border border-amber-100",
      pill: "bg-amber-50 text-amber-700 border border-amber-200/60",
    },
  };

  const scheme = colorMap[color] || colorMap.sky;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${scheme.well}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3.5">
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
        ) : (
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            {value ?? "0"}
          </div>
        )}

        {subtitle && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            {trend && (
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${scheme.pill}`}>
                {trend}
              </span>
            )}
            <span className="truncate">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
