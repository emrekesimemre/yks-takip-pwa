"use client";

import { motion } from "framer-motion";
import type {
  CourseSolvedQuestions,
  TopicProgress,
} from "@/store/useStudentStore";
import {
  getCourseSolvedCount,
  getIncompleteTopics,
  getTopicMeta,
} from "@/utils/curriculum";
import { getPacingWarnings } from "@/utils/pacing";
import PacingAlert from "@/components/PacingAlert";
import CourseSolvedQuestionsInput from "@/components/CourseSolvedQuestionsInput";
import { FiPrinter, FiCheckCircle } from "react-icons/fi";

type Props = {
  topics: TopicProgress[];
  weeklySelectedTopics: string[];
  weeklySolvedQuestionsByCourse: CourseSolvedQuestions;
  onToggleWeeklySelection: (topicId: string, selected: boolean) => void;
  onUpdateWeeklySolvedQuestions: (
    exam: "TYT" | "AYT",
    course: string,
    count: number,
  ) => void;
  onPrint: () => void;
};

export default function WeeklyPlanTab({
  topics,
  weeklySelectedTopics,
  weeklySolvedQuestionsByCourse,
  onToggleWeeklySelection,
  onUpdateWeeklySolvedQuestions,
  onPrint,
}: Props) {
  const incompleteTopics = getIncompleteTopics(topics);
  const warnings = getPacingWarnings(topics, weeklySelectedTopics);

  const grouped = incompleteTopics.reduce<
    Record<string, typeof incompleteTopics>
  >((acc, topic) => {
    const key = `${topic.exam} - ${topic.course}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(topic);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bu Haftanın Planı
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sadece bitmemiş konulardan seçim yapın. Seçilen konular haftalık
            programa eklenir.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPrint}
          disabled={weeklySelectedTopics.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
        >
          <FiPrinter />
          PDF / Yazdır
        </motion.button>
      </div>

      <PacingAlert warnings={warnings} />

      {incompleteTopics.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
            <FiCheckCircle className="text-3xl text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-800">
            Tüm konular tamamlanmış!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Harika bir ilerleme kaydettiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(grouped).map(([group, groupTopics]) => {
            const { exam, course } = groupTopics[0];
            const weeklySolved = getCourseSolvedCount(
              weeklySolvedQuestionsByCourse,
              exam,
              course,
            );

            return (
              <div
                key={group}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="border-b border-slate-100 pb-3 mb-3">
                  <h3 className="font-bold text-base text-slate-800">
                    {group}
                  </h3>
                  <CourseSolvedQuestionsInput
                    label="Bu hafta çözülecek soru sayısı"
                    value={weeklySolved}
                    onChange={(count) =>
                      onUpdateWeeklySolvedQuestions(exam, course, count)
                    }
                  />
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {groupTopics.map((topic) => {
                    const isSelected = weeklySelectedTopics.includes(topic.id);
                    return (
                      <label
                        key={topic.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50 ring-1 ring-blue-200 border border-blue-100"
                            : "hover:bg-white border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            onToggleWeeklySelection(topic.id, !isSelected)
                          }
                          className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 leading-snug">
                          {topic.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {weeklySelectedTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-100 pt-5"
        >
          <h3 className="text-sm font-bold text-slate-700 mb-3">
            Seçilen Konular
            <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {weeklySelectedTopics.length}
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {weeklySelectedTopics.map((id) => {
              const meta = getTopicMeta(id);
              if (!meta) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 text-xs font-medium rounded-full border border-blue-100"
                >
                  {meta.exam} {meta.course}: {meta.title}
                  <button
                    onClick={() => onToggleWeeklySelection(id, false)}
                    className="ml-0.5 w-4 h-4 flex items-center justify-center text-blue-500 hover:text-blue-900 hover:bg-blue-100 rounded-full transition-colors"
                    aria-label="Kaldır"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
