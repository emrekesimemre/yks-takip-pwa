"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DropdownPanel } from "@/components/ui/soft-motion";
import {
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiDownload,
  FiPrinter,
} from "react-icons/fi";
import { toast } from "sonner";
import { downloadPdfBlob, generateReportPdfBlob } from "@/utils/exportPdf";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  formatDate,
  formatNet,
  type ExamGroup,
  type ExamRankingEntry,
} from "@/utils/deneme";
import { formatTeacherLabel as formatTeacherLabelDefault } from "@/utils/staff-label";

type RankingsResponse = {
  examGroups: ExamGroup[];
  resultsByGroup: Record<string, ExamRankingEntry[]>;
};

type Props = {
  teacherFilter: string;
  formatTeacherLabel: (email: string) => string;
};

function formatGroupLabel(group: ExamGroup): string {
  return `${group.type} · ${formatDate(group.date)} · ${group.studentCount} öğrenci`;
}

function formatGroupNames(group: ExamGroup): string | null {
  if (group.names.length <= 1) return null;
  return group.names.join(", ");
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
        1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-sm">
        2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
        3
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-500 font-semibold text-sm">
      {rank}
    </span>
  );
}

export default function AdminExamRankings({
  teacherFilter,
  formatTeacherLabel = formatTeacherLabelDefault,
}: Props) {
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const dateSelectRef = useRef<HTMLDivElement>(null);
  const groupSelectRef = useRef<HTMLDivElement>(null);
  const printRankingsRef = useRef<HTMLDivElement>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadRankingPdf = async () => {
    if (!printRankingsRef.current || !selectedGroup) return;
    setIsProcessingPdf(true);
    toast.info("Sıralama listesi PDF olarak hazırlanıyor...");
    try {
      const examLabel = `${selectedGroup.type}_${selectedGroup.date}`;
      const { blob, file } = await generateReportPdfBlob(
        printRankingsRef.current,
        `Deneme_Siralama_${examLabel}`,
      );
      downloadPdfBlob(blob, file.name);
      toast.success("Sıralama listesi PDF olarak indirildi.");
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      toast.error("PDF oluşturulurken bir hata oluştu.");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch("/api/admin/exam-rankings");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Deneme sıralaması yüklenemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dateSelectRef.current &&
        !dateSelectRef.current.contains(event.target as Node)
      ) {
        setIsDateOpen(false);
      }

      if (
        groupSelectRef.current &&
        !groupSelectRef.current.contains(event.target as Node)
      ) {
        setIsGroupOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableDates = useMemo(() => {
    if (!data) return [];

    return [...new Set(data.examGroups.map((group) => group.date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];

    return data.examGroups.filter(
      (group) => dateFilter === "all" || group.date === dateFilter,
    );
  }, [data, dateFilter]);

  const activeGroupKey = useMemo(() => {
    if (filteredGroups.length === 0) return "";

    const stillValid = filteredGroups.some(
      (group) => group.key === selectedGroupKey,
    );

    return stillValid ? selectedGroupKey : filteredGroups[0].key;
  }, [filteredGroups, selectedGroupKey]);

  const dateOptions = useMemo(
    () => [
      { value: "all", label: "Tüm tarihler" },
      ...availableDates.map((date) => ({
        value: date,
        label: formatDate(date),
      })),
    ],
    [availableDates],
  );

  const selectedDateLabel =
    dateOptions.find((option) => option.value === dateFilter)?.label ??
    "Tarih seçin";

  const selectedGroup = filteredGroups.find(
    (group) => group.key === activeGroupKey,
  );

  const showExamNames = selectedGroup != null && selectedGroup.names.length > 1;

  const rankings = useMemo(() => {
    if (!data || !activeGroupKey) return [];

    const allRankings = data.resultsByGroup[activeGroupKey] ?? [];

    if (teacherFilter === "all") return allRankings;

    const filtered = allRankings.filter(
      (entry) => entry.teacherEmail === teacherFilter,
    );

    let currentRank = 1;

    return filtered.map((entry, index) => {
      if (index > 0 && entry.net < filtered[index - 1].net) {
        currentRank = index + 1;
      }

      return { ...entry, rank: currentRank };
    });
  }, [data, activeGroupKey, teacherFilter]);

  const stats = useMemo(() => {
    if (rankings.length === 0) {
      return { average: null, highest: null, lowest: null };
    }

    const nets = rankings.map((entry) => entry.net);

    return {
      average:
        Math.round(
          (nets.reduce((sum, net) => sum + net, 0) / nets.length) * 100,
        ) / 100,
      highest: Math.max(...nets),
      lowest: Math.min(...nets),
    };
  }, [rankings]);

  if (isLoading) {
    return (
      <div className="card-premium p-8">
        <LoadingSpinner label="Deneme sıralaması yükleniyor..." />
      </div>
    );
  }

  if (!data || data.examGroups.length === 0) {
    return (
      <section className="card-premium p-8 text-center border border-slate-100">
        <FiBarChart2 className="mx-auto text-3xl text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">
          Henüz sıralanacak deneme kaydı bulunmuyor.
        </p>
      </section>
    );
  }

  return (
    <section className="card-premium overflow-hidden border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <p className="text-sm text-slate-500">
          Aynı tarih ve tipteki (TYT/AYT) denemelere giren öğrenciler birlikte
          sıralanır. Farklı yazılmış deneme isimleri otomatik birleştirilir.
        </p>
      </div>

      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div ref={dateSelectRef} className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tarih
            </label>
            <button
              type="button"
              onClick={() => {
                setIsDateOpen((open) => !open);
                setIsGroupOpen(false);
              }}
              className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-base font-medium text-slate-800 shadow-sm hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={isDateOpen}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <FiCalendar className="text-lg text-violet-600" />
                </span>
                <span className="min-w-0 truncate">{selectedDateLabel}</span>
              </span>
              <FiChevronDown
                className={`text-xl text-slate-400 shrink-0 transition-transform ${
                  isDateOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPanel
              open={isDateOpen}
              className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
            >
              <ul role="listbox" className="max-h-72 overflow-y-auto py-2">
                {dateOptions.map((option) => {
                  const isSelected = option.value === dateFilter;

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setDateFilter(option.value);
                          setIsDateOpen(false);
                        }}
                        className={`w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-violet-50 text-violet-800"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <span className="min-w-0 truncate text-base font-medium">
                          {option.label}
                        </span>
                        {isSelected && (
                          <FiCheck className="text-lg text-violet-600 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </DropdownPanel>
          </div>

          <div ref={groupSelectRef} className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Deneme
            </label>
            <button
              type="button"
              onClick={() => {
                setIsGroupOpen((open) => !open);
                setIsDateOpen(false);
              }}
              disabled={filteredGroups.length === 0}
              className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-base font-medium text-slate-800 shadow-sm hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-haspopup="listbox"
              aria-expanded={isGroupOpen}
            >
              <span className="min-w-0 truncate">
                {selectedGroup
                  ? formatGroupLabel(selectedGroup)
                  : "Deneme seçin"}
              </span>
              <FiChevronDown
                className={`text-xl text-slate-400 shrink-0 transition-transform ${
                  isGroupOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPanel
              open={isGroupOpen && filteredGroups.length > 0}
              className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
            >
              <ul role="listbox" className="max-h-72 overflow-y-auto py-2">
                {filteredGroups.map((group) => {
                  const isSelected = group.key === activeGroupKey;

                  return (
                    <li key={group.key}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedGroupKey(group.key);
                          setIsGroupOpen(false);
                        }}
                        className={`w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-violet-50 text-violet-800"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-base font-medium truncate">
                            {group.type} · {formatDate(group.date)}
                          </span>
                          <span className="block text-xs text-slate-400 mt-0.5">
                            {group.studentCount} öğrenci
                            {formatGroupNames(group)
                              ? ` · İsimler: ${formatGroupNames(group)}`
                              : group.names[0]
                                ? ` · ${group.names[0]}`
                                : ""}
                          </span>
                        </span>
                        {isSelected && (
                          <FiCheck className="text-lg text-violet-600 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </DropdownPanel>
          </div>
        </div>
      </div>

      {selectedGroup && formatGroupNames(selectedGroup) && (
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/60">
          <p className="text-xs text-amber-800">
            Bu deneme farklı isimlerle kaydedilmiş:{" "}
            <span className="font-medium">
              {formatGroupNames(selectedGroup)}
            </span>
          </p>
        </div>
      )}

      {selectedGroup && rankings.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sınav Sonuçları & Kurum Sıralaması
              </span>
              <p className="text-xs text-slate-400">
                {rankings.length} öğrencinin sonuçları listeleniyor
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDownloadRankingPdf()}
                disabled={isProcessingPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-violet-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                title="Sıralama listesini resmi PDF olarak indir"
              >
                <FiDownload />
                <span>
                  {isProcessingPdf
                    ? "PDF Hazırlanıyor..."
                    : "Sıralama Listesini İndir (PDF)"}
                </span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                title="Yazdır"
              >
                <FiPrinter />
                <span>Yazdır</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">Ortalama Net</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {stats.average !== null ? formatNet(stats.average) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">En Yüksek</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {stats.highest !== null ? formatNet(stats.highest) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">En Düşük</p>
              <p className="text-xl font-bold text-slate-700 mt-1">
                {stats.lowest !== null ? formatNet(stats.lowest) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Seçilen tarihte deneme bulunamadı.
        </div>
      ) : rankings.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Bu deneme için seçili filtreye uygun öğrenci bulunamadı.
        </div>
      ) : (
        <div ref={printRankingsRef} className="bg-white p-4 sm:p-6 print:p-0">
          {/* Resmi PDF / Yazdırma Belge Başlığı */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Kurum Deneme Sınavı Sıralama ve Sonuç Belgesi
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {selectedGroup
                    ? `${selectedGroup.type} Deneme Sınavı`
                    : "Deneme Sıralaması"}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
                  <span>
                    Sınav Tarihi:{" "}
                    <strong>
                      {selectedGroup ? formatDate(selectedGroup.date) : "—"}
                    </strong>
                  </span>
                  {selectedGroup && formatGroupNames(selectedGroup) && (
                    <span>
                      Sınav Adı:{" "}
                      <strong>{formatGroupNames(selectedGroup)}</strong>
                    </span>
                  )}
                  {teacherFilter !== "all" && (
                    <span>
                      Öğretmen:{" "}
                      <strong>{formatTeacherLabel(teacherFilter)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {stats.average !== null && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Katılım
                    </span>
                    <p className="text-base font-extrabold text-slate-800">
                      {rankings.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-center">
                    <span className="text-[10px] text-violet-600 uppercase font-semibold">
                      Kurum Ort.
                    </span>
                    <p className="text-base font-extrabold text-violet-700">
                      {stats.average !== null ? formatNet(stats.average) : "—"} net
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-700 bg-slate-100/90 border-b border-slate-200">
                  <th className="px-5 py-3 w-16">Sıra</th>
                  <th className="px-5 py-3">Öğrenci</th>
                  {showExamNames && <th className="px-5 py-3">Kayıtlı İsim</th>}
                  <th className="px-5 py-3">Öğretmen</th>
                  <th className="px-5 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankings.map((entry, index) => (
                  <motion.tr
                    key={entry.studentId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        {entry.studentName}
                      </span>
                    </td>
                    {showExamNames && (
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {entry.examName}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      {entry.teacherEmail ? (
                        <>
                          <div className="text-sm text-slate-600">
                            {formatTeacherLabel(entry.teacherEmail)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {entry.teacherEmail}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400">—</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold ${
                          entry.rank === 1
                            ? "bg-emerald-50 text-emerald-700"
                            : entry.rank <= 3
                              ? "bg-violet-50 text-violet-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatNet(entry.net)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>Kurum İçi Deneme Sınavı Değerlendirme Belgesi</span>
            <span>
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
