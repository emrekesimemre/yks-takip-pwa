"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import { toast } from "sonner";
import {
  useStudentStore,
  type Student,
  type GradeLevel,
  type StudentField,
} from "@/store/useStudentStore";
import AnimatedModal from "@/components/ui/AnimatedModal";

function toStoreStudent(data: Student): Student {
  return {
    ...data,
    _id: data._id != null ? String(data._id) : undefined,
    name: data.name,
    grade: data.grade ?? "12",
    field: data.field ?? "",
    target: data.target ?? "",
    parentEmail: data.parentEmail ?? "",
    parentPhone: data.parentPhone ?? "",
    reportToken: data.reportToken,
    notes: data.notes ?? "",
    topics: Array.isArray(data.topics) ? data.topics : [],
    weeklySelectedTopics: Array.isArray(data.weeklySelectedTopics)
      ? data.weeklySelectedTopics
      : [],
    solvedQuestionsByCourse: data.solvedQuestionsByCourse ?? {},
    solvedQuestionsByTopic: data.solvedQuestionsByTopic ?? {},
    weeklySolvedQuestionsByCourse: data.weeklySolvedQuestionsByCourse ?? {},
    weeklySolvedQuestionsByTopic: data.weeklySolvedQuestionsByTopic ?? {},
    mockExams: Array.isArray(data.mockExams) ? data.mockExams : [],
  };
}

type StudentFormProps = {
  isEditMode: boolean;
  editingStudent: Student | null;
  initialName: string;
  initialGrade?: GradeLevel;
  initialField?: StudentField;
  initialTarget: string;
  initialParentEmail: string;
  initialParentPhone?: string;
  initialNotes: string;
  onClose: () => void;
};

function StudentForm({
  isEditMode,
  editingStudent,
  initialName,
  initialGrade = "12",
  initialField = "",
  initialTarget,
  initialParentEmail,
  initialParentPhone = "",
  initialNotes,
  onClose,
}: StudentFormProps) {
  const { addStudent, updateStudent } = useStudentStore();
  const [name, setName] = useState(initialName);
  const [grade, setGrade] = useState<GradeLevel>(initialGrade);
  const [field, setField] = useState<StudentField>(initialField);
  const [target, setTarget] = useState(initialTarget);
  const [parentEmail, setParentEmail] = useState(initialParentEmail);
  const [parentPhone, setParentPhone] = useState(initialParentPhone);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editingStudent?._id) {
        const res = await fetch(`/api/students/${editingStudent._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            grade,
            field,
            target: target.trim(),
            parentEmail: parentEmail.trim(),
            parentPhone: parentPhone.trim(),
            notes: notes.trim(),
          }),
        });

        const savedStudent = await res.json();
        if (!res.ok)
          throw new Error(savedStudent.error || "Güncelleme başarısız");
        updateStudent({
          ...editingStudent,
          name: savedStudent.name,
          grade: savedStudent.grade ?? grade,
          field: savedStudent.field ?? field,
          target: savedStudent.target ?? "",
          parentEmail: savedStudent.parentEmail ?? "",
          parentPhone: savedStudent.parentPhone ?? parentPhone.trim(),
          reportToken: savedStudent.reportToken ?? editingStudent.reportToken,
          notes: savedStudent.notes ?? "",
          updatedAt: savedStudent.updatedAt ?? editingStudent.updatedAt,
        });
        toast.success("Öğrenci güncellendi.");
      } else {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            grade,
            field,
            target: target.trim(),
            parentEmail: parentEmail.trim(),
            parentPhone: parentPhone.trim(),
            notes: notes.trim(),
          }),
        });

        const savedStudent = (await res.json()) as Student & { error?: string };
        if (!res.ok) throw new Error(savedStudent.error || "Kayıt başarısız");
        addStudent(toStoreStudent(savedStudent));
        toast.success("Öğrenci eklendi.");
      }

      onClose();
    } catch (error) {
      console.error(
        isEditMode ? "Öğrenci güncellenemedi:" : "Öğrenci eklenemedi:",
        error,
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Bir hata oluştu, lütfen tekrar deneyin.",
      );
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Sınıf Düzeyi
            </label>
            <select
              value={grade}
              onChange={(e) => {
                const nextGrade = e.target.value as GradeLevel;
                setGrade(nextGrade);
                if (nextGrade === "9" || nextGrade === "10") {
                  setField("");
                } else if (!field) {
                  setField("sayisal");
                }
              }}
              className="input-premium"
            >
              <option value="9">9. Sınıf</option>
              <option value="10">10. Sınıf</option>
              <option value="11">11. Sınıf</option>
              <option value="12">12. Sınıf (YKS)</option>
              <option value="mezun">Mezun (YKS)</option>
            </select>
          </div>

          {(grade === "11" || grade === "12" || grade === "mezun") && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Alan
              </label>
              <select
                value={field || "sayisal"}
                onChange={(e) => setField(e.target.value as StudentField)}
                className="input-premium"
              >
                <option value="sayisal">Sayısal (MF)</option>
                <option value="esit-agirlik">Eşit Ağırlık (TM)</option>
                <option value="sozel">Sözel (TS)</option>
                <option value="dil">Yabancı Dil (DİL)</option>
                <option value="genel">Genel / Ortak</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Hedef
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="input-premium"
            placeholder={
              grade === "9" || grade === "10"
                ? "Örn: Yıl Sonu 90+ Ortalama"
                : "Örn: İTÜ Bilgisayar Mühendisliği"
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="parent-email"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Veli e-postası
            </label>
            <input
              id="parent-email"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="input-premium"
              placeholder="ornek@gmail.com"
            />
          </div>

          <div>
            <label
              htmlFor="parent-phone"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Veli Telefonu (WhatsApp)
            </label>
            <input
              id="parent-phone"
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="input-premium"
              placeholder="05xxxxxxxxx"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="student-notes"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            Notlar
          </label>
          <textarea
            id="student-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-premium min-h-[96px] resize-y"
            placeholder="Örn: Matematikte zorlanıyor, veli ile görüşüldü"
            maxLength={1000}
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
    </>
  );
}

export default function AddStudentModal() {
  const { isAddModalOpen, editingStudent, setAddModalOpen, setEditingStudent } =
    useStudentStore();

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
            initialGrade={isEditMode ? (editingStudent.grade ?? "12") : "12"}
            initialField={isEditMode ? (editingStudent.field ?? "") : ""}
            initialTarget={isEditMode ? (editingStudent.target ?? "") : ""}
            initialParentEmail={
              isEditMode ? (editingStudent.parentEmail ?? "") : ""
            }
            initialParentPhone={
              isEditMode ? (editingStudent.parentPhone ?? "") : ""
            }
            initialNotes={isEditMode ? (editingStudent.notes ?? "") : ""}
            onClose={handleClose}
          />
        )}
      </div>
    </AnimatedModal>
  );
}
