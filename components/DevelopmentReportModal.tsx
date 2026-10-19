"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSoftTransition } from "@/components/ui/soft-motion";
import { toast } from "sonner";
import type {
  CourseSolvedQuestions,
  MockExam,
  SchoolExamEntry,
  TopicProgress,
} from "@/store/useStudentStore";
import DevelopmentReportView from "@/components/DevelopmentReportView";
import {
  FiMail,
  FiPrinter,
  FiX,
  FiCopy,
  FiCheck,
  FiDownload,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { downloadPdfBlob, generateReportPdfBlob } from "@/utils/exportPdf";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName: string;
  grade?: string;
  field?: string;
  target?: string;
  parentEmail?: string;
  reportToken?: string;
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
  mockExams?: MockExam[];
  schoolGrades?: SchoolExamEntry[];
  onParentEmailSaved?: (parentEmail: string) => void;
  onReportTokenSaved?: (reportToken: string) => void;
};

export default function DevelopmentReportModal(props: Readonly<Props>) {
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
      {isOpen ? (
        <DevelopmentReportBody key="development-report" {...props} />
      ) : null}
    </AnimatePresence>
  );
}

function DevelopmentReportBody({
  onClose,
  studentId,
  studentName,
  grade,
  field,
  target,
  parentEmail = "",
  reportToken = "",
  topics,
  solvedQuestionsByCourse,
  solvedQuestionsByTopic,
  mockExams = [],
  schoolGrades = [],
  onParentEmailSaved,
  onReportTokenSaved,
}: Readonly<Props>) {
  const transition = useSoftTransition();
  const reportRef = useRef<HTMLDivElement>(null);
  const [emailInput, setEmailInput] = useState(parentEmail);
  const [activeToken, setActiveToken] = useState(reportToken);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsProcessingPdf(true);
    toast.info("PDF hazırlanıyor, lütfen bekleyin...");
    try {
      const { blob, file } = await generateReportPdfBlob(
        reportRef.current,
        studentName,
      );
      downloadPdfBlob(blob, file.name);
      toast.success("PDF başarıyla indirildi.");
    } catch (err) {
      console.error("PDF indirme hatası:", err);
      toast.error("PDF oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const getOrGenerateToken = async (): Promise<string> => {
    if (activeToken) return activeToken;
    const newToken = crypto.randomUUID();
    setActiveToken(newToken);
    if (studentId) {
      await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportToken: newToken }),
      });
      onReportTokenSaved?.(newToken);
    }
    return newToken;
  };

  const getReportUrl = (tokenVal: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/report/${studentId}?token=${tokenVal}`;
  };

  const handleWhatsAppSendPdf = async () => {
    if (!reportRef.current) return;

    setIsProcessingPdf(true);
    toast.info("PDF raporu oluşturuluyor...");

    try {
      // 1. PDF Dosyasını oluştur
      const { blob, file } = await generateReportPdfBlob(
        reportRef.current,
        studentName,
      );

      // 2. Mobil Cihaz / PWA (iPhone / Android) -> Doğrudan WhatsApp paylaşım menüsünü açar
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
          title: `${studentName} Gelişim Raporu`,
          text: `Sayın Velimiz, öğrencimiz ${studentName} için hazırlanan güncel gelişim raporu PDF olarak ektedir.`,
        });
        toast.success("Rapor WhatsApp ile paylaşıldı!");
        return;
      }

      // 3. Bilgisayar (Mac / Windows): PDF'i bilgisayara indir + WhatsApp'ı aç
      downloadPdfBlob(blob, file.name);

      const whatsappUrl = `https://web.whatsapp.com/`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      toast.success(
        "PDF indirildi ve WhatsApp Web açıldı! İndirilen dosyayı sohbete sürükleyip veya ataç simgesinden ekleyerek gönderebilirsiniz.",
        { duration: 8000 },
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Kullanıcı paylaşım menüsünü kapattı
      }
      console.error("WhatsApp PDF paylaşım hatası:", err);
      toast.error("PDF oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleCopyLink = async () => {
    if (!studentId) return;
    try {
      const currentToken = await getOrGenerateToken();
      const reportUrl = getReportUrl(currentToken);
      await navigator.clipboard.writeText(reportUrl);
      setCopiedLink(true);
      toast.success("Rapor bağlantısı panoya kopyalandı!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Bağlantı kopyalanamadı.");
    }
  };

  const handleSendEmail = async () => {
    if (!studentId) return;
    const trimmed = emailInput.trim();
    if (!trimmed) {
      toast.error("Veli e-postası girin.");
      return;
    }

    setIsSendingEmail(true);
    try {
      if (trimmed.toLowerCase() !== parentEmail.trim().toLowerCase()) {
        const patchRes = await fetch(`/api/students/${studentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentEmail: trimmed }),
        });
        const patchBody = await patchRes.json();
        if (!patchRes.ok) {
          throw new Error(patchBody.error || "Veli e-postası kaydedilemedi.");
        }
        onParentEmailSaved?.(patchBody.parentEmail ?? trimmed.toLowerCase());
      }

      const res = await fetch(`/api/students/${studentId}/report-email`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Mail gönderilemedi.");
      }
      toast.success("Gelişim raporu veliye gönderildi.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mail gönderilemedi.",
      );
    } finally {
      setIsSendingEmail(false);
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
        aria-labelledby="development-report-title"
      >
        {/* Üst Başlık Bölümü (Mobilde Ferah, Başlık ve Açıklama Sıkışmaz) */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 print:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                id="development-report-title"
                className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
              >
                Gelişim Raporu (Veli Raporu)
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Raporu PDF olarak indirebilir veya veliye WhatsApp / e-posta ile
                gönderebilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void handleDownloadPdf()}
                disabled={isProcessingPdf}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                title="Raporu PDF dosyası olarak bilgisayarınıza indirin"
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

        {studentId ? (
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 border-b border-slate-100 print:hidden space-y-3">
            {/* Paylaşım & İndirme Butonları (Mobilde Tam Görünür, Asla Taşmaz) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleWhatsAppSendPdf()}
                disabled={isProcessingPdf}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                title="Raporu PDF dosyası olarak WhatsApp veya diğer uygulamalarla paylaş"
              >
                <FaWhatsapp className="text-lg shrink-0" />
                <span>
                  {isProcessingPdf ? "PDF Hazırlanıyor..." : "WhatsApp'a PDF Gönder"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-sm font-medium rounded-xl hover:bg-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
                title="Web raporu bağlantısını kopyala"
              >
                {copiedLink ? (
                  <>
                    <FiCheck className="text-emerald-600 text-base" />
                    <span className="text-emerald-700 text-xs sm:text-sm font-medium">
                      Kopyalandı
                    </span>
                  </>
                ) : (
                  <>
                    <FiCopy className="text-slate-500 text-base" />
                    <span className="text-xs sm:text-sm">Linki Kopyala</span>
                  </>
                )}
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

            {/* E-posta Gönderim Satırı */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-200/60">
              <input
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="Veli E-postası (ornek@gmail.com)"
                className="input-premium flex-1 w-full text-sm py-2"
                aria-label="Veli e-postası"
              />
              <button
                type="button"
                onClick={() => void handleSendEmail()}
                disabled={isSendingEmail}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-60 shrink-0 cursor-pointer shadow-sm"
              >
                <FiMail />
                {isSendingEmail ? "Gönderiliyor..." : "E-posta Gönder"}
              </button>
            </div>
          </div>
        ) : null}

        <div ref={reportRef} className="bg-white">
          <DevelopmentReportView
            studentName={studentName}
            grade={grade}
            field={field}
            target={target}
            topics={topics}
            solvedQuestionsByCourse={solvedQuestionsByCourse}
            solvedQuestionsByTopic={solvedQuestionsByTopic}
            mockExams={mockExams}
            schoolGrades={schoolGrades}
          />
        </div>
      </motion.div>
    </div>
  );
}
