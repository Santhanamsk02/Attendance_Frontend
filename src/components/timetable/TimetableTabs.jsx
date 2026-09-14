import { Calendar, CalendarCheck } from "lucide-react";

export default function TimetableTabs({ activeTab, onChange }) {
    const tabs = [
        { id: "weekly", label: "Weekly Timetable", icon: Calendar },
        { id: "overrides", label: "Date Overrides", icon: CalendarCheck },
    ];

    return (
        <div className="flex justify-center mb-10">
            <div className="neu-inset p-1 inline-flex bg-slate-100/50 rounded-2xl">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                ? "bg-white text-indigo-600 shadow-md ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-indigo-500" : "text-slate-400"}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
