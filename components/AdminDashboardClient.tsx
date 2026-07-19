"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";

type AdminTab = "overview" | "exams";

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

type OverviewResponse = {
  summary: {
    totalStudents: number;
    totalTeachers: number;
    averageProgress: number;
  };
  students: StudentOverview[];
};

const tabs: { id: AdminTab; label: string; icon: typeof FiUsers }[] = [
  { id: "overview", label: "Genel Durum", icon: FiUsers },
  { id: "exams", label: "Deneme", icon: FiBarChart2 },
];

const tabDescriptions: Record<AdminTab, string> = {
  overview: "Tüm öğretmenlerin öğrencilerinin özet durumu",
  exams: "Denemelere göre öğrenci sıralaması ve net karşılaştırması",
};

function formatTeacherLabel(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  return localPart.replace(/\./g, " ");
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

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/admin/overview");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Admin overview yüklenemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const teachers = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.students.map((s) => s.teacherEmail))].sort();
  }, [data]);

  const teacherOptions = useMemo(() => {
    return [
      { value: "all", label: "Tüm öğretmenler" },
      ...teachers.map((email) => ({
        value: email,
        label: formatTeacherLabel(email),
        description: email,
      })),
    ];
  }, [teachers]);

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
        student.teacherEmail.toLowerCase().includes(query);

      return matchesTeacher && matchesSearch;
    });
  }, [data, search, teacherFilter]);

  const groupedByTeacher = useMemo(() => {
    const groups = new Map<string, StudentOverview[]>();

    filteredStudents.forEach((student) => {
      const existing = groups.get(student.teacherEmail) ?? [];
      existing.push(student);
      groups.set(student.teacherEmail, existing);
    });

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredStudents]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Yönetici Paneli
        </h1>
        <p className="text-slate-500 text-sm mt-1">{tabDescriptions[activeTab]}</p>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="relative flex border-b border-slate-100">
          {tabs.map(({ id, label, icon: Icon }) => (
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
              <span className="sm:hidden">{id === "overview" ? "Genel" : "Deneme"}</span>
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
            {activeTab === "overview" ? (
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
                formatTeacherLabel={formatTeacherLabel}
              />
            ) : (
              <ExamsTabContent
                teacherFilter={teacherFilter}
                teacherOptions={teacherOptions}
                onTeacherFilterChange={setTeacherFilter}
                formatTeacherLabel={formatTeacherLabel}
              />
            )}
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
        <p className="text-slate-600">Veriler yüklenemedi. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <FiUsers className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Toplam Öğrenci</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card-premium p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <FiUserCheck className="text-xl text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Toplam Öğretmen</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalTeachers}</p>
            </div>
          </div>
        </div>

        <div className="card-premium p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FiTrendingUp className="text-xl text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Ortalama İlerleme</p>
              <p className="text-2xl font-bold text-slate-900">%{summary.averageProgress}</p>
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

      {filteredStudents.length === 0 ? (
        <div className="card-premium p-12 text-center border border-slate-100">
          <p className="text-slate-600">Gösterilecek öğrenci bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByTeacher.map(([teacherEmail, students]) => (
            <section key={teacherEmail} className="card-premium overflow-hidden border border-slate-100">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                      Öğretmen
                    </p>
                    <h2 className="text-lg font-bold text-slate-900">
                      {formatTeacherLabel(teacherEmail)}
                    </h2>
                    <p className="text-xs text-slate-500">{teacherEmail}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {students.length} öğrenci
                  </div>
                </div>
              </div>

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
                    {students.map((student) => (
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
                              {student.weeklySolvedQuestions} soru (haftalık)
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {student.totalSolvedQuestions.toLocaleString("tr-TR")}
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
                                Son: {student.latestMockExamNet.toFixed(1)} net
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
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
