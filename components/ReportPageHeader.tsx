"use client";

import { FiPrinter, FiCheckCircle } from "react-icons/fi";
import { BrandIconMark } from "@/lib/brand-icon";

type Props = {
  studentName: string;
  grade?: string;
  field?: string;
};

export default function ReportPageHeader({
  studentName,
  grade,
  field,
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  const gradeLabel =
    grade === "9"
      ? "9. Sınıf"
      : grade === "10"
        ? "10. Sınıf"
        : grade === "11"
          ? "11. Sınıf"
          : grade === "mezun"
            ? "Mezun"
            : "12. Sınıf (YKS)";

  const fieldLabel =
    field === "sayisal"
      ? "Sayısal"
      : field === "esit-agirlik"
        ? "Eşit Ağırlık"
        : field === "sozel"
          ? "Sözel"
          : field === "dil"
            ? "Dil"
            : "";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            <BrandIconMark size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base leading-tight">
                {studentName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <FiCheckCircle className="text-emerald-500" />
                Veli Raporu
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {gradeLabel}
              {fieldLabel ? ` • ${fieldLabel}` : ""} • Güncel Gelişim ve Takip Raporu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <FiPrinter className="text-base" />
            PDF Olarak İndir / Yazdır
          </button>
        </div>
      </div>
    </header>
  );
}
