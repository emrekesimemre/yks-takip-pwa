"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { CourseSolvedQuestions, TopicProgress } from "@/store/useStudentStore";
import DevelopmentReportView from "@/components/DevelopmentReportView";
import { FiPrinter, FiX } from "react-icons/fi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  target?: string;
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
};

export default function DevelopmentReportModal({
  isOpen,
  onClose,
  studentName,
  target,
  topics,
  solvedQuestionsByCourse,
  solvedQuestionsByTopic,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 print:p-0 print:static print:overflow-visible print:block">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden cursor-pointer"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl my-4 sm:my-8 bg-white rounded-2xl shadow-2xl overflow-hidden print:my-0 print:shadow-none print:max-w-none print:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="development-report-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
          <h2
            id="development-report-title"
            className="text-lg font-bold text-slate-900"
          >
            Gelişim Raporu (Veli Raporu)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <FiPrinter />
              Yazdır / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Kapat"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        <DevelopmentReportView
          studentName={studentName}
          target={target}
          topics={topics}
          solvedQuestionsByCourse={solvedQuestionsByCourse}
          solvedQuestionsByTopic={solvedQuestionsByTopic}
        />
      </motion.div>
    </div>
  );
}
