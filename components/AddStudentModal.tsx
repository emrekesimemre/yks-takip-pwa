"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import { useStudentStore, type Student } from "@/store/useStudentStore";
import AlertModal from "@/components/AlertModal";
import AnimatedModal from "@/components/ui/AnimatedModal";

type StudentFormProps = {
  isEditMode: boolean;
  editingStudent: Student | null;
  initialName: string;
  initialTarget: string;
  onClose: () => void;
};

function StudentForm({
  isEditMode,
  editingStudent,
  initialName,
  initialTarget,
  onClose,
}: StudentFormProps) {
  const { addStudent, updateStudent } = useStudentStore();
  const [name, setName] = useState(initialName);
  const [target, setTarget] = useState(initialTarget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editingStudent?._id) {
        const res = await fetch(`/api/students/${editingStudent._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), target: target.trim() }),
        });

        if (!res.ok) throw new Error("Güncelleme başarısız");

        const savedStudent = await res.json();
        updateStudent({
          ...editingStudent,
          name: savedStudent.name,
          target: savedStudent.target ?? "",
        });
      } else {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), target: target.trim() }),
        });

        if (!res.ok) throw new Error("Kayıt başarısız");

        const savedStudent = await res.json();
        addStudent(savedStudent);
      }

      onClose();
    } catch (error) {
      console.error(
        isEditMode ? "Öğrenci güncellenemedi:" : "Öğrenci eklenemedi:",
        error,
      );
      setErrorMessage("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = isSubmitting
    ? isEditMode
      ? "Güncelleniyor..."
      : "Kaydediliyor..."
    : isEditMode
      ? "Güncelle"
      : "Kaydet";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Öğrenci Adı Soyadı
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-premium"
            placeholder="Örn: Ahmet Yılmaz"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Hedef / Alan
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="input-premium"
            placeholder="Örn: Sayısal İlk 20 Bin"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>

      <AlertModal
        isOpen={errorMessage !== null}
        title="Hata"
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

export default function AddStudentModal() {
  const {
    isAddModalOpen,
    editingStudent,
    setAddModalOpen,
    setEditingStudent,
  } = useStudentStore();

  const isEditMode = editingStudent !== null;
  const isOpen = isAddModalOpen || isEditMode;

  const handleClose = () => {
    setAddModalOpen(false);
    setEditingStudent(null);
  };

  const formKey = isEditMode ? `edit-${editingStudent._id}` : "add";

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? "Öğrenciyi Düzenle" : "Yeni Öğrenci Ekle"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEditMode
                ? "Öğrenci bilgilerini güncelleyin"
                : "Öğrenci bilgilerini girin"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {isOpen && (
          <StudentForm
            key={formKey}
            isEditMode={isEditMode}
            editingStudent={editingStudent}
            initialName={isEditMode ? editingStudent.name : ""}
            initialTarget={isEditMode ? (editingStudent.target ?? "") : ""}
            onClose={handleClose}
          />
        )}
      </div>
    </AnimatedModal>
  );
}
