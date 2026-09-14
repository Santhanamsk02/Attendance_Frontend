import React, { useEffect, useState } from "react";
import { reportsService } from "../../../services/reportsService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, Trophy, AlertCircle, CalendarDays } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">
          {value !== null && value !== undefined ? `${value}%` : <span className="text-slate-300 text-lg">No data</span>}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const RANK_COLORS = ["#22c55e", "#84cc16", "#facc15", "#f97316", "#ef4444"];

export default function ReportDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    reportsService.getDashboard()
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
      <AlertCircle className="w-5 h-5" /> {error}
    </div>
  );

  const { summary, departments_today, leaderboard } = data;

  const leaderboardColor = (idx) => {
    const t = idx / Math.max(leaderboard.length - 1, 1);
    return t < 0.33 ? "#22c55e" : t < 0.66 ? "#facc15" : "#ef4444";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Attendance" value={summary.today_pct}
          icon={CalendarDays} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="This Week" value={summary.week_pct}
          icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="This Month" value={summary.month_pct}
          icon={Users} color="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown Today */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" /> Department Breakdown — Today
          </h2>
          {departments_today.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">No session data for today</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={departments_today} margin={{ left: -20 }}>
                <XAxis dataKey="department_name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {departments_today.map((_, i) => (
                    <Cell key={i} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Section Leaderboard */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Section Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">No leaderboard data yet</div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {leaderboard.map((item, i) => (
                <div key={item.section} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-slate-400">{item.rank_best_to_worst}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-slate-700">Section {item.section}</span>
                      <span className="text-xs font-semibold" style={{ color: leaderboardColor(i) }}>
                        {item.overall_pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.overall_pct}%`, backgroundColor: leaderboardColor(i) }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
