"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useStudentStore,
  type CourseSolvedQuestions,
  type TopicProgress,
  type MockExam,
} from "@/store/useStudentStore";
import Link from "next/link";
import GeneralProgressTab from "@/components/GeneralProgressTab";
import WeeklyPlanTab from "@/components/WeeklyPlanTab";
import WeeklyPlanPrintView from "@/components/WeeklyPlanPrintView";
import DevelopmentReportModal from "@/components/DevelopmentReportModal";
import MockExamTab from "@/components/MockExamTab";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import AddStudentModal from "@/components/AddStudentModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageTransition from "@/components/ui/PageTransition";
import { getOverallProgress, getCourseKey } from "@/utils/curriculum";
import { normalizeSolvedQuestions, normalizeTopics } from "@/utils/student";
import type { Curriculum } from "@/data/subjects";
import {
  FiArrowLeft,
  FiTrash2,
  FiEdit2,
  FiTrendingUp,
  FiBook,
  FiCalendar,
  FiBarChart2,
  FiFileText,
} from "react-icons/fi";

type MainTab = "progress" | "weekly" | "exams";

type PersistPayload = {
  topics?: TopicProgress[];
  weeklySelectedTopics?: string[];
  solvedQuestionsByCourse?: CourseSolvedQuestions;
  solvedQuestionsByTopic?: CourseSolvedQuestions;
  weeklySolvedQuestionsByCourse?: CourseSolvedQuestions;
  weeklySolvedQuestionsByTopic?: CourseSolvedQuestions;
  mockExams?: MockExam[];
};

const tabs: { id: MainTab; label: string; icon: typeof FiBook }[] = [
  { id: "progress", label: "Genel İlerleme", icon: FiBook },
  { id: "weekly", label: "Haftalık Plan", icon: FiCalendar },
  { id: "exams", label: "Deneme Analizi", icon: FiBarChart2 },
];

export default function StudentDetailClient({
  studentId,
}: {
  studentId: string;
}) {
  const {
    currentStudent,
    setCurrentStudent,
    updateCurrentStudent,
    setEditingStudent,
    removeStudent,
  } = useStudentStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>("progress");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDevelopmentReport, setShowDevelopmentReport] = useState(false);
  const [isPrintingWeekly, setIsPrintingWeekly] = useState(false);
  const saveVersionRef = useRef(0);

  useEffect(() => {
    const resetWeeklyPrint = () => setIsPrintingWeekly(false);
    window.addEventListener("afterprint", resetWeeklyPrint);
    return () => window.removeEventListener("afterprint", resetWeeklyPrint);
  }, []);

  useEffect(() => {
    const fetchStudentDetail = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentStudent({
            ...data,
            topics: normalizeTopics(data.topics),
            weeklySelectedTopics: data.weeklySelectedTopics ?? [],
            solvedQuestionsByCourse: normalizeSolvedQuestions(
              data.solvedQuestionsByCourse,
            ),
            solvedQuestionsByTopic: normalizeSolvedQuestions(
              data.solvedQuestionsByTopic,
            ),
            weeklySolvedQuestionsByCourse: normalizeSolvedQuestions(
              data.weeklySolvedQuestionsByCourse,
            ),
            weeklySolvedQuestionsByTopic: normalizeSolvedQuestions(
              data.weeklySolvedQuestionsByTopic,
            ),
            mockExams: data.mockExams ?? [],
          });
        }
      } catch (error) {
        console.error("Öğrenci detayı çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentDetail();
    return () => setCurrentStudent(null);
  }, [studentId, setCurrentStudent]);

  const persistUpdate = useCallback(
    async (updates: PersistPayload) => {
      const version = ++saveVersionRef.current;
      setIsSaving(true);
      try {
        const res = await fetch(`/api/students/${studentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok && version === saveVersionRef.current) {
          const data = await res.json();
          const merged: PersistPayload = {};

          if (updates.topics !== undefined) {
            merged.topics = normalizeTopics(data.topics ?? updates.topics);
          }
          if (updates.weeklySelectedTopics !== undefined) {
            merged.weeklySelectedTopics =
              data.weeklySelectedTopics ?? updates.weeklySelectedTopics;
          }
          if (updates.solvedQuestionsByCourse !== undefined) {
            merged.solvedQuestionsByCourse = normalizeSolvedQuestions(
              data.solvedQuestionsByCourse ?? updates.solvedQuestionsByCourse,
            );
          }
          if (updates.solvedQuestionsByTopic !== undefined) {
            merged.solvedQuestionsByTopic = normalizeSolvedQuestions(
              data.solvedQuestionsByTopic ?? updates.solvedQuestionsByTopic,
            );
          }
          if (updates.weeklySolvedQuestionsByCourse !== undefined) {
            merged.weeklySolvedQuestionsByCourse = normalizeSolvedQuestions(
              data.weeklySolvedQuestionsByCourse ??
                updates.weeklySolvedQuestionsByCourse,
            );
          }
          if (updates.weeklySolvedQuestionsByTopic !== undefined) {
            merged.weeklySolvedQuestionsByTopic = normalizeSolvedQuestions(
              data.weeklySolvedQuestionsByTopic ??
                updates.weeklySolvedQuestionsByTopic,
            );
          }
          if (updates.mockExams !== undefined) {
            merged.mockExams = data.mockExams ?? updates.mockExams;
          }

          updateCurrentStudent(merged);
        }
      } catch (error) {
        console.error("Güncelleme başarısız:", error);
      } finally {
        if (version === saveVersionRef.current) {
          setIsSaving(false);
        }
      }
    },
    [studentId, updateCurrentStudent],
  );

  const handleToggleCompletion = useCallback(
    (topicId: string, isCompleted: boolean) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const hasTopic = student.topics.some((t) => t.id === topicId);
      const updatedTopics = hasTopic
        ? student.topics.map((t) =>
            t.id === topicId ? { ...t, isCompleted } : t,
          )
        : [...student.topics, { id: topicId, isCompleted }];

      updateCurrentStudent({ topics: updatedTopics });
      persistUpdate({ topics: updatedTopics });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleToggleWeeklySelection = useCallback(
    (topicId: string, selected: boolean) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const current = student.weeklySelectedTopics ?? [];
      const updated = selected
        ? current.includes(topicId)
          ? current
          : [...current, topicId]
        : current.filter((id) => id !== topicId);

      updateCurrentStudent({ weeklySelectedTopics: updated });
      persistUpdate({ weeklySelectedTopics: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleUpdateSolvedQuestions = useCallback(
    (exam: keyof Curriculum, course: string, count: number) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const key = getCourseKey(exam, course);
      const updated = {
        ...(student.solvedQuestionsByCourse ?? {}),
        [key]: count,
      };

      updateCurrentStudent({ solvedQuestionsByCourse: updated });
      persistUpdate({ solvedQuestionsByCourse: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleUpdateTopicSolvedQuestions = useCallback(
    (topicId: string, count: number) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const updated = {
        ...(student.solvedQuestionsByTopic ?? {}),
        [topicId]: count,
      };

      updateCurrentStudent({ solvedQuestionsByTopic: updated });
      persistUpdate({ solvedQuestionsByTopic: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleUpdateWeeklyTopicSolvedQuestions = useCallback(
    (topicId: string, count: number) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const updated = {
        ...(student.weeklySolvedQuestionsByTopic ?? {}),
        [topicId]: count,
      };

      updateCurrentStudent({ weeklySolvedQuestionsByTopic: updated });
      persistUpdate({ weeklySolvedQuestionsByTopic: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleUpdateWeeklySolvedQuestions = useCallback(
    (exam: "TYT" | "AYT", course: string, count: number) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const key = getCourseKey(exam, course);
      const updated = {
        ...(student.weeklySolvedQuestionsByCourse ?? {}),
        [key]: count,
      };

      updateCurrentStudent({ weeklySolvedQuestionsByCourse: updated });
      persistUpdate({ weeklySolvedQuestionsByCourse: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleAddMockExam = useCallback(
    (exam: MockExam) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const updated = [...(student.mockExams ?? []), exam];
      updateCurrentStudent({ mockExams: updated });
      persistUpdate({ mockExams: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleDeleteMockExam = useCallback(
    (examId: string) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const updated = (student.mockExams ?? []).filter((e) => e.id !== examId);
      updateCurrentStudent({ mockExams: updated });
      persistUpdate({ mockExams: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleUpdateMockExam = useCallback(
    (exam: MockExam) => {
      const student = useStudentStore.getState().currentStudent;
      if (!student) return;

      const updated = (student.mockExams ?? []).map((e) =>
        e.id === exam.id ? exam : e,
      );
      updateCurrentStudent({ mockExams: updated });
      persistUpdate({ mockExams: updated });
    },
    [updateCurrentStudent, persistUpdate],
  );

  const handleWeeklyPrint = () => {
    setIsPrintingWeekly(true);
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const handleDeleteStudent = async () => {
    if (!currentStudent?._id) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${currentStudent._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        removeStudent(currentStudent._id);
        setShowDeleteConfirm(false);
        router.push("/dashboard");
      } else {
        setShowDeleteConfirm(false);
        setErrorMessage("Öğrenci silinemedi. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Öğrenci silinemedi:", error);
      setShowDeleteConfirm(false);
      setErrorMessage("Öğrenci silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Öğrenci verileri yükleniyor..." />;
  }

  if (!currentStudent) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700">
          Öğrenci bulunamadı
        </h2>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4 font-medium"
        >
          <FiArrowLeft />
          Dashboard&apos;a Dön
        </Link>
      </div>
    );
  }

  const overallProgress = getOverallProgress(currentStudent.topics);
  const weeklySelected = currentStudent.weeklySelectedTopics ?? [];
  const solvedQuestions = currentStudent.solvedQuestionsByCourse ?? {};
  const solvedQuestionsByTopic = currentStudent.solvedQuestionsByTopic ?? {};
  const weeklySolvedQuestions =
    currentStudent.weeklySolvedQuestionsByCourse ?? {};
  const weeklySolvedQuestionsByTopic =
    currentStudent.weeklySolvedQuestionsByTopic ?? {};
  const mockExams = currentStudent.mockExams ?? [];

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset =
    circumference - (overallProgress / 100) * circumference;

  return (
    <PageTransition>
      <div className="space-y-6 print:hidden w-full min-w-0 overflow-x-hidden">
        {/* Hero header */}
        <div className="card-premium overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="p-4 sm:p-6 flex flex-col gap-6">
            <div className="min-w-0 w-full">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-3 font-medium transition-colors"
              >
                <FiArrowLeft className="text-xs" />
                Geri Dön
              </Link>
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-blue-500/25 shrink-0">
                  {currentStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
                    {currentStudent.name}
                  </h1>
                  <p className="text-slate-500 mt-0.5 font-medium flex items-center gap-1.5 min-w-0">
                    <FiTrendingUp className="text-blue-500 shrink-0" />
                    <span className="truncate">
                      Hedef: {currentStudent.target || "Belirtilmedi"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="progressGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    %{overallProgress}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    İlerleme
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                {isSaving && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-blue-500 font-medium animate-pulse-soft"
                  >
                    Kaydediliyor...
                  </motion.span>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowDevelopmentReport(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <FiFileText />
                    Gelişim Raporu (PDF)
                  </button>
                  <button
                    onClick={() => setEditingStudent(currentStudent)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <FiEdit2 />
                    Düzenle
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <FiTrash2 />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-premium overflow-hidden">
          <div className="relative flex border-b border-slate-100">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                  activeTab === id
                    ? "text-blue-700"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/80"
                }`}
              >
                <Icon className="text-base" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">
                  {id === "progress"
                    ? "İlerleme"
                    : id === "weekly"
                      ? "Plan"
                      : "Deneme"}
                </span>
                {activeTab === id && (
                  <motion.div
                    layoutId="activeTab"
                    className="tab-indicator left-0 right-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "progress" ? (
                  <GeneralProgressTab
                    topics={currentStudent.topics}
                    solvedQuestionsByCourse={solvedQuestions}
                    solvedQuestionsByTopic={solvedQuestionsByTopic}
                    onToggleCompletion={handleToggleCompletion}
                    onUpdateSolvedQuestions={handleUpdateSolvedQuestions}
                    onUpdateTopicSolvedQuestions={handleUpdateTopicSolvedQuestions}
                  />
                ) : activeTab === "weekly" ? (
                  <WeeklyPlanTab
                    topics={currentStudent.topics}
                    weeklySelectedTopics={weeklySelected}
                    weeklySolvedQuestionsByCourse={weeklySolvedQuestions}
                    weeklySolvedQuestionsByTopic={weeklySolvedQuestionsByTopic}
                    onToggleWeeklySelection={handleToggleWeeklySelection}
                    onUpdateWeeklySolvedQuestions={
                      handleUpdateWeeklySolvedQuestions
                    }
                    onUpdateWeeklyTopicSolvedQuestions={
                      handleUpdateWeeklyTopicSolvedQuestions
                    }
                    onPrint={handleWeeklyPrint}
                  />
                ) : (
                  <MockExamTab
                    mockExams={mockExams}
                    onAddExam={handleAddMockExam}
                    onUpdateExam={handleUpdateMockExam}
                    onDeleteExam={handleDeleteMockExam}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <WeeklyPlanPrintView
        studentName={currentStudent.name}
        weeklySelectedTopics={weeklySelected}
        printVisible={isPrintingWeekly}
      />

      <DevelopmentReportModal
        isOpen={showDevelopmentReport}
        onClose={() => setShowDevelopmentReport(false)}
        studentName={currentStudent.name}
        target={currentStudent.target}
        topics={currentStudent.topics}
        solvedQuestionsByCourse={solvedQuestions}
        solvedQuestionsByTopic={solvedQuestionsByTopic}
      />

      <AddStudentModal />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Öğrenciyi Sil"
        message={`"${currentStudent.name}" öğrencisini ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteStudent}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
      />

      <AlertModal
        isOpen={errorMessage !== null}
        title="Hata"
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </PageTransition>
  );
}
