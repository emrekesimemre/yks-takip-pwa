"use client";

import { getCurriculumForStudent } from "@/data/subjects";
import { getDenemeCourseDef } from "@/data/denemeCourses";
import type {
  CourseSolvedQuestions,
  MockExam,
  SchoolExamEntry,
  TopicProgress,
} from "@/store/useStudentStore";
import {
  getCourseProgressList,
  getCourseSolvedCount,
  getExamProgress,
  getOverallProgress,
  getTotalSolvedQuestions,
} from "@/utils/curriculum";
import {
  analyzeByCourse,
  calculateCourseNet,
  calculateExamTotalNet,
  formatDate,
  formatNet,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#e2e8f0"];
const BAR_COLOR = "#4f46e5";

type Props = {
  studentName: string;
  grade?: string;
  field?: string;
  target?: string;
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
  mockExams?: MockExam[];
  schoolGrades?: SchoolExamEntry[];
};

function CompletionPie({
  exam,
  topics,
  grade,
  field,
}: {
  exam: string;
  topics: TopicProgress[];
  grade?: string;
  field?: string;
}) {
  const progress = getExamProgress(exam, topics, grade, field);
  const pieData = [
    { name: "Tamamlanan", value: progress.completed },
    { name: "Kalan", value: progress.total - progress.completed },
  ];

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-bold text-slate-700 mb-2">
        {exam} Genel Durum
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            shape={(props) => (
              <Sector
                {...props}
                fill={PIE_COLORS[props.index % PIE_COLORS.length]}
              />
            )}
          />
          <Tooltip
            formatter={(value, name) => [`${value ?? 0} konu`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-2xl font-bold text-blue-600">%{progress.percentage}</p>
      <p className="text-xs text-slate-500">
        {progress.completed}/{progress.total} konu tamamlandı
      </p>
    </div>
  );
}

function CourseBarChart({
  exam,
  topics,
  grade,
  field,
}: {
  exam: string;
  topics: TopicProgress[];
  grade?: string;
  field?: string;
}) {
  const data = getCourseProgressList(exam, topics, grade, field).map((item) => ({
    name: item.course,
    percentage: item.percentage,
    label: `%${item.percentage}`,
  }));

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3">
        {exam} Ders Bazlı İlerleme
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(220, data.length * 36)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#f1f5f9"
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `%${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 11, fill: "#475569" }}
          />
          <Tooltip formatter={(value) => [`%${value ?? 0}`, "Tamamlanma"]} />
          <Bar
            dataKey="percentage"
            fill={BAR_COLOR}
            radius={[0, 4, 4, 0]}
            barSize={18}
          >
            <LabelList
              dataKey="label"
              position="right"
              fill="#64748b"
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DevelopmentReportView({
  studentName,
  grade,
  field,
  target,
  topics,
  solvedQuestionsByCourse,
  solvedQuestionsByTopic,
  mockExams = [],
  schoolGrades = [],
}: Props) {
  const overallProgress = getOverallProgress(topics, grade, field);
  const studentCurriculum = getCurriculumForStudent(grade, field);
  const examSections = Object.keys(studentCurriculum);
  const reportDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalSolved = getTotalSolvedQuestions(
    solvedQuestionsByCourse,
    solvedQuestionsByTopic,
  );

  const tytExams = mockExams.filter((e) => e.type === "TYT");
  const aytExams = mockExams.filter((e) => e.type === "AYT");
  const tytTrend = getExamTrend(tytExams);
  const aytTrend = getExamTrend(aytExams);
  const courseAnalysis = analyzeByCourse(mockExams);
  const weakestCourses = getWeakestCourses(courseAnalysis);

  const avgNet = (exams: MockExam[]) => {
    if (exams.length === 0) return null;
    const sum = exams.reduce((s, e) => s + calculateExamTotalNet(e), 0);
    return Math.round((sum / exams.length) * 100) / 100;
  };
  const lastNet = (exams: MockExam[]) => {
    if (exams.length === 0) return null;
    const sorted = [...exams].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return calculateExamTotalNet(sorted[0]);
  };

  const sortedMockExams = [...mockExams].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latestExam = sortedMockExams[0];

  return (
    <div className="p-6 sm:p-8 bg-white text-slate-900">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
          Veli Gelişim Raporu
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{studentName}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-600">
          <span>Hedef: {target || "Belirtilmedi"}</span>
          <span>Rapor Tarihi: {reportDate}</span>
          <span className="font-semibold text-blue-600">
            Genel İlerleme: %{overallProgress}
          </span>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${examSections.length > 1 ? "sm:grid-cols-2" : "max-w-md mx-auto"} gap-8 mb-8`}
      >
        {examSections.map((sec) => (
          <CompletionPie
            key={sec}
            exam={sec}
            topics={topics}
            grade={grade}
            field={field}
          />
        ))}
      </div>

      <div className="space-y-8 mb-8">
        {examSections.map((sec) => (
          <CourseBarChart
            key={sec}
            exam={sec}
            topics={topics}
            grade={grade}
            field={field}
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">
          Toplam Çözülen Soru Özeti
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {examSections.flatMap((sec) =>
            Object.keys(studentCurriculum[sec] ?? {})
              .map((course) => {
                const count = getCourseSolvedCount(
                  solvedQuestionsByCourse,
                  sec,
                  course,
                  solvedQuestionsByTopic,
                  grade,
                  field,
                );
                if (count === 0) return null;
                return (
                  <div
                    key={`${sec}-${course}`}
                    className="rounded-lg bg-white border border-slate-100 px-3 py-2"
                  >
                    <p className="text-[11px] text-slate-500 truncate">
                      {sec} {course}
                    </p>
                    <p className="text-lg font-bold text-slate-800">{count}</p>
                  </div>
                );
              })
              .filter(Boolean),
          )}
        </div>
        {totalSolved === 0 ? (
          <p className="text-sm text-slate-500">Henüz soru kaydı girilmemiş.</p>
        ) : (
          <p className="text-sm font-semibold text-slate-700 mt-3">
            Toplam: {totalSolved.toLocaleString("tr-TR")} soru
          </p>
        )}
      </div>

      {schoolGrades.length > 0 && (
        <div className="mt-8">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-800">Okul Notları</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Yazılı notları ve dönem ortalamaları
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-slate-600">Ders</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Dönem</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Yazılılar</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Ortalama</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  new Set(schoolGrades.map((entry) => `${entry.subject}-${entry.term}`)),
                ).map((key, index) => {
                  const [subject, termValue] = key.split(/-(?=[^-]+$)/);
                  const term = Number(termValue);
                  const entries = schoolGrades.filter(
                    (entry) => entry.subject === subject && entry.term === term,
                  );
                  const average = Math.round(
                    entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length,
                  );
                  const sortedEntries = [...entries].sort(
                    (a, b) => a.examIndex - b.examIndex,
                  );
                  return (
                    <tr key={key} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 font-medium text-slate-800">{subject}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{term}. Dönem</td>
                      <td className="px-3 py-2 text-center text-slate-600">
                        {sortedEntries
                          .map((entry) => `${entry.examIndex}. yazılı: ${entry.score}`)
                          .join(" · ")}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-indigo-600">{average}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deneme analizi bölümü */}
      {mockExams.length > 0 && (
        <div className="mt-8">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-800">
              Deneme Sınavı Analizi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toplam {mockExams.length} deneme kaydı
            </p>
          </div>

          {/* Özet istatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "TYT Deneme Sayısı", value: tytExams.length || "—" },
              {
                label: "TYT Ort. Net",
                value: avgNet(tytExams) != null ? formatNet(avgNet(tytExams)!) : "—",
              },
              { label: "AYT Deneme Sayısı", value: aytExams.length || "—" },
              {
                label: "AYT Ort. Net",
                value: avgNet(aytExams) != null ? formatNet(avgNet(aytExams)!) : "—",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center"
              >
                <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{String(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Son Deneme Karnesi */}
          {latestExam && (
            <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-indigo-100 gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                    Son Deneme Sınavı Karnesi
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {latestExam.name || "Deneme Sınavı"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDate(latestExam.date)} ·{" "}
                    <span className="font-semibold text-indigo-600">
                      {latestExam.type}
                    </span>
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-sm self-start sm:self-auto">
                  <span>Toplam Net:</span>
                  <span className="text-lg font-extrabold">
                    {formatNet(calculateExamTotalNet(latestExam))}
                  </span>
                </div>
              </div>

              {/* Ders ders doğru-yanlış-net dökümü */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs bg-white rounded-lg overflow-hidden border border-slate-100 shadow-2xs">
                  <thead>
                    <tr className="text-left bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
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
                      <th className="py-2.5 px-3 text-right text-indigo-700 font-bold">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latestExam.courses.map((c) => {
                      const net = calculateCourseNet(c);
                      const courseName =
                        c.courseName ||
                        getDenemeCourseDef(latestExam.type, c.courseKey)?.name ||
                        c.courseKey;
                      return (
                        <tr
                          key={c.courseKey}
                          className="hover:bg-slate-50/70 transition-colors"
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
                          <td className="py-2 px-3 text-right font-extrabold text-indigo-600">
                            {formatNet(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Son deneme */}
          {(lastNet(tytExams) != null || lastNet(aytExams) != null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {lastNet(tytExams) != null && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-blue-800">Son TYT Denemesi</p>
                  <p className="text-2xl font-bold text-blue-700">{formatNet(lastNet(tytExams)!)} net</p>
                </div>
              )}
              {lastNet(aytExams) != null && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-indigo-800">Son AYT Denemesi</p>
                  <p className="text-2xl font-bold text-indigo-700">{formatNet(lastNet(aytExams)!)} net</p>
                </div>
              )}
            </div>
          )}

          {/* TYT Net Trendi */}
          {tytTrend.length >= 2 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3">TYT Net Gelişimi</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={tytTrend} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
                    }
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    formatter={(v) => [`${v} net`, "TYT"]}
                    labelFormatter={(d) => formatDate(String(d))}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#2563eb" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AYT Net Trendi */}
          {aytTrend.length >= 2 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3">AYT Net Gelişimi</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={aytTrend} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
                    }
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    formatter={(v) => [`${v} net`, "AYT"]}
                    labelFormatter={(d) => formatDate(String(d))}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#6366f1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ders bazlı performans */}
          {courseAnalysis.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Ders Bazlı Ortalama Net</h3>
              <ResponsiveContainer width="100%" height={Math.max(180, courseAnalysis.length * 32)}>
                <BarChart
                  data={courseAnalysis.map((c) => ({
                    name: c.courseName,
                    net: c.avgNet,
                    label: formatNet(c.avgNet),
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 10, fill: "#475569" }}
                  />
                  <Tooltip formatter={(v) => [`${v} net`, "Ortalama"]} />
                  <Bar dataKey="net" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16}>
                    <LabelList dataKey="label" position="right" fill="#64748b" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* En zayıf dersler */}
          {weakestCourses.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-bold text-amber-900 mb-2">
                Geliştirilmesi Gereken Dersler
              </h3>
              <div className="flex flex-wrap gap-2">
                {weakestCourses.map((c) => (
                  <span
                    key={c.courseKey}
                    className="px-3 py-1 bg-white border border-amber-200 rounded-full text-xs font-semibold text-amber-800"
                  >
                    {c.courseName} — ort. {formatNet(c.avgNet)} net
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Son 5 deneme tablosu */}
          {mockExams.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Son Denemeler</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 rounded-tl-lg">Deneme</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">Tür</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">Tarih</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600 rounded-tr-lg">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {[...mockExams]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((exam, i) => (
                      <tr key={exam.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 text-slate-800 font-medium">{exam.name}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              exam.type === "TYT"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {exam.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500 text-xs">
                          {formatDate(exam.date)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">
                          {formatNet(calculateExamTotalNet(exam))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
        YKS Takip Çizelgesi — Gelişim Raporu — {reportDate}
      </p>
    </div>
  );
}
