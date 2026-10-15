import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Users,
  MapPin,
  Clock,
} from "lucide-react";
import { getSubjectPalette } from "../../utils/subjectColors";

function TrainingGridCell({
  item,
  dayValue,
  slot,
  onAssign,
  onEdit,
  onDrop,
  onDelete,
}) {
  const [dragOver, setDragOver] = useState(false);

  // Break cell
  if (item.type === "break") {
    return (
      <div
        className="tt-cell-break flex flex-col items-center justify-center text-center px-1.5 py-3 select-none rounded-xl bg-amber-50/80 border border-amber-200/80"
        style={{ minHeight: "88px" }}
      >
        <span className="text-[10px] font-black text-amber-700 uppercase leading-tight tracking-wider">
          {item.label}
        </span>
        <span className="text-[9px] font-semibold text-amber-600/80 mt-1">
          {item.start}–{item.end}
        </span>
      </div>
    );
  }

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    setDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const payload = JSON.parse(dataStr);
      if (payload && onDrop) {
        onDrop(dayValue, item, payload);
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  // Assigned slot cell
  if (slot) {
    const pal = getSubjectPalette(slot.topic || "Training");
    const staffCount = slot.assigned_staff?.length || slot.teacher_ids?.length || 0;

    return (
      <div
        className={`tt-cell-assigned group relative rounded-xl border p-2 cursor-pointer transition-all hover:shadow-md select-none flex flex-col justify-between
          ${dragOver ? "ring-2 ring-indigo-500 scale-[0.98] brightness-95" : ""}`}
        style={{
          minHeight: "88px",
          border: `1px solid ${pal.accent}`,
          background: dragOver
            ? "rgba(224,231,255,0.9)"
            : `linear-gradient(135deg, ${pal.cellBg} 0%, rgba(255,255,255,0.85) 100%)`,
        }}
        onClick={() => onEdit(dayValue, item, slot)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Click to edit · Drop another topic to replace"
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: pal.accent }}
        />

        {/* Top period & timing */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider ${pal.badge}`}
          >
            {slot.period_id}
          </span>
          <span className="text-[9px] font-semibold text-slate-500">
            {slot.start_time || item.start}–{slot.end_time || item.end}
          </span>
        </div>

        {/* Topic Title */}
        <div className={`text-[11px] font-black leading-tight truncate ${pal.text} my-0.5`}>
          {slot.topic}
        </div>

        {/* Trainer & Venue */}
        <div className="space-y-0.5 my-0.5">
          {slot.trainer_name && (
            <div className="text-[9px] font-semibold text-slate-600 flex items-center gap-1 truncate">
              <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="truncate">{slot.trainer_name}</span>
            </div>
          )}
          {slot.venue && (
            <div className="text-[9px] font-semibold text-slate-500 flex items-center gap-1 truncate">
              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="truncate">{slot.venue}</span>
            </div>
          )}
        </div>

        {/* Attendance staff chip */}
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50">
          <span className="px-1.5 py-0.2 rounded-md bg-white/80 border border-slate-200/70 text-[8px] font-black text-indigo-700 flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {staffCount} Staff
          </span>
          <span className="text-[8px] font-bold text-slate-400 group-hover:hidden">Edit</span>
        </div>

        {/* Hover overlay with Edit & Delete */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-[1px] rounded-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(dayValue, item, slot);
            }}
            className="p-1.5 bg-white text-indigo-600 hover:text-indigo-800 rounded-lg shadow-sm border border-slate-200 hover:scale-105 transition-transform"
            title="Edit Slot"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(slot.id);
            }}
            className="p-1.5 bg-white text-rose-500 hover:text-rose-700 rounded-lg shadow-sm border border-slate-200 hover:scale-105 transition-transform"
            title="Delete Slot"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Empty slot cell
  return (
    <div
      className={`tt-cell-empty group rounded-xl border border-dashed flex flex-col items-center justify-center p-2 cursor-pointer transition-all select-none
        ${
          dragOver
            ? "border-indigo-500 bg-indigo-50/90 ring-2 ring-indigo-400 scale-[0.98]"
            : "border-slate-200/90 bg-white/60 hover:bg-white hover:border-indigo-300 hover:shadow-xs"
        }`}
      style={{ minHeight: "88px" }}
      onClick={() => onAssign(dayValue, item)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title="Click to assign · Drop training module to schedule"
    >
      <Plus
        className={`w-4 h-4 transition-transform ${
          dragOver
            ? "text-indigo-600 scale-125"
            : "text-slate-300 group-hover:text-indigo-600 group-hover:scale-110"
        }`}
      />
      <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 mt-1">
        {dragOver ? "Drop Here" : "Assign"}
      </span>
    </div>
  );
}

export default function TrainingTimetableGrid({
  timeline = [],
  days = [],
  slots = [],
  onAssignSlot,
  onEditSlot,
  onDropSlot,
  onDeleteSlot,
}) {
  const getSlotForCell = (dayValue, item) => {
    if (item.type === "break") return null;
    const periodCode = `P${item.number}`;
    return (
      slots.find(
        (s) =>
          s.day_of_week?.toUpperCase() === dayValue?.toUpperCase() &&
          s.period_id?.toUpperCase() === periodCode
      ) || null
    );
  };

  return (
    <div
      className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-md overflow-hidden"
      style={{
        boxShadow: "0 4px 32px rgba(99,102,241,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="overflow-x-auto scrollbar-thin">
        <div
          className="p-2.5 bg-slate-50/60"
          style={{
            display: "grid",
            gridTemplateColumns: `84px repeat(${timeline.length}, minmax(110px, 1fr))`,
            minWidth: `${Math.max(820, 84 + timeline.length * 115)}px`,
            gap: "6px",
          }}
        >
          {/* Header Row: Corner Day Cell */}
          <div
            className="sticky left-0 z-20 flex items-center justify-center px-3 py-3 border border-slate-200/70 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Day
            </span>
          </div>

          {/* Timeline Period & Break Headers */}
          {timeline.map((item, idx) => (
            <div
              key={item.id}
              className={`flex flex-col items-center justify-center px-1.5 py-2.5 border rounded-xl text-center
                ${
                  item.type === "break"
                    ? "bg-amber-50/90 border-amber-200"
                    : "border-slate-200/70"
                }`}
              style={
                item.type !== "break"
                  ? {
                      background:
                        "linear-gradient(180deg, rgba(238,242,255,0.9) 0%, rgba(248,250,252,0.85) 100%)",
                    }
                  : {}
              }
            >
              {item.type === "break" ? (
                <>
                  <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-semibold text-amber-600 mt-0.5">
                    {item.start}–{item.end}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center mb-1 shadow-xs">
                    <span className="text-[9px] font-black text-white">
                      {item.number || idx + 1}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">
                    {item.label}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5 font-semibold">
                    {item.start}–{item.end}
                  </span>
                </>
              )}
            </div>
          ))}

          {/* Day Rows */}
          {days.map((dayObj) => {
            const dayValue = dayObj.value;

            return (
              <React.Fragment key={dayValue}>
                {/* Day column header on left */}
                <div
                  className="sticky left-0 z-10 flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200/70 bg-white shadow-2xs"
                  style={{ minHeight: "88px" }}
                >
                  <span className="text-xs font-black text-slate-800 tracking-tight">
                    {dayValue}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                    {dayObj.label.slice(0, 3)}
                  </span>
                </div>

                {/* Period cells */}
                {timeline.map((item) => {
                  const slot = getSlotForCell(dayValue, item);

                  return (
                    <TrainingGridCell
                      key={`${dayValue}-${item.id}`}
                      item={item}
                      dayValue={dayValue}
                      slot={slot}
                      onAssign={onAssignSlot}
                      onEdit={onEditSlot}
                      onDrop={onDropSlot}
                      onDelete={onDeleteSlot}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
