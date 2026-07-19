"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStudentStore } from "@/store/useStudentStore";
import AddStudentModal from "./AddStudentModal";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageTransition from "@/components/ui/PageTransition";
import Link from "next/link";
import { FiPlus, FiTrash2, FiUsers, FiArrowRight, FiTarget, FiEdit2 } from "react-icons/fi";
import { getOverallProgress } from "@/utils/curriculum";

type DeleteTarget = { id: string; name: string };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardClient() {
  const { students, setStudents, setAddModalOpen, setEditingStudent, removeStudent } =
    useStudentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/students");
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Öğrenciler çekilirken hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
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
      } else {
        setErrorMessage("Öğrenci silinemedi. Lütfen tekrar deneyin.");
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error("Öğrenci silinemedi:", error);
      setErrorMessage("Öğrenci silinemedi. Lütfen tekrar deneyin.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Öğrenciler yükleniyor..." />;
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
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
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {students.map((student) => {
            const progress = getOverallProgress(student.topics ?? []);
            return (
              <motion.div key={student._id} variants={item}>
                <div className="card-premium group relative h-full overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <Link
                    href={`/dashboard/student/${student._id}`}
                    className="block p-5 pr-14"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-blue-700 shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400 font-medium">
                          İlerleme
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          %{progress}
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg text-slate-800 group-hover:text-blue-700 transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                      <FiTarget className="text-blue-400 shrink-0" />
                      <span className="truncate">{student.target || "Hedef belirtilmedi"}</span>
                    </p>

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

                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingStudent(student);
                      }}
                      className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      aria-label="Öğrenciyi düzenle"
                      title="Öğrenciyi düzenle"
                    >
                      <FiEdit2 className="text-base" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget({ id: student._id!, name: student.name });
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      aria-label="Öğrenciyi sil"
                      title="Öğrenciyi sil"
                    >
                      <FiTrash2 className="text-base" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
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

      <AlertModal
        isOpen={errorMessage !== null}
        title="Hata"
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </PageTransition>
  );
}
