import React from "react";
import { PROGRESS_STEPS } from "@/utils/constants";
import { CheckCircle2, Loader2 } from "lucide-react";
import { APP } from "@/constants/testIds";

export const ProgressBar = ({ step }) => {
  return (
    <div data-testid={APP.progressBar} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4 font-heading">Generating your content...</h3>
      <div className="space-y-3">
        {PROGRESS_STEPS.map((label, idx) => {
          const done = idx < step;
          const active = idx === step;
          return (
            <div key={label} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                done ? "bg-green-100 text-green-600" : active ? "bg-blue-100 text-[#0B3D91]" : "bg-slate-100 text-slate-400"
              }`}>
                {done ? <CheckCircle2 size={20} strokeWidth={2.5} /> :
                 active ? <Loader2 size={20} strokeWidth={2.5} className="animate-spin" /> :
                 <span className="text-sm font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-base ${active ? "text-slate-900 font-semibold" : done ? "text-slate-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
