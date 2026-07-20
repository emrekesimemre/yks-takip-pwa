"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { masterCurriculum, type Curriculum } from "@/data/subjects";
import type { CourseSolvedQuestions, TopicProgress } from "@/store/useStudentStore";
import { getCourseKey, getCourseProgress, getCourseSolvedCount, getCourseGeneralSolvedCount, getTopicSolvedCount } from "@/utils/curriculum";
import CourseSolvedQuestionsInput from "@/components/CourseSolvedQuestionsInput";
import { FiCheck } from "react-icons/fi";

type Props = {
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
  onToggleCompletion: (topicId: string, isCompleted: boolean) => void;
  onUpdateSolvedQuestions: (
    exam: keyof Curriculum,
    course: string,
    count: number,
  ) => void;
  onUpdateTopicSolvedQuestions: (topicId: string, count: number) => void;
};

export default function GeneralProgressTab({
  topics,
  solvedQuestionsByCourse,
  solvedQuestionsByTopic,
  onToggleCompletion,
  onUpdateSolvedQuestions,
  onUpdateTopicSolvedQuestions,
}: Props) {
  const [activeExam, setActiveExam] = useState<keyof Curriculum>("TYT");

  const getTopicProgress = (topicId: string) =>
    topics.find((t) => t.id === topicId)?.isCompleted ?? false;

  const activeCurriculum = masterCurriculum[activeExam];

  return (
    <div>
      <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-6">
        {(["TYT", "AYT"] as const).map((exam) => (
          <button
            key={exam}
            onClick={() => setActiveExam(exam)}
            className={`relative px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeExam === exam
                ? "text-blue-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeExam === exam && (
              <motion.div
                layoutId="examTab"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{exam} Konuları</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(activeCurriculum).map(([courseName, courseTopics], idx) => {
          const progress = getCourseProgress(activeExam, courseName, topics);
          const solvedCount = getCourseSolvedCount(
            solvedQuestionsByCourse,
            activeExam,
            courseName,
            solvedQuestionsByTopic,
          );
          const generalSolved = getCourseGeneralSolvedCount(
            solvedQuestionsByCourse,
            activeExam,
            courseName,
          );

          return (
            <motion.div
              key={getCourseKey(activeExam, courseName)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-blue-100 hover:bg-white transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-base text-slate-800">
                    {courseName}
                  </h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                <div className="progress-bar mb-1">
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  %{progress.percentage} tamamlandı
                </p>
                <CourseSolvedQuestionsInput
                  label="Toplam çözülen soru"
                  value={solvedCount}
                  onChange={() => {}}
                  disabled
                />
              </div>

              <div className="space-y-1 mt-4 max-h-64 overflow-y-auto pr-1">
                {courseTopics.map((topic) => {
                  const isCompleted = getTopicProgress(topic.id);
                  const topicSolved = getTopicSolvedCount(
                    solvedQuestionsByTopic,
                    topic.id,
                  );
                  return (
                    <div
                      key={topic.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                        isCompleted
                          ? "bg-green-50/60 border border-green-100"
                          : "hover:bg-white border border-transparent hover:border-slate-100"
                      }`}
                    >
                      <label className="relative mt-0.5 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() =>
                            onToggleCompletion(topic.id, !isCompleted)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            isCompleted
                              ? "bg-green-500 border-green-500"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isCompleted && (
                            <FiCheck className="text-white text-[10px]" />
                          )}
                        </div>
                      </label>
                      <span
                        className={`flex-1 min-w-0 text-sm leading-snug ${
                          isCompleted
                            ? "line-through text-slate-400"
                            : "text-slate-700"
                        }`}
                      >
                        {topic.title}
                      </span>
                      <CourseSolvedQuestionsInput
                        compact
                        label="Çözülen soru"
                        value={topicSolved}
                        onChange={(count) =>
                          onUpdateTopicSolvedQuestions(topic.id, count)
                        }
                      />
                    </div>
                  );
                })}
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-100/80 border border-slate-200 mt-2">
                  <span className="flex-1 min-w-0 text-sm font-medium text-slate-600">
                    Genel
                  </span>
                  <CourseSolvedQuestionsInput
                    compact
                    label="Genel çözülen soru"
                    value={generalSolved}
                    onChange={(count) =>
                      onUpdateSolvedQuestions(activeExam, courseName, count)
                    }
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
