"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSoftTransition } from "@/components/ui/soft-motion";
import { toast } from "sonner";
import type {
  CourseSolvedQuestions,
  MockExam,
  TopicProgress,
} from "@/store/useStudentStore";
import DevelopmentReportView from "@/components/DevelopmentReportView";
import { FiMail, FiPrinter, FiX } from "react-icons/fi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName: string;
  target?: string;
  parentEmail?: string;
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
  mockExams?: MockExam[];
  onParentEmailSaved?: (parentEmail: string) => void;
};

export default function DevelopmentReportModal(props: Readonly<Props>) {
  const { isOpen, onClose } = props;

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

  return (
    <AnimatePresence>
      {isOpen ? <DevelopmentReportBody key="development-report" {...props} /> : null}
    </AnimatePresence>
  );
}

function DevelopmentReportBody({
  onClose,
  studentId,
  studentName,
  target,
  parentEmail = "",
  topics,
  solvedQuestionsByCourse,
  solvedQuestionsByTopic,
  mockExams = [],
  onParentEmailSaved,
}: Readonly<Props>) {
  const transition = useSoftTransition();
  const [emailInput, setEmailInput] = useState(parentEmail);
  const [isSending, setIsSending] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    if (!studentId) return;
    const trimmed = emailInput.trim();
    if (!trimmed) {
      toast.error("Veli e-postası girin.");
      return;
    }

    setIsSending(true);
    try {
      if (trimmed.toLowerCase() !== parentEmail.trim().toLowerCase()) {
        const patchRes = await fetch(`/api/students/${studentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentEmail: trimmed }),
        });
        const patchBody = await patchRes.json();
        if (!patchRes.ok) {
          throw new Error(patchBody.error || "Veli e-postası kaydedilemedi.");
        }
        onParentEmailSaved?.(patchBody.parentEmail ?? trimmed.toLowerCase());
      }

      const res = await fetch(`/api/students/${studentId}/report-email`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Mail gönderilemedi.");
      }
      toast.success("Gelişim raporu veliye gönderildi.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mail gönderilemedi.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 print:p-0 print:static print:overflow-visible print:block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden cursor-pointer"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={transition}
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

        {studentId ? (
          <div className="flex flex-col sm:flex-row gap-2 px-6 py-3 border-b border-slate-100 print:hidden">
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Veli e-postası"
              className="input-premium flex-1"
              aria-label="Veli e-postası"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              <FiMail />
              {isSending ? "Gönderiliyor..." : "Veliye gönder"}
            </button>
          </div>
        ) : null}

        <DevelopmentReportView
          studentName={studentName}
          target={target}
          topics={topics}
          solvedQuestionsByCourse={solvedQuestionsByCourse}
          solvedQuestionsByTopic={solvedQuestionsByTopic}
          mockExams={mockExams}
        />
      </motion.div>
    </div>
  );
}
