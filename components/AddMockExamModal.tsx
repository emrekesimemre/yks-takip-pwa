"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import {
  denemeCoursesByType,
  type DenemeExamType,
} from "@/data/denemeCourses";
import type { MockExam, MockExamCourseResult } from "@/store/useStudentStore";
import {
  calculateCourseNet,
  calculateExamTotalNet,
  createEmptyCourseResults,
  mergeCourseResults,
} from "@/utils/deneme";
import AnimatedModal from "@/components/ui/AnimatedModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: MockExam) => void;
  exam?: MockExam | null;
};

type FormProps = {
  exam?: MockExam | null;
  onClose: () => void;
  onSave: (exam: MockExam) => void;
};

function getInitialFormState(exam?: MockExam | null) {
  if (exam) {
    return {
      name: exam.name,
      date: exam.date,
      type: exam.type,
      courses: mergeCourseResults(exam.type, exam.courses),
    };
  }

  return {
    name: "",
    date: new Date().toISOString().slice(0, 10),
    type: "TYT" as DenemeExamType,
    courses: createEmptyCourseResults("TYT"),
  };
}

function MockExamForm({ exam, onClose, onSave }: FormProps) {
  const isEditing = exam != null;
  const initial = getInitialFormState(exam);
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [type, setType] = useState<DenemeExamType>(initial.type);
  const [courses, setCourses] = useState<MockExamCourseResult[]>(
    initial.courses,
  );

  const handleTypeChange = (newType: DenemeExamType) => {
    setType(newType);
    setCourses(createEmptyCourseResults(newType));
  };

  const updateCourse = (
    courseKey: string,
    field: keyof MockExamCourseResult,
    value: number,
  ) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.courseKey === courseKey ? { ...c, [field]: Math.max(0, value) } : c,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const filledCourses = courses.filter(
      (c) => c.correct + c.wrong + c.empty > 0,
    );
    if (filledCourses.length === 0) return;

    onSave({
      id: exam?.id ?? crypto.randomUUID(),
      name: name.trim(),
      date,
      type,
      courses: filledCourses,
    });

    onClose();
  };

  const previewNet = calculateExamTotalNet({ id: "", name, date, type, courses });
  const courseDefs = denemeCoursesByType[type];

  return (
    <>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 shrink-0" />
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Deneme Düzenle" : "Yeni Deneme Ekle"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ders bazlı doğru/yanlış/boş girişi
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Deneme Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 3D TYT-12"
              className="input-premium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-premium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Deneme Türü
          </label>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            {(["TYT", "AYT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  type === t
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 mb-3">
            Ders Bazlı Doğru / Yanlış / Boş
          </p>
          <div className="space-y-3">
            {courseDefs.map((def) => {
              const result = courses.find((c) => c.courseKey === def.key)!;
              const net = calculateCourseNet(result);
              const total = result.correct + result.wrong + result.empty;

              return (
                <div
                  key={def.key}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {def.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        max {def.maxQuestions} soru
                      </p>
                    </div>
                    <div className="shrink-0 text-right bg-white border border-slate-200 rounded-xl px-3 py-1.5 min-w-[56px]">
                      <p className="text-[10px] text-slate-400 leading-none font-medium">
                        Net
                      </p>
                      <p
                        className={`text-sm font-bold leading-tight mt-0.5 ${total > 0 ? "text-blue-600" : "text-slate-300"}`}
                      >
                        {total > 0 ? net.toFixed(1) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["correct", "wrong", "empty"] as const).map((field) => (
                      <div key={field}>
                        <label className="text-[10px] text-slate-400 uppercase block text-center mb-1 font-semibold">
                          {field === "correct"
                            ? "Doğru"
                            : field === "wrong"
                              ? "Yanlış"
                              : "Boş"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={def.maxQuestions}
                          value={result[field] || ""}
                          onChange={(e) =>
                            updateCourse(
                              def.key,
                              field,
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Toplam Net:{" "}
            <span className="font-bold text-blue-600 text-lg">
              {previewNet.toFixed(1)}
            </span>
          </p>
          <div className="flex gap-2 sm:shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
              İptal
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function AddMockExamModal({
  isOpen,
  onClose,
  onSave,
  exam,
}: Props) {
  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      {isOpen ? (
        <MockExamForm
          key={exam?.id ?? "new"}
          exam={exam}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </AnimatedModal>
  );
}
