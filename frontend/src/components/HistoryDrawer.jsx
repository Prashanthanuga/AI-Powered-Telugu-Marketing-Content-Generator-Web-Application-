import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Clock, Trash2, RotateCcw } from "lucide-react";
import { APP } from "@/constants/testIds";
import { TEMPLATES } from "@/utils/constants";

export const HistoryDrawer = ({ history, onSelect, onDelete, children }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <button
            data-testid={APP.historyBtn}
            className="h-12 px-4 bg-white border-2 border-slate-200 hover:border-[#0B3D91] rounded-xl flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors"
          >
            <Clock size={18} strokeWidth={2.5} /> History
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="right" data-testid={APP.historyDrawer} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Recent History</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {history.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Clock size={40} strokeWidth={2} className="mx-auto mb-3 opacity-40" />
              <p>No history yet.</p>
              <p className="text-sm">Generate some content to see it here.</p>
            </div>
          )}
          {history.map((item) => {
            const tpl = TEMPLATES.find(t => t.id === item.template) || TEMPLATES[0];
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#0B3D91] transition-colors">
                <div className={`h-14 w-full rounded ${tpl.className} mb-3 flex items-center justify-center text-white font-bold text-sm px-3 text-center`}>
                  {item.content?.poster_headline?.slice(0, 40) || item.offer.slice(0, 40)}
                </div>
                <div className="text-sm font-bold text-slate-900 line-clamp-2 font-telugu">{item.offer}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {item.category} · {item.tone} · {new Date(item.date).toLocaleDateString()}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onSelect(item)}
                    className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={14} strokeWidth={2.5} /> Restore
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
