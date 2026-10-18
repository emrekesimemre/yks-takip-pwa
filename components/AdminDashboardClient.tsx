"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageTransition from "@/components/ui/PageTransition";
import TeacherFilterSelect from "@/components/TeacherFilterSelect";
import AdminExamRankings from "@/components/AdminExamRankings";
import {
  FiUsers,
  FiUserCheck,
  FiTrendingUp,
  FiSearch,
  FiTarget,
  FiBookOpen,
  FiBarChart2,
  FiShield,
  FiDownload,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { toast } from "sonner";
import AdminStaffPanel from "@/components/AdminStaffPanel";
import { formatTeacherLabel } from "@/utils/staff-label";
import { formatNet } from "@/utils/deneme";

type AdminTab = "overview" | "exams" | "staff";

type StudentOverview = {
  _id: string;
  name: string;
  target: string;
  teacherEmail: string;
  progress: number;
  weeklyTopicCount: number;
  totalSolvedQuestions: number;
  weeklySolvedQuestions: number;
  mockExamCount: number;
  latestMockExamNet: number | null;
  updatedAt: string | null;
};

type TeacherProfile = {
  email: string;
  name: string;
};

type OverviewResponse = {
  summary: {
    totalStudents: number;
    totalTeachers: number;
    averageProgress: number;
    truncated?: boolean;
  };
  teachers: TeacherProfile[];
  students: StudentOverview[];
};

function readTeachers(value: unknown): TeacherProfile[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [{ email: item, name: "" }];
    if (
      item &&
      typeof item === "object" &&
      "email" in item &&
      typeof item.email === "string"
    ) {
      const name =
        "name" in item && typeof item.name === "string" ? item.name : "";
      return [{ email: item.email, name }];
    }
    return [];
  });
}

const tabs: {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: typeof FiUsers;
}[] = [
  { id: "overview", label: "Genel Durum", shortLabel: "Genel", icon: FiUsers },
  { id: "exams", label: "Deneme", shortLabel: "Deneme", icon: FiBarChart2 },
  { id: "staff", label: "Personel", shortLabel: "Personel", icon: FiShield },
];

const tabDescriptions: Record<AdminTab, string> = {
  overview: "Tüm öğretmenlerin öğrencilerinin özet durumu",
  exams: "Denemelere göre öğrenci sıralaması ve net karşılaştırması",
  staff: "Öğretmen ve yönetici hesaplarını buradan ekleyin",
};

function csvCell(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadStudentsCsv(
  students: StudentOverview[],
  formatTeacher: (email: string) => string,
  teacherName?: string,
) {
  if (!students || students.length === 0) {
    toast.error("İndirilecek öğrenci bulunamadı.");
    return;
  }

  try {
    const header = [
      "Ad",
      "Öğretmen",
      "Hedef",
      "İlerleme (%)",
      "Haftalık Konu",
      "Toplam Soru",
      "Deneme Sayısı",
      "Son Net",
      "Son Güncelleme",
    ];

    const rows = students.map((student) => [
      csvCell(student.name),
      csvCell(formatTeacher(student.teacherEmail)),
      csvCell(student.target),
      csvCell(student.progress),
      csvCell(student.weeklyTopicCount),
      csvCell(student.totalSolvedQuestions),
      csvCell(student.mockExamCount),
      csvCell(
        student.latestMockExamNet == null
          ? ""
          : formatNet(student.latestMockExamNet),
      ),
      csvCell(
        student.updatedAt
          ? new Date(student.updatedAt).toLocaleDateString("tr-TR")
          : "",
      ),
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    const safeTeacher = teacherName
      ? `-${teacherName
          .toLowerCase()
          .replace(/[^a-z0-9ğüşıöç]/gi, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")}`
      : "";
    const fileName = `yks-takip-ogrenciler${safeTeacher}-${stamp}.csv`;

    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);

    toast.success("Öğrenci listesi CSV olarak indirildi.");
  } catch (error) {
    console.error("CSV indirme hatası:", error);
    toast.error("Öğrenci listesi indirilirken bir hata oluştu.");
  }
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 progress-bar h-2">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-10 text-right">
        %{value}
      </span>
    </div>
  );
}

type AdminDashboardClientProps = {
  canManageStaff: boolean;
};

export default function AdminDashboardClient({
  canManageStaff,
}: Readonly<AdminDashboardClientProps>) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const visibleTabs = canManageStaff
    ? tabs
    : tabs.filter((tab) => tab.id !== "staff");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");

  useEffect(() => {
    if (activeTab === "staff") return;
    const controller = new AbortController();

    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/admin/overview", {
          signal: controller.signal,
        });
        if (res.ok) {
          const body = await res.json();
          setData({ ...body, teachers: readTeachers(body.teachers) });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Admin overview yüklenemedi:", error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchOverview();
    return () => controller.abort();
  }, [activeTab]);

  const teacherNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const teacher of data?.teachers ?? []) {
      if (teacher.email) map.set(teacher.email, teacher.name);
    }
    return map;
  }, [data]);

  const labelFor = useCallback(
    (email: string) => formatTeacherLabel(email, teacherNames.get(email)),
    [teacherNames],
  );

  const teachers = useMemo(() => {
    if (!data) return [];
    const emails = new Set(data.teachers.map((teacher) => teacher.email));
    for (const student of data.students) {
      if (student.teacherEmail) emails.add(student.teacherEmail);
    }
    return [...emails].sort((a, b) =>
      labelFor(a).localeCompare(labelFor(b), "tr"),
    );
  }, [data, labelFor]);

  const teacherOptions = useMemo(() => {
    return [
      { value: "all", label: "Tüm öğretmenler" },
      ...teachers.map((email) => ({
        value: email,
        label: labelFor(email),
        description: email,
      })),
    ];
  }, [teachers, labelFor]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];

    const query = search.trim().toLowerCase();

    return data.students.filter((student) => {
      const matchesTeacher =
        teacherFilter === "all" || student.teacherEmail === teacherFilter;
      const matchesSearch =
        query.length === 0 ||
        student.name.toLowerCase().includes(query) ||
        student.target.toLowerCase().includes(query) ||
        student.teacherEmail.toLowerCase().includes(query) ||
        labelFor(student.teacherEmail).toLowerCase().includes(query);

      return matchesTeacher && matchesSearch;
    });
  }, [data, search, teacherFilter, labelFor]);

  const groupedByTeacher = useMemo(() => {
    const groups = new Map<string, StudentOverview[]>();

    filteredStudents.forEach((student) => {
      const existing = groups.get(student.teacherEmail) ?? [];
      existing.push(student);
      groups.set(student.teacherEmail, existing);
    });

    return [...groups.entries()].sort(([a], [b]) =>
      labelFor(a).localeCompare(labelFor(b), "tr"),
    );
  }, [filteredStudents, labelFor]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Yönetici Paneli
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {tabDescriptions[activeTab]}
        </p>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="relative flex border-b border-slate-100">
          {visibleTabs.map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                activeTab === id
                  ? "text-violet-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/80"
              }`}
            >
              <Icon className="text-base" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
              {activeTab === id && (
                <motion.div
                  layoutId="adminActiveTab"
                  className="tab-indicator left-0 right-0 bg-violet-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6"
          >
            {activeTab === "overview" && (
              <OverviewTabContent
                data={data}
                isLoading={isLoading}
                search={search}
                onSearchChange={setSearch}
                teacherFilter={teacherFilter}
                teacherOptions={teacherOptions}
                onTeacherFilterChange={setTeacherFilter}
                filteredStudents={filteredStudents}
                groupedByTeacher={groupedByTeacher}
                formatTeacherLabel={labelFor}
              />
            )}
            {activeTab === "exams" && (
              <ExamsTabContent
                teacherFilter={teacherFilter}
                teacherOptions={teacherOptions}
                onTeacherFilterChange={setTeacherFilter}
                formatTeacherLabel={labelFor}
              />
            )}
            {canManageStaff && activeTab === "staff" && <AdminStaffPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

type OverviewTabContentProps = {
  data: OverviewResponse | null;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  teacherFilter: string;
  teacherOptions: { value: string; label: string; description?: string }[];
  onTeacherFilterChange: (value: string) => void;
  filteredStudents: StudentOverview[];
  groupedByTeacher: [string, StudentOverview[]][];
  formatTeacherLabel: (email: string) => string;
};

function OverviewTabContent({
  data,
  isLoading,
  search,
  onSearchChange,
  teacherFilter,
  teacherOptions,
  onTeacherFilterChange,
  filteredStudents,
  groupedByTeacher,
  formatTeacherLabel,
}: OverviewTabContentProps) {
  if (isLoading) {
    return <LoadingSpinner label="Genel durum yükleniyor..." />;
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">
          Veriler yüklenemedi. Lütfen sayfayı yenileyin.
        </p>
      </div>
    );
  }

  const { summary } = data;
  const selectedTeacherIsEmpty =
    teacherFilter !== "all" &&
    search.trim().length === 0 &&
    filteredStudents.length === 0;
  const groupsToShow: [string, StudentOverview[]][] = selectedTeacherIsEmpty
    ? [[teacherFilter, []]]
    : groupedByTeacher;

  // Akordiyon durum yönetimi:
  // Varsayılan olarak 2 veya daha az öğretmen grubu varsa hepsi açık,
  // 2'den fazla ise ilk öğretmen açık, diğerleri kapalı başlar.
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(() => {
    if (groupsToShow.length <= 2) {
      return new Set(groupsToShow.map(([email]) => email));
    }
    return new Set(groupsToShow.slice(0, 1).map(([email]) => email));
  });

  const isSearchActive = search.trim().length > 0;

  // Arama yapılırken veya öğretmen filtresi seçilmişken ilgili kartlar otomatik açık gelir
  const isTeacherExpanded = (email: string) => {
    if (isSearchActive || teacherFilter !== "all") return true;
    return expandedTeachers.has(email);
  };

  const toggleTeacher = (email: string) => {
    setExpandedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const allExpanded =
    groupsToShow.length > 0 &&
    groupsToShow.every(([email]) => isTeacherExpanded(email));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedTeachers(new Set());
    } else {
      setExpandedTeachers(new Set(groupsToShow.map(([email]) => email)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            downloadStudentsCsv(
              filteredStudents,
              formatTeacherLabel,
              teacherFilter !== "all"
                ? formatTeacherLabel(teacherFilter)
                : undefined,
            )
          }
          disabled={filteredStudents.length === 0}
          title={
            teacherFilter !== "all"
              ? `${formatTeacherLabel(teacherFilter)} öğretmeninin öğrencilerini CSV olarak indirir`
              : "Tüm öğretmenlerin öğrencilerini CSV olarak indirir"
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-violet-50 hover:text-violet-700 border border-slate-200 hover:border-violet-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <FiDownload />
          <span>
            {teacherFilter !== "all"
              ? `${formatTeacherLabel(teacherFilter)} Öğrencilerini İndir (${filteredStudents.length})`
              : `Tüm Öğrencileri İndir (${filteredStudents.length})`}
          </span>
        </button>
      </div>
      {summary.truncated && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Öğrenci listesi üst limite ulaştığı için kısaltıldı.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <FiUsers className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Toplam Öğrenci
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <FiUserCheck className="text-xl text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Toplam Öğretmen
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.totalTeachers}
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FiTrendingUp className="text-xl text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Ortalama İlerleme
              </p>
              <p className="text-2xl font-bold text-slate-900">
                %{summary.averageProgress}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium p-4 sm:p-5 border border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <label
              htmlFor="admin-search"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Arama
            </label>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                id="admin-search"
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Öğrenci, hedef veya öğretmen ara..."
                className="w-full min-h-[52px] pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-base bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
            </div>
          </div>

          <TeacherFilterSelect
            value={teacherFilter}
            options={teacherOptions}
            onChange={onTeacherFilterChange}
          />
        </div>
      </div>

      {groupsToShow.length === 0 ? (
        <div className="card-premium p-12 text-center border border-slate-100">
          <p className="text-slate-600">Gösterilecek öğrenci bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Akordiyon Üst Kontrol Çubuğu */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {groupsToShow.length} Öğretmen Grubu
            </span>
            {!isSearchActive &&
              teacherFilter === "all" &&
              groupsToShow.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {allExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  <span>
                    {allExpanded ? "Tümünü Daralt" : "Tümünü Genişlet"}
                  </span>
                </button>
              )}
          </div>

          {groupsToShow.map(([teacherEmail, students]) => {
            const isExpanded = isTeacherExpanded(teacherEmail);
            const avgProgress =
              students.length > 0
                ? Math.round(
                    students.reduce((sum, s) => sum + (s.progress || 0), 0) /
                      students.length,
                  )
                : 0;
            const totalSolved = students.reduce(
              (sum, s) => sum + (s.totalSolvedQuestions || 0),
              0,
            );

            return (
              <section
                key={teacherEmail}
                className="card-premium overflow-hidden border border-slate-100 transition-shadow duration-200 hover:shadow-md"
              >
                {/* Tıklanabilir Akordiyon Başlığı */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTeacher(teacherEmail)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleTeacher(teacherEmail);
                    }
                  }}
                  className="w-full text-left px-5 py-4 bg-slate-50/80 hover:bg-slate-100/70 transition-colors cursor-pointer select-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <FiChevronDown className="text-base" />
                    </div>
                    <div className="min-w-0">
                      {teacherEmail ? (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                            Öğretmen
                          </p>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {formatTeacherLabel(teacherEmail)}
                          </h2>
                          <p className="text-xs text-slate-500 truncate">
                            {teacherEmail}
                          </p>
                        </>
                      ) : (
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          Öğrenciler
                        </h2>
                      )}
                    </div>
                  </div>

                  {/* Özet Rozetler ve Doğrudan İndirme Butonu */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 font-semibold">
                      {students.length} öğrenci
                    </span>
                    {students.length > 0 && (
                      <>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Ort. %{avgProgress} ilerleme
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 hidden sm:inline-flex">
                          {totalSolved.toLocaleString("tr-TR")} soru
                        </span>
                      </>
                    )}

                    {students.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadStudentsCsv(
                            students,
                            formatTeacherLabel,
                            teacherEmail
                              ? formatTeacherLabel(teacherEmail)
                              : undefined,
                          );
                        }}
                        title={`${formatTeacherLabel(teacherEmail)} öğretmeninin öğrencilerini CSV olarak indir`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer ml-1"
                      >
                        <FiDownload className="text-xs" />
                        <span>İndir</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Katlanabilir Tablo Alanı */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="accordion-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                          <thead>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                              <th className="px-5 py-3">Öğrenci</th>
                              <th className="px-5 py-3">Hedef</th>
                              <th className="px-5 py-3">Konu İlerlemesi</th>
                              <th className="px-5 py-3">Haftalık Plan</th>
                              <th className="px-5 py-3">Çözülen Soru</th>
                              <th className="px-5 py-3">Deneme</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-5 py-10 text-center text-sm text-slate-500"
                                >
                                  Bu öğretmenin öğrencisi yok.
                                </td>
                              </tr>
                            ) : (
                              students.map((student) => (
                                <tr
                                  key={student._id}
                                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                                >
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                                        {student.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-semibold text-slate-800">
                                        {student.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                      <FiTarget className="text-blue-400 shrink-0" />
                                      {student.target || "—"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <ProgressBar value={student.progress} />
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="text-sm text-slate-700">
                                      <span className="inline-flex items-center gap-1.5">
                                        <FiBookOpen className="text-slate-400" />
                                        {student.weeklyTopicCount} konu
                                      </span>
                                      <p className="text-xs text-slate-400 mt-1">
                                        {student.weeklySolvedQuestions} soru
                                        (haftalık)
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="text-sm font-medium text-slate-700">
                                      {student.totalSolvedQuestions.toLocaleString(
                                        "tr-TR",
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="text-sm text-slate-700">
                                      <span className="inline-flex items-center gap-1.5">
                                        <FiBarChart2 className="text-slate-400" />
                                        {student.mockExamCount} deneme
                                      </span>
                                      {student.latestMockExamNet !== null && (
                                        <p className="text-xs text-emerald-600 font-medium mt-1">
                                          Son:{" "}
                                          {formatNet(student.latestMockExamNet)}{" "}
                                          net
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ExamsTabContentProps = {
  teacherFilter: string;
  teacherOptions: { value: string; label: string; description?: string }[];
  onTeacherFilterChange: (value: string) => void;
  formatTeacherLabel: (email: string) => string;
};

function ExamsTabContent({
  teacherFilter,
  teacherOptions,
  onTeacherFilterChange,
  formatTeacherLabel,
}: ExamsTabContentProps) {
  return (
    <div className="space-y-6">
      <div className="card-premium p-4 sm:p-5 border border-slate-100">
        <TeacherFilterSelect
          value={teacherFilter}
          options={teacherOptions}
          onChange={onTeacherFilterChange}
        />
      </div>

      <AdminExamRankings
        teacherFilter={teacherFilter}
        formatTeacherLabel={formatTeacherLabel}
      />
    </div>
  );
}
