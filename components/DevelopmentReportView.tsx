"use client";

import { masterCurriculum, type Curriculum } from "@/data/subjects";
import type {
  CourseSolvedQuestions,
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
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
  target?: string;
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
};

function CompletionPie({
  exam,
  topics,
}: {
  exam: keyof Curriculum;
  topics: TopicProgress[];
}) {
  const progress = getExamProgress(exam, topics);
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
}: {
  exam: keyof Curriculum;
  topics: TopicProgress[];
}) {
  const data = getCourseProgressList(exam, topics).map((item) => ({
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
  target,
  topics,
  solvedQuestionsByCourse,
  solvedQuestionsByTopic,
}: Props) {
  const overallProgress = getOverallProgress(topics);
  const reportDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalSolved = getTotalSolvedQuestions(
    solvedQuestionsByCourse,
    solvedQuestionsByTopic,
  );

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        <CompletionPie exam="TYT" topics={topics} />
        <CompletionPie exam="AYT" topics={topics} />
      </div>

      <div className="space-y-8 mb-8">
        <CourseBarChart exam="TYT" topics={topics} />
        <CourseBarChart exam="AYT" topics={topics} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">
          Toplam Çözülen Soru Özeti
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(["TYT", "AYT"] as const).flatMap((exam) =>
            Object.keys(masterCurriculum[exam])
              .map((course) => {
                const count = getCourseSolvedCount(
                  solvedQuestionsByCourse,
                  exam,
                  course,
                  solvedQuestionsByTopic,
                );
                if (count === 0) return null;
                return (
                  <div
                    key={`${exam}-${course}`}
                    className="rounded-lg bg-white border border-slate-100 px-3 py-2"
                  >
                    <p className="text-[11px] text-slate-500 truncate">
                      {exam} {course}
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

      <p className="text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
        YKS Takip Çizelgesi — Gelişim Raporu — {reportDate}
      </p>
    </div>
  );
}
