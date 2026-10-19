"use client";

import { useState, useCallback } from "react";
import type { SchoolExamEntry } from "@/store/useStudentStore";
import { FiPlus, FiTrash2, FiBook } from "react-icons/fi";

// Sınıf bazlı ders listeleri
export const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  "9": [
    "Türk Dili ve Edebiyatı",
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Tarih",
    "Coğrafya",
    "İngilizce",
    "Kur'an-ı Kerim",
    "Arapça",
    "Temel Dini Bilgiler",
  ],
  "10": [
    "Türk Dili ve Edebiyatı",
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Tarih",
    "Coğrafya",
    "Felsefe",
    "İngilizce",
    "Kur'an-ı Kerim",
    "Arapça",
    "Siyer",
    "Fıkıh",
    "Hadis",
  ],
  "11": [
    "Türk Dili ve Edebiyatı",
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Tarih",
    "Felsefe",
    "İngilizce",
    "Kur'an-ı Kerim",
    "Mesleki Arapça",
    "Tefsir",
    "Akaid",
    "Hitabet ve Mesleki Uygulama",
  ],
  "12": [
    "Türk Dili ve Edebiyatı",
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "T.C. İnkılap Tarihi ve Atatürkçülük",
    "İngilizce",
    "Kur'an-ı Kerim",
    "Mesleki Arapça",
    "Kelam",
    "İslâm Kültür ve Medeniyeti",
    "Dinler Tarihi",
  ],
};

function getSubjectsForGrade(grade?: string): string[] {
  if (!grade) return SUBJECTS_BY_GRADE["12"];
  return SUBJECTS_BY_GRADE[grade] ?? SUBJECTS_BY_GRADE["12"];
}

type Props = {
  grade?: string;
  schoolGrades: SchoolExamEntry[];
  onSave: (grades: SchoolExamEntry[]) => void;
  isSaving?: boolean;
};

type TermKey = 1 | 2;
const TERMS: TermKey[] = [1, 2];
const EXAM_INDICES = [1, 2, 3] as const;

// Belirli ders+dönem için mevcut notları döndür
function getEntries(
  grades: SchoolExamEntry[],
  subject: string,
  term: TermKey,
): SchoolExamEntry[] {
  return grades.filter((g) => g.subject === subject && g.term === term);
}

function buildId(subject: string, term: TermKey, examIndex: 1 | 2 | 3): string {
  return `term${term}-${subject.replace(/\s+/g, "_")}-${examIndex}`;
}

function calcAverage(entries: SchoolExamEntry[]): number | null {
  if (entries.length === 0) return null;
  return Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
}

function avgColor(avg: number | null): string {
  if (avg === null) return "text-slate-400";
  if (avg >= 85) return "text-emerald-600 font-bold";
  if (avg >= 70) return "text-blue-600 font-semibold";
  if (avg >= 50) return "text-amber-600 font-semibold";
  return "text-red-600 font-bold";
}

export default function SchoolGradesTab({
  grade,
  schoolGrades,
  onSave,
  isSaving,
}: Props) {
  const subjects = getSubjectsForGrade(grade);
  const [activeTerm, setActiveTerm] = useState<TermKey>(1);
  const [customSubject, setCustomSubject] = useState("");
  const [allSubjects, setAllSubjects] = useState<string[]>(subjects);

  // Ekstra ders ekle
  const handleAddCustomSubject = useCallback(() => {
    const name = customSubject.trim();
    if (!name || allSubjects.includes(name)) {
      setCustomSubject("");
      return;
    }
    setAllSubjects((prev) => [...prev, name]);
    setCustomSubject("");
  }, [customSubject, allSubjects]);

  // Not değiştir
  const handleScoreChange = useCallback(
    (
      subject: string,
      term: TermKey,
      examIndex: 1 | 2 | 3,
      rawValue: string,
    ) => {
      const id = buildId(subject, term, examIndex);
      const value = rawValue === "" ? null : parseFloat(rawValue);

      let updated: SchoolExamEntry[];
      if (value === null || isNaN(value)) {
        // Notu sil
        updated = schoolGrades.filter((g) => g.id !== id);
      } else {
        const score = Math.max(0, Math.min(100, value));
        const existing = schoolGrades.find((g) => g.id === id);
        if (existing) {
          updated = schoolGrades.map((g) =>
            g.id === id ? { ...g, score } : g,
          );
        } else {
          updated = [...schoolGrades, { id, subject, term, examIndex, score }];
        }
      }
      onSave(updated);
    },
    [schoolGrades, onSave],
  );

  // Dersin tüm notlarını sil
  const handleDeleteSubject = useCallback(
    (subject: string) => {
      const updated = schoolGrades.filter((g) => g.subject !== subject);
      onSave(updated);
      if (!subjects.includes(subject)) {
        setAllSubjects((prev) => prev.filter((s) => s !== subject));
      }
    },
    [schoolGrades, onSave, subjects],
  );

  if (grade === "mezun") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FiBook className="text-4xl mb-3" />
        <p className="text-sm">
          Mezun öğrenciler için okul notu takibi aktif değil.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Dönem seçici */}
      <div className="flex gap-2">
        {TERMS.map((term) => (
          <button
            key={term}
            onClick={() => setActiveTerm(term)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTerm === term
                ? "bg-indigo-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {term}. Dönem
          </button>
        ))}
        {isSaving && (
          <span className="ml-auto text-xs text-slate-400 self-center animate-pulse">
            Kaydediliyor…
          </span>
        )}
      </div>

      {/* Ders tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Sticky Sütun Başlığı */}
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-44 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Ders
              </th>
              {EXAM_INDICES.map((i) => (
                <th
                  key={i}
                  className="text-center px-3 py-3 text-slate-500 font-medium w-28"
                >
                  {i}. Yazılı
                </th>
              ))}
              <th className="text-center px-3 py-3 text-slate-500 font-medium w-20">
                Ort.
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {allSubjects.map((subject, idx) => {
              const termEntries = getEntries(schoolGrades, subject, activeTerm);
              const avg = calcAverage(termEntries);
              const isEvenRow = idx % 2 === 0;

              return (
                <tr
                  key={subject}
                  // "group" class'ı hover efektinin sticky td'ye de geçmesi için eklendi
                  className={`group border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    isEvenRow ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  {/* Sticky Hücre */}
                  <td
                    className={`px-4 py-3 font-medium text-slate-700 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors group-hover:bg-slate-50 ${
                      isEvenRow ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    {subject}
                  </td>

                  {EXAM_INDICES.map((examIndex) => {
                    const entry = termEntries.find(
                      (e) => e.examIndex === examIndex,
                    );
                    return (
                      <td key={examIndex} className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          placeholder="—"
                          value={entry?.score ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              subject,
                              activeTerm,
                              examIndex,
                              e.target.value,
                            )
                          }
                          className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder-slate-300"
                        />
                      </td>
                    );
                  })}
                  <td
                    className={`px-3 py-2 text-center text-sm ${avgColor(avg)}`}
                  >
                    {avg !== null ? avg : "—"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => handleDeleteSubject(subject)}
                      title="Dersi ve tüm notlarını sil"
                      className="text-slate-300 hover:text-red-400 transition-colors p-1"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Özet satırı */}
      <TermSummary
        subjects={allSubjects}
        grades={schoolGrades}
        term={activeTerm}
      />

      {/* Özel ders ekle */}
      <div className="flex gap-2 items-center pt-1">
        <input
          type="text"
          value={customSubject}
          onChange={(e) => setCustomSubject(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCustomSubject()}
          placeholder="Ekstra ders adı (ör. İkinci Dil)"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 max-w-xs"
        />
        <button
          onClick={handleAddCustomSubject}
          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <FiPlus size={14} /> Ekle
        </button>
      </div>
    </div>
  );
}

function TermSummary({
  subjects,
  grades,
  term,
}: {
  subjects: string[];
  grades: SchoolExamEntry[];
  term: TermKey;
}) {
  const withGrades = subjects
    .map((subject) => {
      const entries = getEntries(grades, subject, term);
      const avg = calcAverage(entries);
      return { subject, avg };
    })
    .filter((s) => s.avg !== null) as { subject: string; avg: number }[];

  if (withGrades.length === 0) return null;

  const termAvg = Math.round(
    withGrades.reduce((s, e) => s + e.avg, 0) / withGrades.length,
  );

  const best = [...withGrades].sort((a, b) => b.avg - a.avg)[0];
  const worst = [...withGrades].sort((a, b) => a.avg - b.avg)[0];

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-indigo-50 rounded-xl p-4 text-center">
        <p className="text-xs text-indigo-500 font-medium mb-1">
          {term}. Dönem Genel Ort.
        </p>
        <p className={`text-2xl font-bold ${avgColor(termAvg)}`}>{termAvg}</p>
      </div>
      <div className="bg-emerald-50 rounded-xl p-4 text-center">
        <p className="text-xs text-emerald-600 font-medium mb-1">En İyi</p>
        <p className="text-sm font-bold text-emerald-700">{best.subject}</p>
        <p className="text-lg font-bold text-emerald-600">{best.avg}</p>
      </div>
      <div className="bg-red-50 rounded-xl p-4 text-center">
        <p className="text-xs text-red-500 font-medium mb-1">En Düşük</p>
        <p className="text-sm font-bold text-red-700">{worst.subject}</p>
        <p className="text-lg font-bold text-red-500">{worst.avg}</p>
      </div>
    </div>
  );
}
