"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { denemeCoursesByType } from "@/data/denemeCourses";
import type { MockExam } from "@/store/useStudentStore";
import AddMockExamModal from "@/components/AddMockExamModal";
import ConfirmModal from "@/components/ConfirmModal";
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  analyzeByCourse,
  calculateCourseNet,
  calculateExamTotalNet,
  calculateExamTotals,
  formatDate,
  formatSuccessRate,
  getExamTrend,
  getProgressSegments,
  getWeakestCourses,
  hasAnsweredQuestions,
} from "@/utils/deneme";

type Props = {
  mockExams: MockExam[];
  onAddExam: (exam: MockExam) => void;
  onUpdateExam: (exam: MockExam) => void;
  onDeleteExam: (examId: string) => void;
};

export default function MockExamTab({
  mockExams,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MockExam | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "TYT" | "AYT">("ALL");
  const [deleteTarget, setDeleteTarget] = useState<MockExam | null>(null);

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

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Toplam Deneme" value={String(filtered.length)} />
        <SummaryCard
          label="Son Deneme Neti"
          value={lastNet !== null ? lastNet.toFixed(1) : "—"}
          accent
        />
        <SummaryCard label="Ortalama Net" value={avgNet.toFixed(1)} />
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
              ? `Ort. ${weakestCourses[0].avgNet.toFixed(1)} net`
              : undefined
          }
        />
      </div>

      {/* Filtre */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-0.5">
        {(["ALL", "TYT", "AYT"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === f
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f === "ALL" ? "Tümü" : f}
          </button>
        ))}
      </div>

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
                    {t.net.toFixed(0)}
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
                          Net: {c.avgNet.toFixed(1)}
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
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                              exam.type === "TYT"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {exam.type}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {exam.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(exam.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {totalNet.toFixed(1)}
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
                            const def = denemeCoursesByType[exam.type].find(
                              (d) => d.key === c.courseKey,
                            );
                            if (!def) return null;
                            const net = calculateCourseNet(c);
                            const segments = getProgressSegments(
                              c.correct,
                              c.wrong,
                              c.empty,
                              def.maxQuestions,
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
                                    {def.name}
                                  </p>
                                  <span className="text-sm font-bold text-blue-600 shrink-0">
                                    {hasData ? `${net.toFixed(1)} net` : "—"}
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
                                    / {def.maxQuestions}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <AddMockExamModal
        isOpen={isModalOpen}
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
