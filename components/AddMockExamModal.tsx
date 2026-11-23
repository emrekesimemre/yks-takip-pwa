"use client";

import AnimatedModal from "@/components/ui/AnimatedModal";
import {
  denemeCoursesByType,
  getDenemeExamTypesForStudent,
} from "@/data/denemeCourses";
import {
  allCurriculums,
  getCurriculumForStudent,
  type Course,
} from "@/data/subjects";
import type {
  MockExam,
  MockExamCourseResult,
  MockExamTopicResult,
  MockExamWrongTopic,
} from "@/store/useStudentStore";
import {
  calculateCourseNet,
  calculateExamTotalNet,
  createEmptyCourseResults,
  formatNet,
  mergeCourseResults,
} from "@/utils/deneme";
import { findCurriculumMatch } from "@/utils/topicMatcher";
import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiLayers,
  FiList,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";

type Props = {
  isOpen: boolean;
  grade?: string;
  field?: string;
  onClose: () => void;
  onSave: (exam: MockExam) => void;
  exam?: MockExam | null;
};

type FormProps = {
  exam?: MockExam | null;
  grade?: string;
  field?: string;
  onClose: () => void;
  onSave: (exam: MockExam) => void;
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

function getSuggestedTopicsForCourse(
  courseName: string,
  grade?: string,
  field?: string,
): string[] {
  if (!courseName) return [];
  const target = normalizeText(courseName);
  const titles = new Set<string>();

  const scan = (currs: Record<string, Course>) => {
    for (const cMap of Object.values(currs)) {
      for (const [cName, list] of Object.entries(cMap)) {
        const cn = normalizeText(cName);
        if (
          cn === target ||
          cn.includes(target) ||
          target.includes(cn) ||
          (target.includes("edebiyat") && cn.includes("turkce")) ||
          (target.includes("turkce") && cn.includes("edebiyat")) ||
          (target.includes("geometri") && cn.includes("geometri"))
        ) {
          for (const t of list) {
            titles.add(t.title);
          }
        }
      }
    }
  };

  scan(getCurriculumForStudent(grade, field));
  if (titles.size === 0) {
    scan(allCurriculums as Record<string, Course>);
  }

  return Array.from(titles);
}

function getInitialFormState(exam?: MockExam | null, defaultType = "TYT") {
  if (exam) {
    const existingTopics: MockExamTopicResult[] =
      exam.topics && exam.topics.length > 0
        ? exam.topics
        : exam.wrongTopics && exam.wrongTopics.length > 0
          ? exam.wrongTopics.map((wt) => ({
              courseKey: wt.courseKey,
              courseName: wt.courseName,
              topicName: wt.topicName,
              questionCount:
                wt.questionCount ??
                wt.wrongCount + (wt.emptyCount ?? 0) + (wt.correctCount ?? 0),
              correctCount: wt.correctCount ?? 0,
              wrongCount: wt.wrongCount,
              emptyCount: wt.emptyCount ?? 0,
              matchedTopicId: wt.matchedTopicId,
              matchedTopicTitle: wt.matchedTopicTitle,
            }))
          : [];

    return {
      name: exam.name,
      date: exam.date,
      type: exam.type,
      courses: mergeCourseResults(exam.type, exam.courses),
      topics: existingTopics,
    };
  }

  return {
    name: "",
    date: new Date().toISOString().slice(0, 10),
    type: defaultType,
    courses: createEmptyCourseResults(defaultType),
    topics: [] as MockExamTopicResult[],
  };
}

function MockExamForm({ exam, grade, field, onClose, onSave }: FormProps) {
  const isEditing = exam != null;
  const availableTypes = getDenemeExamTypesForStudent(grade, field);
  const defaultType = availableTypes[0]?.type ?? "TYT";
  const initial = getInitialFormState(exam, defaultType);

  const [activeTab, setActiveTab] = useState<"scores" | "topics">("scores");
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [type, setType] = useState<string>(initial.type);
  const [courses, setCourses] = useState<MockExamCourseResult[]>(
    initial.courses,
  );
  const [topics, setTopics] = useState<MockExamTopicResult[]>(initial.topics);
  const [validationError, setValidationError] = useState<string | null>(null);

  const courseDefs = denemeCoursesByType[type] || [];

  // Konu ekleme için ders seçenekleri (Mevcut deneme dersleri + Geometri)
  const topicCourseOptions = useMemo(() => {
    let list = courseDefs.map((d) => d.name);
    if (type === "TYT") {
      list = list.filter(
        (name) => name !== "Sosyal Bilimler" && name !== "Fen Bilimleri",
      );
    }
    if (list.some((c) => c.includes("Matematik")) && !list.includes("Geometri")) {
      list.push("Geometri");
    }
    return list.length > 0 ? list : ["Matematik", "Türkçe", "Fizik", "Kimya", "Biyoloji"];
  }, [courseDefs, type]);

  // Yeni konu girişi state'leri
  const [selectedTopicCourse, setSelectedTopicCourse] = useState<string>(() => {
    const list = courseDefs.map((d) => d.name);
    return list[0] || "Matematik";
  });
  const [newTopicName, setNewTopicName] = useState("");
  const [newCorrect, setNewCorrect] = useState<number>(0);
  const [newWrong, setNewWrong] = useState<number>(1);
  const [newEmpty, setNewEmpty] = useState<number>(0);
  const [topicError, setTopicError] = useState<string | null>(null);

  // Seçili derse ait müfredat konu önerileri
  const suggestedTopics = useMemo(() => {
    return getSuggestedTopicsForCourse(selectedTopicCourse, grade, field);
  }, [selectedTopicCourse, grade, field]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setCourses(createEmptyCourseResults(newType));
    const nextDefs = denemeCoursesByType[newType] || [];
    if (nextDefs.length > 0) {
      setSelectedTopicCourse(nextDefs[0].name);
    }
  };

  const updateCourse = (
    courseKey: string,
    fieldKey: keyof MockExamCourseResult,
    value: number,
  ) => {
    setValidationError(null);
    const def = courseDefs.find((d) => d.key === courseKey);
    const maxQ = def?.maxQuestions ?? 999;

    setCourses((prev) =>
      prev.map((c) => {
        if (c.courseKey !== courseKey) return c;
        const updated = { ...c, [fieldKey]: Math.max(0, value) };
        const total = updated.correct + updated.wrong + updated.empty;
        if (total > maxQ) {
          setValidationError(
            `${def?.name ?? courseKey}: Doğru + Yanlış + Boş toplamı maksimum soru sayısını (${maxQ}) aşamaz.`,
          );
          return c;
        }
        return updated;
      }),
    );
  };

  const handleAddTopic = () => {
    setTopicError(null);
    const trimmedTitle = newTopicName.trim();
    if (!trimmedTitle) {
      setTopicError("Lütfen bir konu adı girin veya listeden seçin.");
      return;
    }

    const totalQuestions = newCorrect + newWrong + newEmpty;
    if (totalQuestions <= 0) {
      setTopicError("En az 1 soru (doğru, yanlış veya boş) girmelisiniz.");
      return;
    }

    const match = findCurriculumMatch(
      trimmedTitle,
      selectedTopicCourse,
      grade,
      field,
    );

    const matchedTopicId = match
      ? match.id
      : `custom::${selectedTopicCourse}::${trimmedTitle}`;
    const matchedTopicTitle = match ? match.title : trimmedTitle;

    const matchedCourseDef = courseDefs.find(
      (d) => d.name === selectedTopicCourse,
    );

    const newTopicItem: MockExamTopicResult = {
      courseKey: matchedCourseDef?.key,
      courseName: selectedTopicCourse,
      topicName: trimmedTitle,
      questionCount: totalQuestions,
      correctCount: newCorrect,
      wrongCount: newWrong,
      emptyCount: newEmpty,
      matchedTopicId,
      matchedTopicTitle,
    };

    setTopics((prev) => [newTopicItem, ...prev]);
    setNewTopicName("");
    setNewCorrect(0);
    setNewWrong(1);
    setNewEmpty(0);
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setTopics((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllTopics = () => {
    if (window.confirm("Eklenen tüm konuları silmek istediğinize emin misiniz?")) {
      setTopics([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const overLimit = courses.find((c) => {
      const def = courseDefs.find((d) => d.key === c.courseKey);
      return def && c.correct + c.wrong + c.empty > def.maxQuestions;
    });
    if (overLimit) {
      const def = courseDefs.find((d) => d.key === overLimit.courseKey);
      setValidationError(
        `${def?.name ?? overLimit.courseKey}: Doğru + Yanlış + Boş toplamı maksimum soru sayısını (${def?.maxQuestions}) aşamaz.`,
      );
      return;
    }

    const filledCourses = courses.filter(
      (c) => c.correct + c.wrong + c.empty > 0,
    );

    if (filledCourses.length === 0 && topics.length === 0) {
      setValidationError(
        "Lütfen en az bir ders neti veya en az bir konu analizi girin.",
      );
      return;
    }

    const wrongTopics: MockExamWrongTopic[] = topics
      .filter((t) => (t.wrongCount ?? 0) > 0 || (t.emptyCount ?? 0) > 0)
      .map((t) => ({
        courseKey: t.courseKey,
        courseName: t.courseName,
        topicName: t.topicName,
        questionCount: t.questionCount,
        correctCount: t.correctCount,
        wrongCount: t.wrongCount ?? 0,
        emptyCount: t.emptyCount ?? 0,
        matchedTopicId: t.matchedTopicId,
        matchedTopicTitle: t.matchedTopicTitle,
      }));

    onSave({
      id: exam?.id ?? crypto.randomUUID(),
      name: name.trim(),
      date,
      type,
      courses: filledCourses,
      topics: topics.length > 0 ? topics : undefined,
      wrongTopics: wrongTopics.length > 0 ? wrongTopics : undefined,
    });

    onClose();
  };

  const previewNet = calculateExamTotalNet({ id: "", name, date, type, courses });

  return (
    <>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 shrink-0" />
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? "Deneme Düzenle" : "Yeni Deneme Ekle"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ders netleri ve isteğe bağlı konu analizi girişi
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Kapat"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      {/* Sekme Geçişi */}
      <div className="flex border-b border-slate-200/80 bg-slate-50/60 px-6 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("scores")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "scores"
              ? "border-blue-600 text-blue-600 bg-white shadow-sm -mb-[1px]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FiLayers className="text-base" />
          <span>Ders Netleri</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("topics")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "topics"
              ? "border-blue-600 text-blue-600 bg-white shadow-sm -mb-[1px]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FiList className="text-base" />
          <span>Konu Analizi</span>
          {topics.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
              {topics.length}
            </span>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
        {/* Ortak Temel Bilgiler: Ad ve Tarih */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Deneme Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 3D TYT-12, Branş Matematik Denemesi..."
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

        {/* SEKME 1: DERS NETLERİ */}
        {activeTab === "scores" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Deneme Türü
              </label>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl flex-wrap gap-1">
                {availableTypes.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleTypeChange(t.type)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      type === t.type
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t.label}
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
                  const result =
                    courses.find((c) => c.courseKey === def.key) || {
                      courseKey: def.key,
                      correct: 0,
                      wrong: 0,
                      empty: 0,
                    };
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
                            className={`text-sm font-bold leading-tight mt-0.5 ${
                              total > 0 ? "text-blue-600" : "text-slate-300"
                            }`}
                          >
                            {total > 0 ? formatNet(net) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["correct", "wrong", "empty"] as const).map(
                          (fieldKey) => (
                            <div key={fieldKey}>
                              <label className="text-[10px] text-slate-400 uppercase block text-center mb-1 font-semibold">
                                {fieldKey === "correct"
                                  ? "Doğru"
                                  : fieldKey === "wrong"
                                    ? "Yanlış"
                                    : "Boş"}
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={def.maxQuestions}
                                value={result[fieldKey] || ""}
                                onChange={(e) =>
                                  updateCourse(
                                    def.key,
                                    fieldKey,
                                    Number.parseInt(e.target.value, 10) || 0,
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SEKME 2: KONU ANALİZİ (MANUEL) */}
        {activeTab === "topics" && (
          <div className="space-y-4">
            {/* Açıklama Kartı */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                <FiList size={16} />
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-semibold text-slate-800">
                  Manuel Konu Analizi & Hata Takibi
                </p>
                <p>
                  Karnesi olmayan denemeler veya branş testlerinizdeki hatalı ve
                  boş soruları buradan ekleyin. Eklediğiniz konuları tek tıkla{" "}
                  <strong>Haftalık Çalışma Planınıza</strong> dahil
                  edebilirsiniz.
                </p>
              </div>
            </div>

            {/* Yeni Konu Ekleme Kartı */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                + Yeni Konu Ekle
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Ders Seçimi */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Ders
                  </label>
                  <select
                    value={selectedTopicCourse}
                    onChange={(e) => setSelectedTopicCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {topicCourseOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Konu Adı + Autocomplete */}
                <div className="sm:col-span-8">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Konu Adı (Listeden seçin veya yazın)
                  </label>
                  <input
                    list="topic-datalist-suggestions"
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="Örn: Fonksiyonlar, Paragrafta Anlam, Basınç..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <datalist id="topic-datalist-suggestions">
                    {suggestedTopics.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* D / Y / B ve Ekle Butonu */}
              <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-700 uppercase text-center mb-0.5">
                      Doğru
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={newCorrect}
                      onChange={(e) =>
                        setNewCorrect(
                          Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                        )
                      }
                      className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-bold text-emerald-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-700 uppercase text-center mb-0.5">
                      Yanlış
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={newWrong}
                      onChange={(e) =>
                        setNewWrong(
                          Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                        )
                      }
                      className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-bold text-rose-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-amber-700 uppercase text-center mb-0.5">
                      Boş
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={newEmpty}
                      onChange={(e) =>
                        setNewEmpty(
                          Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                        )
                      }
                      className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-bold text-amber-600 bg-white"
                    />
                  </div>
                  <div className="pl-1 self-center text-xs text-slate-400 font-medium">
                    = {newCorrect + newWrong + newEmpty} soru
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0"
                >
                  <FiPlus />
                  <span>Listeye Ekle</span>
                </button>
              </div>

              {topicError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-1.5">
                  <FiAlertCircle className="shrink-0 text-sm" />
                  <span>{topicError}</span>
                </div>
              )}
            </div>

            {/* Eklenen Konular Listesi */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kayıtlı Konular ({topics.length})
                </p>
                {topics.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTopics}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
                  >
                    Tümünü Temizle
                  </button>
                )}
              </div>

              {topics.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-2xl mb-1">📝</p>
                  <p className="text-sm font-semibold text-slate-700">
                    Henüz konu eklenmedi
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Yukarıdaki formdan denemede çözdüğünüz veya yanlış yaptığınız
                    konuları ekleyin.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {topics.map((t, idx) => {
                    const isCustom = t.matchedTopicId?.startsWith("custom::");
                    return (
                      <div
                        key={`${t.topicName}-${idx}`}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {t.courseName || "Genel"}
                            </span>
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {t.topicName}
                            </span>
                            {isCustom ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Özel Konu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <FiCheck size={10} />
                                <span>Müfredat</span>
                              </span>
                            )}
                          </div>
                          {!isCustom &&
                            t.matchedTopicTitle &&
                            t.matchedTopicTitle !== t.topicName && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                Müfredat: {t.matchedTopicTitle}
                              </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="flex items-center gap-1 text-xs font-semibold">
                            <span className="text-[11px] text-slate-400 font-normal mr-1 hidden sm:inline">
                              {t.questionCount || 0} Soru:
                            </span>
                            {(t.correctCount ?? 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                                {t.correctCount} D
                              </span>
                            )}
                            {(t.wrongCount ?? 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                                {t.wrongCount} Y
                              </span>
                            )}
                            {(t.emptyCount ?? 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                                {t.emptyCount} B
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Konuyu Kaldır"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {validationError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              Toplam Net:{" "}
              <strong className="text-blue-600 text-lg">
                {formatNet(previewNet)}
              </strong>
            </span>
            {topics.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                📊 {topics.length} Konu
              </span>
            )}
          </div>
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
  grade,
  field,
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
          grade={grade}
          field={field}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </AnimatedModal>
  );
}
