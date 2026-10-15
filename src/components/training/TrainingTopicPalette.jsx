import React from "react";
import {
  BookOpen,
  User,
  MapPin,
  Users,
  Tag,
  AlertCircle,
} from "lucide-react";
import { getSubjectPalette } from "../../utils/subjectColors";

export default function TrainingTopicPalette({
  topics = [],
  training = {},
  staffPool = [],
}) {
  const handleDragStart = (e, topicItem) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        topic: topicItem.topic,
        trainer_name: topicItem.trainer_name || training?.trainer_name || "",
        venue: topicItem.venue || training?.venue || "",
        teacher_ids: staffPool || [],
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-64 xl:w-72 flex-shrink-0 flex flex-col gap-3 font-['Times_New_Roman',_Times,_serif]">
      <div className="rounded-3xl p-4 bg-white/90 border border-slate-200/80 shadow-xs flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Training Subjects · Drag to Grid
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
            {topics.length} {topics.length === 1 ? "Subject" : "Subjects"}
          </span>
        </div>

        {/* Instructions */}
        <p className="text-xs text-slate-500 font-normal mb-2.5 leading-snug">
          Drag any subject below and drop it onto a period slot on the timetable matrix.
        </p>

        {/* Empty State when no subjects in DB */}
        {topics.length === 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-amber-600" />
            <div className="text-xs font-bold text-amber-900">
              No Training Subjects
            </div>
            <p className="text-[11px] text-amber-800 font-normal">
              No subjects have been configured for this training yet. Use the <strong>Manage Subjects</strong> section on the Special Training dashboard to add subjects.
            </p>
          </div>
        ) : (
          /* Draggable Subject Cards from DB */
          <div className="overflow-y-auto space-y-2.5 max-h-[calc(80vh-210px)] pr-1">
            {topics.map((tItem) => {
              const pal = getSubjectPalette(tItem.topic || training?.name || "Training");

              return (
                <div
                  key={tItem.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tItem)}
                  title="Drag to place on grid"
                  className={`
                    group relative rounded-2xl border ${pal.light}
                    cursor-grab active:cursor-grabbing select-none
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]
                    active:scale-[0.98] active:shadow-xs active:opacity-85
                    overflow-hidden bg-white
                  `}
                >
                  {/* Left accent color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{
                      background: `linear-gradient(to bottom, ${pal.accent}, ${pal.accent}aa)`,
                    }}
                  />

                  <div className="pl-3.5 pr-2.5 py-2.5">
                    {/* Subject Title & Code */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="min-w-0">
                        <span className={`text-xs font-bold tracking-tight ${pal.text} line-clamp-2 block`}>
                          {tItem.topic}
                        </span>
                        {tItem.code && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mt-1">
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {tItem.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trainer & Venue */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px] font-normal text-slate-500">Trainer:</span>
                        <span className="truncate text-[11px] font-bold text-slate-800">
                          {tItem.trainer_name || training.trainer_name || "Trainer"}
                        </span>
                      </div>
                      {(tItem.venue || training.venue) && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate text-[11px] font-normal text-slate-500">Venue:</span>
                          <span className="truncate text-[11px] font-bold text-slate-800">
                            {tItem.venue || training.venue}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Drag indicator bar */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                      <span className="font-normal text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {staffPool.length} Staff Assigned
                      </span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/60">
                        Drag to slot
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
