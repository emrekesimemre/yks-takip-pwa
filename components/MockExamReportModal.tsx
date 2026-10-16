"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSoftTransition } from "@/components/ui/soft-motion";
import { toast } from "sonner";
import type { MockExam } from "@/store/useStudentStore";
import {
  FiPrinter,
  FiX,
  FiDownload,
  FiTrendingUp,
  FiBarChart2,
  FiAward,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { downloadPdfBlob, generateReportPdfBlob } from "@/utils/exportPdf";
import { getDenemeCourseDef } from "@/data/denemeCourses";
import {
  analyzeByCourse,
  calculateCourseNet,
  calculateExamTotalNet,
  calculateExamTotals,
  formatDate,
  getExamTrend,
  getWeakestCourses,
} from "@/utils/deneme";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  grade?: string;
  field?: string;
  target?: string;
  mockExams: MockExam[];
};

export default function MockExamReportModal(props: Readonly<Props>) {
  const { isOpen, onClose } = props;

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? <MockExamReportBody key="mock-exam-report" {...props} /> : null}
    </AnimatePresence>
  );
}

function MockExamReportBody({
  onClose,
  studentName,
  grade,
  field,
  target,
  mockExams = [],
}: Readonly<Props>) {
  const transition = useSoftTransition();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const sortedExams = [...mockExams].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latestExam = sortedExams[0];
  const latestTotals = latestExam ? calculateExamTotals(latestExam) : null;

  const tytExams = mockExams.filter((e) => e.type === "TYT");
  const aytExams = mockExams.filter((e) => e.type === "AYT");
  const tytTrend = getExamTrend(tytExams);
  const aytTrend = getExamTrend(aytExams);
  const courseAnalysis = analyzeByCourse(mockExams);
  const weakestCourses = getWeakestCourses(courseAnalysis);

  const allNets = mockExams.map((e) => calculateExamTotalNet(e));
  const maxNet = allNets.length > 0 ? Math.max(...allNets) : null;
  const avgTotalNet =
    allNets.length > 0
      ? Math.round((allNets.reduce((s, n) => s + n, 0) / allNets.length) * 10) /
        10
      : null;

  const reportDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsProcessingPdf(true);
    toast.info("Deneme raporu PDF olarak hazırlanıyor...");
    try {
      const { blob, file } = await generateReportPdfBlob(
        reportRef.current,
        `${studentName}_Deneme_Raporu`,
      );
      downloadPdfBlob(blob, file.name);
      toast.success("Deneme raporu başarıyla indirildi.");
    } catch (err) {
      console.error("PDF indirme hatası:", err);
      toast.error("PDF oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleWhatsAppSendPdf = async () => {
    if (!reportRef.current) return;

    setIsProcessingPdf(true);
    toast.info("Deneme raporu PDF olarak hazırlanıyor...");

    try {
      const { blob, file } = await generateReportPdfBlob(
        reportRef.current,
        `${studentName}_Deneme_Karnesi`,
      );

      const isMobileDevice =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      const canShareFile =
        isMobileDevice &&
        Boolean(navigator.canShare) &&
        Boolean(navigator.canShare({ files: [file] }));

      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: `${studentName} Deneme Sınavı Raporu`,
          text: `Sayın Velimiz, öğrencimiz ${studentName} için hazırlanan güncel deneme sınavı analiz karnesi ve gelişim raporu PDF olarak ektedir.`,
        });
        toast.success("Rapor paylaşıldı!");
        return;
      }

      downloadPdfBlob(blob, file.name);

      const whatsappUrl = `https://web.whatsapp.com/`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      toast.success(
        "PDF indirildi ve WhatsApp Web açıldı! İndirilen dosyayı ilgili veli sohbetine ekleyerek gönderebilirsiniz.",
        { duration: 8000 },
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("WhatsApp PDF paylaşım hatası:", err);
      toast.error("PDF oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 print:p-0 print:static print:overflow-visible print:block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden cursor-pointer"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={transition}
        className="relative w-full max-w-4xl my-4 sm:my-8 bg-white rounded-2xl shadow-2xl overflow-hidden print:my-0 print:shadow-none print:max-w-none print:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-exam-report-title"
      >
        {/* Üst Başlık ve Aksiyon Araç Çubuğu */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 print:hidden bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                id="mock-exam-report-title"
                className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
              >
                Deneme Sınavı Analiz Raporu & Karnesi
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Öğrencinin son deneme karnesini ve net gelişim grafiklerini PDF
                olarak indirebilir veya WhatsApp ile veliye gönderebilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void handleDownloadPdf()}
                disabled={isProcessingPdf}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                title="Raporu PDF olarak indirin"
              >
                <FiDownload />
                PDF İndir
              </button>
              <button
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                title="Yazdır"
              >
                <FiPrinter />
                Yazdır
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <FiX className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Hızlı Butonlar Çubuğu */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-100 print:hidden flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleWhatsAppSendPdf()}
            disabled={isProcessingPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-sm"
            title="Raporu PDF olarak WhatsApp veya paylaşım menüsüyle gönder"
          >
            <FaWhatsapp className="text-lg shrink-0" />
            <span>
              {isProcessingPdf ? "PDF Hazırlanıyor..." : "WhatsApp'a PDF Gönder"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={isProcessingPdf}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60 shrink-0"
            title="PDF İndir"
          >
            <FiDownload />
            <span>PDF İndir</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
            title="Yazdır"
          >
            <FiPrinter />
            <span>Yazdır</span>
          </button>
        </div>

        {/* Raporun Yazdırılabilir & PDF'e Çevrilebilir Görsel Alanı */}
        <div ref={reportRef} className="p-6 sm:p-8 bg-white text-slate-900">
          {/* Resmi Üst Bilgi Kartı */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Deneme Sınavı Takip & Performans Karnesi
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                  {studentName}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs sm:text-sm text-slate-600">
                  <span>
                    Sınıf:{" "}
                    <strong className="text-slate-800">
                      {grade ? `${grade}. Sınıf` : "—"}
                    </strong>
                    {field ? ` (${field.toUpperCase()})` : ""}
                  </span>
                  <span>
                    Hedef:{" "}
                    <strong className="text-slate-800">
                      {target || "Belirtilmedi"}
                    </strong>
                  </span>
                  <span>
                    Rapor Tarihi:{" "}
                    <strong className="text-slate-800">{reportDate}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Toplam Deneme
                </span>
                <p className="text-3xl font-black text-indigo-600">
                  {mockExams.length}
                </p>
              </div>
            </div>
          </div>

          {/* Özet Metrik Kutuları */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                Son Sınav Neti
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {latestTotals ? latestTotals.net.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                Genel Ortalama Net
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {avgTotalNet !== null ? avgTotalNet.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                En Yüksek Net
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {maxNet !== null ? maxNet.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                En Zayıf Ders
              </span>
              <p className="text-sm font-bold text-rose-600 mt-2 truncate">
                {weakestCourses.length > 0
                  ? weakestCourses[0].courseName
                  : "—"}
              </p>
            </div>
          </div>

          {/* Son Deneme Sınav Karnesi */}
          {latestExam && (
            <div className="mb-8 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-indigo-100 gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider mb-1">
                    <FiAward className="text-xs" />
                    Son Sınav Karnesi
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {latestExam.name || "Deneme Sınavı"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDate(latestExam.date)} ·{" "}
                    <strong className="text-indigo-600">
                      {latestExam.type}
                    </strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white border border-indigo-100 px-4 py-2 text-right shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Sınav Neti
                    </span>
                    <p className="text-2xl font-black text-indigo-700 leading-tight">
                      {calculateExamTotalNet(latestExam).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ders ders döküm tablosu */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-left">
                      <th className="py-2.5 px-3">Ders</th>
                      <th className="py-2.5 px-3 text-center text-emerald-700">
                        Doğru
                      </th>
                      <th className="py-2.5 px-3 text-center text-rose-700">
                        Yanlış
                      </th>
                      <th className="py-2.5 px-3 text-center text-slate-500">
                        Boş
                      </th>
                      <th className="py-2.5 px-3 text-right text-indigo-700 font-extrabold">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latestExam.courses.map((c) => {
                      const net = calculateCourseNet(c);
                      const courseName =
                        getDenemeCourseDef(latestExam.type, c.courseKey)?.name ||
                        c.courseKey;
                      return (
                        <tr
                          key={c.courseKey}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {courseName}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-600">
                            {c.correct}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-rose-600">
                            {c.wrong}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-400">
                            {c.empty ?? 0}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-indigo-600 text-sm">
                            {net.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {latestTotals && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-slate-900">
                        <td className="py-2.5 px-3">TOPLAM</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700 font-black">
                          {latestTotals.correct}
                        </td>
                        <td className="py-2.5 px-3 text-center text-rose-700 font-black">
                          {latestTotals.wrong}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-bold">
                          {latestTotals.empty}
                        </td>
                        <td className="py-2.5 px-3 text-right text-indigo-700 text-base font-black">
                          {latestTotals.net.toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Net Gelişim Çizgi Grafiği */}
          {(tytTrend.length >= 2 || aytTrend.length >= 2) && (
            <div className="mb-8 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="text-lg text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Net Gelişim Trendi
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {tytTrend.length >= 2 && (
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-blue-800 mb-2">
                      TYT Net Gelişimi
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart
                        data={tytTrend}
                        margin={{ top: 8, right: 20, left: -10, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) =>
                            new Date(d).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })
                          }
                          tick={{ fontSize: 10, fill: "#64748b" }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                        <Tooltip
                          formatter={(v) => [`${v} net`, "TYT"]}
                          labelFormatter={(d) => formatDate(String(d))}
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#2563eb" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {aytTrend.length >= 2 && (
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-purple-800 mb-2">
                      AYT Net Gelişimi
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart
                        data={aytTrend}
                        margin={{ top: 8, right: 20, left: -10, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) =>
                            new Date(d).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })
                          }
                          tick={{ fontSize: 10, fill: "#64748b" }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                        <Tooltip
                          formatter={(v) => [`${v} net`, "AYT"]}
                          labelFormatter={(d) => formatDate(String(d))}
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          stroke="#7c3aed"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#7c3aed" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ders Bazlı Ortalama Net Grafiği */}
          {courseAnalysis.length > 0 && (
            <div className="mb-8 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FiBarChart2 className="text-lg text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Ders Bazında Ortalama Netler
                </h3>
              </div>

              <ResponsiveContainer
                width="100%"
                height={Math.max(200, courseAnalysis.length * 30)}
              >
                <BarChart
                  data={courseAnalysis.map((c) => ({
                    name: c.courseName,
                    net: c.avgNet,
                    label: `${c.avgNet.toFixed(1)} net`,
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 60, left: 10, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "#334155" }}
                  />
                  <Tooltip formatter={(v) => [`${v} net`, "Ortalama"]} />
                  <Bar
                    dataKey="net"
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  >
                    <LabelList
                      dataKey="label"
                      position="right"
                      fill="#475569"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* En Zayıf Dersler Alarm Kutusu */}
          {weakestCourses.length > 0 && (
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <h4 className="text-sm font-bold text-amber-900 mb-1.5">
                Geliştirilmesi Gereken Öncelikli Dersler
              </h4>
              <p className="text-xs text-amber-800 mb-3">
                Öğrencinin son denemelerdeki doğru/yanlış oranlarına göre en çok
                net kaybettiği dersler:
              </p>
              <div className="flex flex-wrap gap-2">
                {weakestCourses.map((c) => (
                  <span
                    key={c.courseKey}
                    className="px-3 py-1 bg-white border border-amber-300 rounded-full text-xs font-bold text-amber-900 shadow-2xs"
                  >
                    {c.courseName} (Ort. {c.avgNet.toFixed(1)} net)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Deneme Geçmişi Tablosu */}
          {sortedExams.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Tüm Deneme Sınavları Geçmişi ({sortedExams.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold text-left border-b border-slate-200">
                      <th className="py-2.5 px-3">Tarih</th>
                      <th className="py-2.5 px-3">Sınav Adı</th>
                      <th className="py-2.5 px-3 text-center">Tür</th>
                      <th className="py-2.5 px-3 text-right">Toplam Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedExams.map((exam, i) => (
                      <tr
                        key={exam.id}
                        className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                      >
                        <td className="py-2 px-3 text-slate-600 font-medium">
                          {formatDate(exam.date)}
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-semibold">
                          {exam.name || "Deneme Sınavı"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              exam.type === "TYT"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {exam.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-black text-indigo-600 text-sm">
                          {calculateExamTotalNet(exam).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rapor Alt Bilgi */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>YKS / Lise Takip Sistemi — Deneme Sınavı Karnesi</span>
            <span>{reportDate}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
