"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUploadCloud,
  FiFileText,
  FiX,
  FiCheck,
  FiLoader,
  FiKey,
  FiCalendar,
  FiList,
  FiAlertCircle,
  FiCheckSquare,
  FiSquare,
  FiEdit3,
} from "react-icons/fi";
import { toast } from "sonner";
import type {
  MockExam,
  MockExamCourseResult,
  MockExamWrongTopic,
} from "@/store/useStudentStore";
import {
  getDenemeExamTypesForStudent,
  getDenemeCourseDef,
} from "@/data/denemeCourses";
import { calculateNet } from "@/utils/deneme";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: MockExam) => void;
  studentName?: string;
  grade?: string;
  field?: string;
  weeklySelectedTopics?: string[];
  onAddTopicsToPlan?: (topicIds: string[]) => void;
};

type ParsedData = {
  examName: string;
  examType: string;
  date: string;
  studentName?: string;
  schoolName?: string;
  courses: Array<{
    courseKey: string;
    courseName: string;
    correct: number;
    wrong: number;
    empty: number;
  }>;
  wrongTopics: Array<
    MockExamWrongTopic & {
      matchedTopicTitle?: string;
      matchedCourseName?: string;
    }
  >;
};

export default function UploadMockExamModal({
  isOpen,
  onClose,
  onSave,
  studentName,
  grade,
  field,
  weeklySelectedTopics,
  onAddTopicsToPlan,
}: Props) {
  const [step, setStep] = useState<"upload" | "processing" | "review">(
    "upload",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  // Review states
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState("TYT");
  const [examDate, setExamDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [addToPlan, setAddToPlan] = useState<boolean>(false);
  const [courses, setCourses] = useState<
    Array<MockExamCourseResult & { courseName?: string }>
  >([]);
  const [wrongTopics, setWrongTopics] = useState<
    Array<
      MockExamWrongTopic & {
        matchedTopicTitle?: string;
        matchedCourseName?: string;
        selected?: boolean;
      }
    >
  >([]);
  const [topicFilter, setTopicFilter] = useState<"weak" | "all" | "correct">(
    "weak",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key'i localStorage'dan yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("GEMINI_API_KEY");
      if (storedKey) setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("GEMINI_API_KEY", key.trim());
    }
  };

  const resetState = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setParsedData(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Lütfen bir resim (PNG, JPG) veya PDF dosyası seçin.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      toast.error("Lütfen bir karne görseli veya PDF dosyası seçin.");
      return;
    }

    setStep("processing");

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("apiKey", apiKey);
      formData.append("grade", grade || "12");
      formData.append("field", field || "sayisal");
      formData.append("studentName", studentName || "");

      const res = await fetch("/api/mock-exams/parse", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.error === "API_KEY_REQUIRED") {
          setShowApiKeyInput(true);
        }
        throw new Error(json.message || "Karne okunurken bir hata oluştu.");
      }

      const data: ParsedData = json.data;
      setParsedData(data);
      setExamName(data.examName || "Deneme Sınavı");
      setExamType(data.examType || "TYT");
      setExamDate(data.date || new Date().toISOString().split("T")[0]);
      setCourses(
        data.courses.map((c) => ({
          courseKey: c.courseKey,
          courseName: c.courseName || c.courseKey,
          correct: c.correct,
          wrong: c.wrong,
          empty: c.empty,
        })),
      );
      const rawTopics = (data as any).topics || data.wrongTopics || [];
      setWrongTopics(
        rawTopics.map((wt: any) => ({
          ...wt,
          selected: true,
        })),
      );

      setStep("review");
      toast.success("Karne başarıyla okundu! Lütfen sonuçları inceleyin.");
    } catch (err: any) {
      toast.error(err.message || "Karne okunamadı.");
      setStep("upload");
    }
  };

  const handleCourseChange = (
    index: number,
    field: "correct" | "wrong" | "empty",
    val: number,
  ) => {
    setCourses((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: Math.max(0, val) } : c,
      ),
    );
  };

  const toggleTopicSelected = (index: number) => {
    setWrongTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t)),
    );
  };

  const selectAllTopics = (select: boolean) => {
    setWrongTopics((prev) => prev.map((t) => ({ ...t, selected: select })));
  };

  const handleAggregateCourses = () => {
    const mergedMap = new Map<
      string,
      MockExamCourseResult & { courseName?: string }
    >();
    for (const c of courses) {
      const parentDef = getDenemeCourseDef(examType, c.courseKey);
      const parentName = parentDef?.name || c.courseKey;
      const existing = mergedMap.get(c.courseKey) || {
        courseKey: c.courseKey,
        courseName: parentName,
        correct: 0,
        wrong: 0,
        empty: 0,
      };
      existing.correct += c.correct;
      existing.wrong += c.wrong;
      existing.empty += c.empty;
      mergedMap.set(c.courseKey, existing);
    }
    setCourses(Array.from(mergedMap.values()));
    toast.success("Dersler ana başlıklar altında birleştirildi.");
  };

  const handleSaveToSystem = () => {
    if (!examName.trim()) {
      toast.error("Lütfen bir sınav adı girin.");
      return;
    }

    const mergedCoursesMap = new Map<string, MockExamCourseResult>();
    for (const c of courses) {
      const existing = mergedCoursesMap.get(c.courseKey) || {
        courseKey: c.courseKey,
        courseName: c.courseName,
        correct: 0,
        wrong: 0,
        empty: 0,
      };
      existing.correct += Number(c.correct || 0);
      existing.wrong += Number(c.wrong || 0);
      existing.empty += Number(c.empty || 0);
      if (c.courseName) existing.courseName = c.courseName;
      mergedCoursesMap.set(c.courseKey, existing);
    }

    const newExam: MockExam = {
      id: crypto.randomUUID(),
      name: examName.trim(),
      type: examType,
      date: examDate,
      courses: Array.from(mergedCoursesMap.values()),
      topics: wrongTopics
        .filter((t) => t.selected !== false)
        .map((t) => ({
          courseKey: t.courseKey,
          courseName: t.courseName,
          topicName: t.topicName,
          questionCount: t.questionCount,
          correctCount: t.correctCount,
          wrongCount: t.wrongCount,
          emptyCount: t.emptyCount,
          matchedTopicId: t.matchedTopicId,
          matchedTopicTitle: t.matchedTopicTitle,
        })),
      wrongTopics: wrongTopics
        .filter(
          (t) =>
            t.selected !== false &&
            ((t.wrongCount || 0) > 0 || (t.emptyCount || 0) > 0),
        )
        .map((t) => ({
          courseKey: t.courseKey,
          courseName: t.courseName,
          topicName: t.topicName,
          questionCount: t.questionCount,
          correctCount: t.correctCount,
          wrongCount: t.wrongCount,
          emptyCount: t.emptyCount,
          matchedTopicId: t.matchedTopicId,
          matchedTopicTitle: t.matchedTopicTitle,
        })),
    };

    if (addToPlan && onAddTopicsToPlan) {
      const idsToAdd = wrongTopics
        .filter(
          (t) =>
            t.selected !== false &&
            t.matchedTopicId &&
            ((t.wrongCount || 0) > 0 || (t.emptyCount || 0) > 0) &&
            !weeklySelectedTopics?.includes(t.matchedTopicId),
        )
        .map((t) => t.matchedTopicId!);

      if (idsToAdd.length > 0) {
        onAddTopicsToPlan(idsToAdd);
      }
    }

    onSave(newExam);
    toast.success("Deneme sınavı başarıyla eklendi!");
    handleClose();
  };

  const availableExamTypes = getDenemeExamTypesForStudent(grade, field);

  const totalCorrect = courses.reduce((s, c) => s + c.correct, 0);
  const totalWrong = courses.reduce((s, c) => s + c.wrong, 0);
  const totalEmpty = courses.reduce((s, c) => s + c.empty, 0);
  const totalNet = calculateNet(totalCorrect, totalWrong);

  const unplannedWeakCount = wrongTopics.filter(
    (t) =>
      t.selected !== false &&
      t.matchedTopicId &&
      ((t.wrongCount || 0) > 0 || (t.emptyCount || 0) > 0) &&
      !weeklySelectedTopics?.includes(t.matchedTopicId),
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-violet-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <FiUploadCloud className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Yapay Zeka ile Deneme Karnesi Tara
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                  AI OCR
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Karne fotoğrafı veya PDF yükleyin; netler ve eksik konular
                anında çıkarılsın.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Modal İçeriği */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? "border-indigo-400 bg-indigo-50/30"
                    : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Karne Önizleme"
                      className="max-h-48 rounded-lg shadow-sm border border-slate-200 mb-3 object-contain"
                    />
                    <p className="text-sm font-semibold text-slate-700">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Değiştirmek için tıklayın
                    </p>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                      <FiFileText className="text-3xl" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF Seçildi. Değiştirmek için tıklayın
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                      <FiUploadCloud className="text-3xl" />
                    </div>
                    <p className="text-base font-bold text-slate-700">
                      Karne Fotoğrafı veya PDF Dosyasını Buraya Bırakın
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Kafa Dengi, Özdebir, 3D, Bilgi Sarmal ve tüm okul
                      karnelerini destekler.
                    </p>
                    <span className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors">
                      Dosya Seç
                    </span>
                  </div>
                )}
              </div>

              {/* API Key Ayarı (Opsiyonel / İstenirse) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiKey className="text-indigo-600 text-sm" />
                    <span className="text-xs font-bold text-slate-700">
                      Google Gemini API Anahtarı
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {showApiKeyInput
                      ? "Gizle"
                      : apiKey
                        ? "Anahtarı Güncelle"
                        : "Anahtar Ekle"}
                  </button>
                </div>

                {showApiKeyInput && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      placeholder="AI Studio Gemini API Key (örn: AIzaSy...)"
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">
                      API anahtarı tarayıcınızda saklanır. Google AI Studio
                      üzerinden tamamen ücretsiz edinebilirsiniz.
                    </p>
                  </div>
                )}
              </div>

              {/* Analiz Butonu */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!selectedFile}
                  onClick={() => handleStartAnalysis()}
                  className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-200"
                >
                  <FiUploadCloud className="text-lg" />
                  <span>Karneyi Analiz Et</span>
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-bold">
                  AI
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Karne Analiz Ediliyor...
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Yapay zeka ders toplamlarını ve konu bazlı yanlış/boş
                  kazanımları okuyor. Lütfen bekleyin.
                </p>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6">
              {/* Sınav Genel Bilgileri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Sınav Adı
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Sınav Türü
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {availableExamTypes.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toplam Net Özeti */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Doğru
                  </span>
                  <p className="text-base font-extrabold text-emerald-600">
                    {totalCorrect}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Yanlış
                  </span>
                  <p className="text-base font-extrabold text-rose-600">
                    {totalWrong}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Boş
                  </span>
                  <p className="text-base font-extrabold text-amber-600">
                    {totalEmpty}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Toplam Net
                  </span>
                  <p className="text-base font-extrabold text-indigo-700">
                    {totalNet.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Ders Netleri Tablosu */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    Ders Bazlı Sonuçlar (Düzenlenebilir)
                  </h4>
                  {courses.length > 4 && (
                    <button
                      type="button"
                      onClick={handleAggregateCourses}
                      className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      title="Tarih, Coğrafya, Felsefe gibi alt dersleri tek 'Sosyal Bilimler' altında birleştirir"
                    >
                      Ana Dersleri Birleştir ({courses.length} Ders → 4 TYT
                      Dersi)
                    </button>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-100/80 px-3 py-2 font-bold text-slate-600">
                    <div className="col-span-5">Ders</div>
                    <div className="col-span-2 text-center">Doğru</div>
                    <div className="col-span-2 text-center">Yanlış</div>
                    <div className="col-span-1 text-center">Boş</div>
                    <div className="col-span-2 text-right">Net</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {courses.map((course, idx) => {
                      const cNet = calculateNet(course.correct, course.wrong);
                      const parentDef = getDenemeCourseDef(
                        examType,
                        course.courseKey,
                      );
                      const parentName = parentDef?.name || course.courseKey;
                      const hasSubCourse =
                        course.courseName &&
                        course.courseName.trim() !== "" &&
                        course.courseName.toLowerCase() !==
                          parentName.toLowerCase();
                      return (
                        <div
                          key={`${course.courseKey}-${course.courseName}-${idx}`}
                          className="grid grid-cols-12 items-center px-3 py-2 hover:bg-slate-50"
                        >
                          <div
                            className="col-span-5 pr-2 min-w-0"
                            title={course.courseKey}
                          >
                            <span className="font-semibold text-slate-800 text-xs block truncate">
                              {course.courseName || parentName}
                            </span>
                            {hasSubCourse && (
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {parentName}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 px-1">
                            <input
                              type="number"
                              min={0}
                              value={course.correct}
                              onChange={(e) =>
                                handleCourseChange(
                                  idx,
                                  "correct",
                                  Number(e.target.value),
                                )
                              }
                              className="w-full text-center py-1 bg-white border border-slate-200 rounded font-semibold text-emerald-700"
                            />
                          </div>
                          <div className="col-span-2 px-1">
                            <input
                              type="number"
                              min={0}
                              value={course.wrong}
                              onChange={(e) =>
                                handleCourseChange(
                                  idx,
                                  "wrong",
                                  Number(e.target.value),
                                )
                              }
                              className="w-full text-center py-1 bg-white border border-slate-200 rounded font-semibold text-rose-700"
                            />
                          </div>
                          <div className="col-span-1 px-1">
                            <input
                              type="number"
                              min={0}
                              value={course.empty}
                              onChange={(e) =>
                                handleCourseChange(
                                  idx,
                                  "empty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-full text-center py-1 bg-white border border-slate-200 rounded font-semibold text-slate-600"
                            />
                          </div>
                          <div className="col-span-2 text-right font-bold text-indigo-700">
                            {cNet.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Yanlış / Eksik / Tüm Konular Listesi */}
              <div>
                {(() => {
                  const weakTopicsCount = wrongTopics.filter(
                    (t) =>
                      t.wrongCount > 0 || (t.emptyCount && t.emptyCount > 0),
                  ).length;
                  const correctTopicsCount = wrongTopics.filter(
                    (t) =>
                      (t.correctCount || 0) > 0 &&
                      t.wrongCount === 0 &&
                      (!t.emptyCount || t.emptyCount === 0),
                  ).length;

                  const filteredTopics = wrongTopics
                    .map((topic, originalIdx) => ({ topic, originalIdx }))
                    .filter(({ topic }) => {
                      const isWeak =
                        topic.wrongCount > 0 ||
                        (topic.emptyCount && topic.emptyCount > 0);
                      const isCorrect =
                        (topic.correctCount || 0) > 0 &&
                        topic.wrongCount === 0 &&
                        (!topic.emptyCount || topic.emptyCount === 0);

                      if (topicFilter === "weak") return isWeak;
                      if (topicFilter === "correct") return isCorrect;
                      return true; // "all"
                    });

                  return (
                    <>
                      <div className="space-y-2 mb-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <FiAlertCircle className="text-amber-500" />
                              <span>
                                Karneden Okunan Konu Başlıkları (
                                {wrongTopics.length})
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Doğrular, yanlışlar ve boş bırakılan tüm
                              kazanımlar.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => selectAllTopics(true)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                            >
                              Tümünü Seç
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => selectAllTopics(false)}
                              className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                            >
                              Kaldır
                            </button>
                          </div>
                        </div>

                        {/* Filtre sekmeleri */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <button
                            type="button"
                            onClick={() => setTopicFilter("weak")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              topicFilter === "weak"
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Eksik / Yanlış ({weakTopicsCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTopicFilter("all")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              topicFilter === "all"
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Tüm Konular ({wrongTopics.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTopicFilter("correct")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              topicFilter === "correct"
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Tam Doğrular ({correctTopicsCount})
                          </button>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                        {filteredTopics.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Bu filtrede konu bulunmuyor.
                          </div>
                        ) : (
                          filteredTopics.map(({ topic, originalIdx }) => {
                            const isFullCorrect =
                              (topic.correctCount || 0) > 0 &&
                              topic.wrongCount === 0 &&
                              (!topic.emptyCount || topic.emptyCount === 0);

                            return (
                              <div
                                key={originalIdx}
                                onClick={() => toggleTopicSelected(originalIdx)}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                                  topic.selected
                                    ? "bg-white"
                                    : "bg-slate-50/70 opacity-60"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {topic.selected ? (
                                    <FiCheckSquare className="text-indigo-600 text-sm shrink-0" />
                                  ) : (
                                    <FiSquare className="text-slate-400 text-sm shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                        {topic.courseName}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-800 truncate">
                                        {topic.topicName}
                                      </span>
                                    </div>
                                    {topic.matchedTopicTitle && (
                                      <p className="text-[10px] text-indigo-600 mt-0.5">
                                        Müfredat Eşleşmesi:{" "}
                                        {topic.matchedTopicTitle}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isFullCorrect && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                      ✓ {topic.correctCount} Doğru
                                    </span>
                                  )}
                                  {topic.wrongCount > 0 && (
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                                      {topic.wrongCount} Yanlış
                                    </span>
                                  )}
                                  {Boolean(
                                    topic.emptyCount && topic.emptyCount > 0,
                                  )}
                                  {Boolean(
                                    topic.emptyCount && topic.emptyCount > 0,
                                  ) && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                                      {topic.emptyCount} Boş
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Kalıcı Veri & Haftalık Plan Seçeneği */}
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">
                      Toplam{" "}
                      {wrongTopics.filter((t) => t.selected !== false).length}{" "}
                      konunun başarı ve soru analizleri deneme kaydı altında
                      kalıcı olarak saklanacaktır.
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                      Kalıcı Konu Analizi
                    </span>
                  </div>

                  {Boolean(onAddTopicsToPlan && unplannedWeakCount > 0) && (
                    <label className="flex items-center gap-2.5 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100/70 transition-colors">
                      <input
                        type="checkbox"
                        checked={addToPlan}
                        onChange={(e) => setAddToPlan(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-indigo-950">
                          Eksik konuları haftalık çalışma planına da ekle (
                          {unplannedWeakCount} konu)
                        </span>
                        <span className="text-indigo-700 text-[11px] block mt-0.5">
                          Öğrencinin bu denemede yanlış yaptığı veya boş
                          bıraktığı konular haftalık programa dahil edilir.
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Çubuğu */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          {step === "review" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-all cursor-pointer"
              >
                Geri / Tekrar Yükle
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveToSystem}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-200"
                >
                  <FiCheck className="text-sm" />
                  <span>Sisteme Kaydet</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
