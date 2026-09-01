"use client";

import { useState } from "react";
import { formatExamCourseLabel } from "@/utils/curriculum";
import {
  formatPacingTargetLabel,
  type PacingWarning,
} from "@/utils/pacing";
import { FiAlertTriangle, FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function PacingAlert({ warnings }: { warnings: PacingWarning[] }) {
  const [expanded, setExpanded] = useState(false);

  if (warnings.length === 0) return null;

  const SHOW_LIMIT = 2;
  const visible = expanded ? warnings : warnings.slice(0, SHOW_LIMIT);
  const hasMore = warnings.length > SHOW_LIMIT;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-100">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="text-amber-600 text-sm" />
        </div>
        <p className="text-sm font-semibold text-amber-900 flex-1">
          {warnings.length} ders için hız uyarısı
        </p>
      </div>
      <div className="divide-y divide-amber-100">
        {visible.map((w) => {
          const targetLabel = formatPacingTargetLabel(w.targetDate);
          const courseLabel = formatExamCourseLabel(w.exam, w.course);
          return (
            <div key={`${w.exam}-${w.course}`} className="px-4 py-2.5">
              <p className="text-sm text-amber-900 leading-relaxed">
                <span className="font-semibold">{courseLabel}:</span>{" "}
                {targetLabel} için{" "}
                <span className="font-bold">{w.deficit} konu daha</span> seçin.
                {" "}
                <span className="text-amber-700 text-xs">
                  (Seçilen {w.selectedThisWeek}/{w.weeklyTarget}, {w.weeksRemaining} hafta kaldı)
                </span>
              </p>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100/60 transition-colors"
        >
          {expanded ? (
            <>
              <FiChevronUp /> Daha az göster
            </>
          ) : (
            <>
              <FiChevronDown /> {warnings.length - SHOW_LIMIT} uyarı daha
            </>
          )}
        </button>
      )}
    </div>
  );
}
