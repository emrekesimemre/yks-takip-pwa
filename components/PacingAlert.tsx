import { formatExamCourseLabel } from "@/utils/curriculum";
import {
  formatPacingTargetLabel,
  type PacingWarning,
} from "@/utils/pacing";
import { FiAlertTriangle } from "react-icons/fi";

export default function PacingAlert({ warnings }: { warnings: PacingWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w) => {
        const targetLabel = formatPacingTargetLabel(w.targetDate);
        const courseLabel = formatExamCourseLabel(w.exam, w.course);

        return (
          <div
            key={`${w.exam}-${w.course}`}
            className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 text-amber-900"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <FiAlertTriangle className="text-amber-600" />
            </div>
            <p className="text-sm leading-relaxed">
              <span className="font-bold">{targetLabel}</span> hedefine yetişmek
              için bu hafta{" "}
              <span className="font-bold">{courseLabel}</span> dersinden{" "}
              <span className="font-bold">{w.deficit} konu daha</span> seçmeniz
              önerilir. (Kalan: {w.incompleteCount}, bu hafta hedefi:{" "}
              {w.weeklyTarget}, seçilen: {w.selectedThisWeek}, kalan hafta:{" "}
              {w.weeksRemaining})
            </p>
          </div>
        );
      })}
    </div>
  );
}
