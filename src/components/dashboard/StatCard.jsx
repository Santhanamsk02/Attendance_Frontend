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
      well: "bg-sky-50 text-sky-600 border-sky-100",
      pill: "bg-sky-100/80 text-sky-800",
    },
    violet: {
      well: "bg-violet-50 text-violet-600 border-violet-100",
      pill: "bg-violet-100/80 text-violet-800",
    },
    blue: {
      well: "bg-blue-50 text-blue-600 border-blue-100",
      pill: "bg-blue-100/80 text-blue-800",
    },
    emerald: {
      well: "bg-emerald-50 text-emerald-600 border-emerald-100",
      pill: "bg-emerald-100/80 text-emerald-800",
    },
    amber: {
      well: "bg-amber-50 text-amber-600 border-amber-100",
      pill: "bg-amber-100/80 text-amber-800",
    },
  };

  const scheme = colorMap[color] || colorMap.sky;

  return (
    <div className="rounded-3xl neu-card p-6 hover:translate-y-[-2px] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl neu-icon-well ${scheme.well}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl"></div>
        ) : (
          <div className="text-3xl font-black tracking-tight text-slate-800">
            {value ?? "0"}
          </div>
        )}

        {subtitle && (
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
            {trend && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${scheme.pill}`}>
                {trend}
              </span>
            )}
            <span>{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
