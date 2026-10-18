"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  denemeCoursesByType,
  getDenemeExamTypesForStudent,
  getDenemeExamTypeLabel,
} from "@/data/denemeCourses";
import type { MockExam } from "@/store/useStudentStore";
import AddMockExamModal from "@/components/AddMockExamModal";
import UploadMockExamModal from "@/components/UploadMockExamModal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiCamera,
  FiAlertTriangle,
  FiList,
  FiCheck,
  FiCalendar,
} from "react-icons/fi";
import { toast } from "sonner";
import MockExamReportModal from "@/components/MockExamReportModal";
import {
  analyzeByCourse,
  calculateCourseNet,
  calculateExamTotalNet,
  calculateExamTotals,
  formatDate,
  formatNet,
  formatSuccessRate,
  getExamTrend,
  getProgressSegments,
  getWeakestCourses,
  hasAnsweredQuestions,
} from "@/utils/deneme";

type Props = {
  studentName?: string;
  grade?: string;
  field?: string;
  target?: string;
  mockExams: MockExam[];
  weeklySelectedTopics?: string[];
  onAddTopicsToPlan?: (topicIds: string[]) => void;
  onAddExam: (exam: MockExam) => void;
  onUpdateExam: (exam: MockExam) => void;
  onDeleteExam: (examId: string) => void;
};

export default function MockExamTab({
  studentName,
  grade,
  field,
  target,
  mockExams,
  weeklySelectedTopics,
  onAddTopicsToPlan,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MockExam | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<MockExam | null>(null);

  const availableExamTypes = getDenemeExamTypesForStudent(grade, field);
  const filterOptions = [
    { key: "ALL", label: "Tümü" },
    ...availableExamTypes.map((t) => ({ key: t.type, label: t.label })),
  ];

  const filtered =
    filterType === "ALL"
      ? mockExams
      : mockExams.filter((e) => e.type === filterType);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const trend = getExamTrend(filtered);
  const courseAnalysis = analyzeByCourse(filtered);
  const weakestCourses = getWeakestCourses(courseAnalysis);
  const maxTrendNet = Math.max(...trend.map((t) => t.net), 1);

  const avgNet =
    trend.length > 0
      ? Math.round(
          (trend.reduce((s, t) => s + t.net, 0) / trend.length) * 10,
        ) / 10
      : 0;

  const lastExam = sorted[0];
  const lastNet = lastExam ? calculateExamTotalNet(lastExam) : null;

  const handleDeleteClick = (exam: MockExam, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(exam);
  };

  const handleEditClick = (exam: MockExam, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSaveExam = (exam: MockExam) => {
    if (editingExam) {
      onUpdateExam(exam);
    } else {
      onAddExam(exam);
    }
  };

  const handleSaveFromUploadModal = (exam: MockExam) => {
    onAddExam(exam);
    setExpandedId(exam.id);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteExam(deleteTarget.id);
    if (expandedId === deleteTarget.id) setExpandedId(null);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Deneme Analizi
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ders bazlı doğru/yanlış girişi ve performans takibi
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 cursor-pointer"
          >
            <FiCamera className="text-base" />
            <span>Karneden Tara (AI)</span>
          </motion.button>
          {mockExams.length > 0 && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-xl hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <FiFileText className="text-base" />
              <span>Deneme Karnesi (PDF)</span>
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAddModal}
            className="btn-primary shrink-0"
          >
            <FiPlus />
            Yeni Deneme Ekle
          </motion.button>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Toplam Deneme" value={String(filtered.length)} />
        <SummaryCard
          label="Son Deneme Neti"
          value={lastNet !== null ? formatNet(lastNet) : "—"}
          accent
        />
        <SummaryCard label="Ortalama Net" value={formatNet(avgNet)} />
        <SummaryCard
          label={
            weakestCourses.length > 1 ? "En Zayıf Dersler" : "En Zayıf Ders"
          }
          value={
            weakestCourses.length > 0
              ? weakestCourses.map((c) => c.courseName).join(", ")
              : "—"
          }
          sub={
            weakestCourses.length > 0
              ? `Ort. ${formatNet(weakestCourses[0].avgNet)} net`
              : undefined
          }
        />
      </div>

      {/* Son Deneme Konu Özeti */}
      {((lastExam?.topics && lastExam.topics.length > 0) ||
        (lastExam?.wrongTopics && lastExam.wrongTopics.length > 0)) && (
        <div
          onClick={() =>
            setExpandedId(expandedId === lastExam.id ? null : lastExam.id)
          }
          className="p-4 bg-gradient-to-r from-indigo-50/80 via-blue-50/80 to-purple-50/80 border border-indigo-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-indigo-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
              <FiList className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800">
                  Son Deneme: {lastExam.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {lastExam.topics?.length || lastExam.wrongTopics?.length || 0} Konu Kayıtlı
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Karneden taranan konu bazlı Doğru, Yanlış ve Boş karnesi hazır. İncelemek için tıklayın.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>{expandedId === lastExam.id ? "Analizi Kapat" : "Konu Analizini Aç"}</span>
            {expandedId === lastExam.id ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      )}

      {/* Filtre */}
      {filterOptions.length > 2 && (
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-0.5 flex-wrap">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterType === f.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-lg font-semibold text-slate-600 mb-1">
            Henüz deneme kaydı yok
          </p>
          <p className="text-sm text-slate-400">
            &quot;Yeni Deneme Ekle&quot; butonuyla ilk sonucu girin
          </p>
        </div>
      ) : (
        <>
          {/* Net trendi */}
          <section className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              Net Gelişim Grafiği
            </h3>
            <div className="flex items-end gap-2 h-32 overflow-x-auto pb-1">
              {trend.map((t, i) => (
                <div
                  key={t.id}
                  className="flex flex-col items-center gap-1 shrink-0"
                  style={{ minWidth: 48 }}
                >
                  <span className="text-xs font-bold text-blue-600">
                    {formatNet(t.net)}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max(8, (t.net / maxTrendNet) * 100)}%`,
                    }}
                    transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                    className="w-10 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg min-h-[8px]"
                  />
                  <span className="text-[10px] text-slate-400 text-center leading-tight max-w-[48px] truncate">
                    {new Date(t.date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Ders bazlı analiz */}
          {courseAnalysis.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Ders Bazlı Performans Analizi
              </h3>
              <div className="space-y-2">
                {courseAnalysis.map((c) => (
                  <div
                    key={c.courseKey}
                    className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition-colors"
                  >
                    <div className="w-32 shrink-0">
                      <p className="text-sm font-medium text-slate-800">
                        {c.courseName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.examCount} deneme
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-600">
                          D: {c.avgCorrect.toFixed(1)}
                        </span>
                        <span className="text-red-500">
                          Y: {c.avgWrong.toFixed(1)}
                        </span>
                        <span className="text-slate-500">
                          Başarı: %{Math.round(c.avgSuccessRate)}
                        </span>
                        <span className="font-semibold text-blue-600">
                          Net: {formatNet(c.avgNet)}
                        </span>
                      </div>
                      <CourseProgressBar segments={c.progressSegments} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Deneme listesi */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Deneme Geçmişi
            </h3>
            <div className="space-y-3">
              {sorted.map((exam) => {
                const totals = calculateExamTotals(exam);
                const isExpanded = expandedId === exam.id;
                const totalNet = calculateExamTotalNet(exam);

                return (
                  <div
                    key={exam.id}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-stretch">
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : exam.id)
                        }
                        className="flex-1 flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0 bg-blue-100 text-blue-700">
                            {getDenemeExamTypeLabel(exam.type)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-800 truncate">
                                {exam.name}
                              </p>
                              {((exam.topics && exam.topics.length > 0) ||
                                (exam.wrongTopics && exam.wrongTopics.length > 0)) && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                  📊 {exam.topics?.length || exam.wrongTopics?.length} Konu Analizi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(exam.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {formatNet(totalNet)}
                            </p>
                            <p className="text-xs text-slate-400">net</p>
                          </div>
                          <span className="text-slate-400">
                            {isExpanded ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleEditClick(exam, e)}
                        className="px-4 border-l border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors shrink-0"
                        aria-label="Denemeyi düzenle"
                        title="Düzenle"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(exam, e)}
                        className="px-4 border-l border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                        aria-label="Denemeyi sil"
                        title="Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <MiniStat label="Doğru" value={totals.correct} color="green" />
                          <MiniStat label="Yanlış" value={totals.wrong} color="red" />
                          <MiniStat label="Boş" value={totals.empty} color="slate" />
                          <MiniStat
                            label="Başarı"
                            value={formatSuccessRate(
                              totals.correct,
                              totals.wrong,
                              totals.empty,
                              totals.maxTotal,
                            )}
                            color="blue"
                          />
                        </div>

                        <div className="space-y-2">
                          {exam.courses.map((c) => {
                            const def = denemeCoursesByType[exam.type]?.find(
                              (d) => d.key === c.courseKey,
                            ) || {
                              key: c.courseKey,
                              name:
                                c.courseName ||
                                c.courseKey.replace(/^[A-Z0-9]+-/, ""),
                              maxQuestions:
                                c.correct + c.wrong + c.empty > 0
                                  ? c.correct + c.wrong + c.empty
                                  : 20,
                            };
                            const displayName = c.courseName || def.name;
                            const maxQ =
                              def.maxQuestions ||
                              c.correct + c.wrong + c.empty ||
                              20;
                            const net = calculateCourseNet(c);
                            const segments = getProgressSegments(
                              c.correct,
                              c.wrong,
                              c.empty,
                              maxQ,
                            );
                            const hasData = hasAnsweredQuestions(
                              c.correct,
                              c.wrong,
                              c.empty,
                            );

                            return (
                              <div
                                key={c.courseKey}
                                className="p-3 bg-white rounded-lg border border-slate-100 space-y-2"
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <p className="text-sm font-medium text-slate-700">
                                    {displayName}
                                  </p>
                                  <span className="text-sm font-bold text-blue-600 shrink-0">
                                    {hasData ? `${formatNet(net)} net` : "—"}
                                  </span>
                                </div>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-green-600 font-medium">
                                    {c.correct} Doğru
                                  </span>
                                  <span className="text-red-500 font-medium">
                                    {c.wrong} Yanlış
                                  </span>
                                  <span className="text-slate-400">
                                    {c.empty} Boş
                                  </span>
                                  <span className="text-slate-400 ml-auto">
                                    / {maxQ}
                                  </span>
                                </div>
                                {hasData ? (
                                  <CourseProgressBar segments={segments} />
                                ) : (
                                  <div className="h-2 bg-slate-100 rounded-full" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Karnede Tespit Edilen Konu Analiz Verisi */}
                        {((exam.topics && exam.topics.length > 0) ||
                          (exam.wrongTopics && exam.wrongTopics.length > 0)) && (
                          <ExamTopicAnalysis
                            topics={
                              exam.topics && exam.topics.length > 0
                                ? exam.topics
                                : exam.wrongTopics!
                            }
                            weeklySelectedTopics={weeklySelectedTopics}
                            onAddTopicsToPlan={onAddTopicsToPlan}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <UploadMockExamModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSave={handleSaveFromUploadModal}
        studentName={studentName}
        grade={grade}
        field={field}
        weeklySelectedTopics={weeklySelectedTopics}
        onAddTopicsToPlan={onAddTopicsToPlan}
      />

      <AddMockExamModal
        isOpen={isModalOpen}
        grade={grade}
        field={field}
        onClose={handleCloseModal}
        onSave={handleSaveExam}
        exam={editingExam}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Denemeyi Sil"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" denemesini silmek istediğinize emin misiniz?`
            : ""
        }
        confirmLabel="Sil"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <MockExamReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        studentName={studentName || "Öğrenci"}
        grade={grade}
        field={field}
        target={target}
        mockExams={mockExams}
      />
    </div>
  );
}

function CourseProgressBar({
  segments,
}: {
  segments: { correct: number; wrong: number; remainder: number };
}) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
      <div
        className="bg-green-500 h-full"
        style={{ width: `${segments.correct}%` }}
      />
      <div
        className="bg-red-400 h-full"
        style={{ width: `${segments.wrong}%` }}
      />
      <div
        className="bg-slate-200 h-full"
        style={{ width: `${segments.remainder}%` }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-100 hover:shadow-sm transition-all">
      <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
      <p
        className={`text-2xl font-bold ${accent ? "text-blue-600" : "text-slate-800"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: "green" | "red" | "slate" | "blue";
}) {
  const colors = {
    green: "text-green-600",
    red: "text-red-500",
    slate: "text-slate-500",
    blue: "text-blue-600",
  };
  return (
    <div className="bg-white rounded-lg p-2 border border-slate-100">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function ExamTopicAnalysis({
  topics,
  weeklySelectedTopics,
  onAddTopicsToPlan,
}: {
  topics: Array<{
    courseKey?: string;
    courseName?: string;
    topicName: string;
    questionCount?: number;
    correctCount?: number;
    wrongCount?: number;
    emptyCount?: number;
    matchedTopicId?: string;
    matchedTopicTitle?: string;
  }>;
  weeklySelectedTopics?: string[];
  onAddTopicsToPlan?: (topicIds: string[]) => void;
}) {
  const [filter, setFilter] = useState<"all" | "weak" | "correct">("all");
  const [search, setSearch] = useState("");

  const filtered = topics.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        t.topicName.toLowerCase().includes(q) ||
        (t.courseName && t.courseName.toLowerCase().includes(q)) ||
        (t.courseKey && t.courseKey.toLowerCase().includes(q));
      if (!match) return false;
    }
    const isWeak = (t.wrongCount || 0) > 0 || (t.emptyCount || 0) > 0;
    const isFullCorrect =
      (t.correctCount || 0) > 0 &&
      (!t.wrongCount || t.wrongCount === 0) &&
      (!t.emptyCount || t.emptyCount === 0);

    if (filter === "weak") return isWeak;
    if (filter === "correct") return isFullCorrect;
    return true;
  });

  const weakCount = topics.filter(
    (t) => (t.wrongCount || 0) > 0 || (t.emptyCount || 0) > 0,
  ).length;
  const fullCorrectCount = topics.filter(
    (t) =>
      (t.correctCount || 0) > 0 &&
      (!t.wrongCount || t.wrongCount === 0) &&
      (!t.emptyCount || t.emptyCount === 0),
  ).length;

  const missingWithMatch = topics.filter(
    (t) =>
      Boolean(t.matchedTopicId) &&
      ((t.wrongCount || 0) > 0 || (t.emptyCount || 0) > 0),
  );
  const unplannedTopics = missingWithMatch.filter(
    (t) => !weeklySelectedTopics?.includes(t.matchedTopicId!),
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 mt-3 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div>
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FiList className="text-indigo-600" />
            <span>Karne Konu Analizi ({topics.length} Konu Kayıtlı)</span>
          </h5>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sınavda taranan tüm konuların doğru, yanlış ve boş analizi
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {onAddTopicsToPlan && missingWithMatch.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const ids = unplannedTopics.map((t) => t.matchedTopicId!);
                if (ids.length > 0) {
                  onAddTopicsToPlan(ids);
                  toast.success(`${ids.length} eksik konu haftalık plana eklendi!`);
                }
              }}
              disabled={unplannedTopics.length === 0}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                unplannedTopics.length > 0
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 shadow-2xs cursor-pointer active:scale-95"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-default opacity-70"
              }`}
              title={
                unplannedTopics.length > 0
                  ? "Öğrencinin bu denemedeki tüm eksik konularını haftalık plana ekler"
                  : "Tüm eksik konular zaten haftalık planda"
              }
            >
              <FiCalendar className="text-xs" />
              <span>
                {unplannedTopics.length > 0
                  ? `Eksik Konuları Plana Ekle (${unplannedTopics.length})`
                  : "Tüm Eksikler Planda"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-slate-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tümü ({topics.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("weak")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === "weak"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Yanlış / Boş ({weakCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("correct")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === "correct"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Tam Doğru ({fullCorrectCount})
          </button>
        </div>
      </div>

      {topics.length > 6 && (
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Konu veya ders ara..."
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>
      )}

      <div className="max-h-80 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Filtreye uygun konu bulunamadı.
          </div>
        ) : (
          filtered.map((t, idx) => {
            const cCount = t.correctCount || 0;
            const wCount = t.wrongCount || 0;
            const eCount = t.emptyCount || 0;
            const qCount = t.questionCount || cCount + wCount + eCount;
            const rate = qCount > 0 ? Math.round((cCount / qCount) * 100) : 0;
            const isAlreadyInPlan = Boolean(
              t.matchedTopicId && weeklySelectedTopics?.includes(t.matchedTopicId),
            );

            return (
              <div
                key={idx}
                className="flex items-center justify-between pt-2 pb-1.5 text-xs hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {t.courseName || t.courseKey}
                    </span>
                    <span
                      className="font-semibold text-slate-800 truncate"
                      title={t.topicName}
                    >
                      {t.topicName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    {qCount} Soru:
                  </span>
                  {cCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {cCount} D
                    </span>
                  )}
                  {wCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {wCount} Y
                    </span>
                  )}
                  {eCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {eCount} B
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rate === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : rate >= 50
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    %{rate}
                  </span>

                  {t.matchedTopicId && onAddTopicsToPlan && (
                    <button
                      type="button"
                      disabled={isAlreadyInPlan}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTopicsToPlan([t.matchedTopicId!]);
                        toast.success(
                          `${t.matchedTopicTitle || t.topicName} haftalık plana eklendi!`,
                        );
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isAlreadyInPlan
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 active:scale-95 cursor-pointer"
                      }`}
                      title={
                        isAlreadyInPlan
                          ? "Bu konu zaten haftalık planda ekli"
                          : "Bu konuyu haftalık plana ekle"
                      }
                    >
                      {isAlreadyInPlan ? (
                        <>
                          <FiCheck className="text-[10px]" /> Planda
                        </>
                      ) : (
                        <>
                          <FiPlus className="text-[10px]" /> Plana Ekle
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
