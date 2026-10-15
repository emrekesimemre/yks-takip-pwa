"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useStudentStore } from "@/store/useStudentStore";
import AddStudentModal from "./AddStudentModal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageTransition from "@/components/ui/PageTransition";
import Link from "next/link";
import {
  FiPlus,
  FiTrash2,
  FiUsers,
  FiArrowRight,
  FiTarget,
  FiEdit2,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { getOverallProgress } from "@/utils/curriculum";

type DeleteTarget = { id: string; name: string };

const INACTIVE_DAYS = 7;

function daysSince(dateStr: string): number {
  const updated = new Date(dateStr).getTime();
  if (Number.isNaN(updated)) return 0;
  return Math.floor((Date.now() - updated) / (24 * 60 * 60 * 1000));
}

function formatGradeLabel(grade?: string, field?: string): string {
  const g = grade || "12";
  const fieldMap: Record<string, string> = {
    sayisal: "SAY",
    "esit-agirlik": "EA",
    sozel: "SÖZ",
    dil: "DİL",
  };
  const fText = field && fieldMap[field] ? ` · ${fieldMap[field]}` : "";
  if (g === "9") return "9. Sınıf";
  if (g === "10") return "10. Sınıf";
  if (g === "11") return `11. Sınıf${fText}`;
  if (g === "mezun") return `Mezun${fText}`;
  return `12. Sınıf${fText}`;
}

export default function DashboardClient() {
  const {
    students,
    setStudents,
    setAddModalOpen,
    setEditingStudent,
    removeStudent,
  } = useStudentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");

  useEffect(() => {
    const controller = new AbortController();

    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/students", { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (!controller.signal.aborted) setStudents(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Öğrenciler çekilirken hata oluştu:", error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchStudents();
    return () => controller.abort();
  }, [setStudents]);

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        removeStudent(deleteTarget.id);
        setDeleteTarget(null);
        toast.success("Öğrenci silindi.");
      } else {
        setDeleteTarget(null);
        toast.error("Öğrenci silinemedi. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Öğrenci silinemedi:", error);
      setDeleteTarget(null);
      toast.error("Öğrenci silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Öğrenciler yükleniyor..." />;
  }

  const filteredStudents = students.filter((s) => {
    if (gradeFilter === "ALL") return true;
    if (gradeFilter === "12_MEZUN") {
      return (s.grade || "12") === "12" || s.grade === "mezun";
    }
    return (s.grade || "12") === gradeFilter;
  });

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Öğrencilerim
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {students.length > 0
              ? `${students.length} öğrenci takip ediliyor`
              : "Takip etmek istediğiniz öğrencileri ekleyin"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAddModalOpen(true)}
          className="btn-primary shrink-0"
        >
          <FiPlus className="text-lg" />
          Yeni Öğrenci Ekle
        </motion.button>
      </div>

      {students.length > 0 && (
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 mb-6 flex-wrap">
          {[
            { key: "ALL", label: "Tümü" },
            { key: "9", label: "9. Sınıf" },
            { key: "10", label: "10. Sınıf" },
            { key: "11", label: "11. Sınıf" },
            { key: "12_MEZUN", label: "12 & Mezun (YKS)" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setGradeFilter(item.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                gradeFilter === item.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {students.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium p-12 sm:p-16 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <FiUsers className="text-4xl text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Henüz öğrenci eklemediniz
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Haftalık takip çizelgesi, konu ilerlemesi ve deneme sonuçları
            oluşturmak için hemen bir öğrenci ekleyin.
          </p>
          <button onClick={() => setAddModalOpen(true)} className="btn-primary">
            <FiPlus />
            İlk Öğrenciyi Ekle
          </button>
        </motion.div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-base font-semibold text-slate-600 mb-1">
            Bu sınıf düzeyinde kayıtlı öğrenci bulunamadı.
          </p>
          <p className="text-xs text-slate-400">
            Filtreyi &quot;Tümü&quot; olarak değiştirebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => {
            const progress = getOverallProgress(
              student.topics ?? [],
              student.grade,
              student.field,
            );
            const weeklyCount = student.weeklySelectedTopics?.length ?? 0;
            const inactiveDays = student.updatedAt
              ? daysSince(student.updatedAt)
              : 0;
            const isInactive = inactiveDays >= INACTIVE_DAYS;
            return (
              <motion.div
                key={student._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="card-premium group h-full overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Üst satır: avatar + ilerleme + butonlar */}
                  <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-blue-700 shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0" />
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400 font-medium">
                        İlerleme
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        %{progress}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingStudent(student);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        aria-label="Öğrenciyi düzenle"
                        title="Öğrenciyi düzenle"
                      >
                        <FiEdit2 className="text-base" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget({
                            id: student._id!,
                            name: student.name,
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        aria-label="Öğrenciyi sil"
                        title="Öğrenciyi sil"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/student/${student._id}`}
                    className="block px-5 pb-5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                        {student.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 shrink-0">
                        {formatGradeLabel(student.grade, student.field)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                      <FiTarget className="text-blue-400 shrink-0" />
                      <span className="truncate">
                        {student.target || "Hedef belirtilmedi"}
                      </span>
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          weeklyCount > 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <FiCalendar className="text-[10px]" />
                        {weeklyCount > 0
                          ? `${weeklyCount} konu planlandı`
                          : "Plan yapılmadı"}
                      </span>
                      {isInactive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800">
                          <FiClock className="text-[10px]" />
                          {inactiveDays} gün önce güncellendi
                        </span>
                      )}
                    </div>

                    <div className="mt-4 progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-4 flex items-center text-sm text-blue-600 font-semibold group-hover:gap-2 transition-all">
                      Detayları Gör
                      <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddStudentModal />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Öğrenciyi Sil"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" öğrencisini ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ""
        }
        confirmLabel="Sil"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteStudent}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </PageTransition>
  );
}
