import {
  denemeCoursesByType,
  getDenemeCourseDefByName,
} from "@/data/denemeCourses";
import type { MockExam, MockExamCourseResult } from "@/store/useStudentStore";

export function calculateNet(correct: number, wrong: number): number {
  return Math.round((correct - wrong / 4) * 100) / 100;
}

export function calculateCourseNet(result: MockExamCourseResult): number {
  return calculateNet(result.correct, result.wrong);
}

export function getEffectiveExamCourses(exam: MockExam): MockExamCourseResult[] {
  const topics = exam.topics ?? exam.wrongTopics ?? [];
  if (topics.length === 0) return exam.courses;

  const courses = new Map<string, MockExamCourseResult>();
  for (const topic of topics) {
    const courseName = topic.courseName?.trim().replace(/\s+/g, " ");
    const courseKey = courseName
      ? `NAME-${courseName.toLocaleLowerCase("tr-TR")}`
      : topic.courseKey || "UNMAPPED-course";
    const existing = courses.get(courseKey) ?? {
      courseKey,
      courseName,
      correct: 0,
      wrong: 0,
      empty: 0,
    };
    existing.correct += Number(topic.correctCount || 0);
    existing.wrong += Number(topic.wrongCount || 0);
    existing.empty += Number(topic.emptyCount || 0);
    if (courseName) existing.courseName = courseName;
    courses.set(courseKey, existing);
  }

  return Array.from(courses.values());
}

export function calculateExamTotalNet(exam: MockExam): number {
  return getEffectiveExamCourses(exam).reduce(
    (sum, c) => sum + calculateCourseNet(c),
    0,
  );
}

export function formatNet(net: number): string {
  const val = Math.round(net * 100) / 100;
  if (Number.isInteger(val)) return val.toString();
  const str = val.toFixed(2);
  return str.endsWith("0") ? str.slice(0, -1) : str;
}

export function calculateExamTotals(exam: MockExam) {
  const courses = getEffectiveExamCourses(exam);
  const correct = courses.reduce((s, c) => s + c.correct, 0);
  const wrong = courses.reduce((s, c) => s + c.wrong, 0);
  const empty = courses.reduce((s, c) => s + c.empty, 0);
  const net = calculateNet(correct, wrong);
  const total = correct + wrong + empty;
  const courseDefs = denemeCoursesByType[exam.type] ?? [];
  const maxTotal =
    courses.length > 0
      ? courses.reduce((s, c) => {
          const def =
            (c.courseName && getDenemeCourseDefByName(exam.type, c.courseName)) ||
            courseDefs.find((d) => d.key === c.courseKey);
          return s + (def?.maxQuestions ?? (c.correct + c.wrong + c.empty));
        }, 0)
      : courseDefs.reduce((s, c) => s + c.maxQuestions, 0);

  return { correct, wrong, empty, net, total, maxTotal };
}

export function hasAnsweredQuestions(
  correct: number,
  wrong: number,
  empty: number,
): boolean {
  return correct + wrong + empty > 0;
}

export function getSuccessRate(correct: number, maxQuestions: number): number {
  if (maxQuestions === 0) return 0;
  return Math.round((correct / maxQuestions) * 100);
}

export function formatSuccessRate(
  correct: number,
  wrong: number,
  empty: number,
  maxQuestions: number,
): string {
  if (!hasAnsweredQuestions(correct, wrong, empty)) return "—";
  return `%${getSuccessRate(correct, maxQuestions)}`;
}

export type ProgressSegments = {
  correct: number;
  wrong: number;
  remainder: number;
};

export function getProgressSegments(
  correct: number,
  wrong: number,
  empty: number,
  maxQuestions: number,
): ProgressSegments {
  if (maxQuestions === 0) {
    return { correct: 0, wrong: 0, remainder: 100 };
  }

  const unanswered = Math.max(0, maxQuestions - correct - wrong - empty);

  return {
    correct: (correct / maxQuestions) * 100,
    wrong: (wrong / maxQuestions) * 100,
    remainder: ((empty + unanswered) / maxQuestions) * 100,
  };
}

export type CourseAnalysis = {
  courseKey: string;
  courseName: string;
  maxQuestions: number;
  avgNet: number;
  avgCorrect: number;
  avgWrong: number;
  avgSuccessRate: number;
  progressSegments: ProgressSegments;
  examCount: number;
};

export function analyzeByCourse(exams: MockExam[]): CourseAnalysis[] {
  const stats = new Map<
    string,
    {
      courseName: string;
      maxQuestions: number;
      nets: number[];
      corrects: number[];
      wrongs: number[];
      empties: number[];
      segments: ProgressSegments[];
      successRates: number[];
    }
  >();

  exams.forEach((exam) => {
    getEffectiveExamCourses(exam).forEach((c) => {
      const keyDef = (denemeCoursesByType[exam.type] ?? []).find(
        (d) => d.key === c.courseKey,
      );
      const def = keyDef ?? (c.courseName
        ? getDenemeCourseDefByName(exam.type, c.courseName)
        : undefined);
      if (!hasAnsweredQuestions(c.correct, c.wrong, c.empty)) return;

      const courseName = c.courseName || def?.name || c.courseKey;
      const analysisKey = c.courseKey;
      const maxQuestions =
        def?.maxQuestions || c.correct + c.wrong + c.empty || 20;

      const existing = stats.get(analysisKey) ?? {
        courseName,
        maxQuestions,
        nets: [],
        corrects: [],
        wrongs: [],
        empties: [],
        segments: [],
        successRates: [],
      };

      existing.nets.push(calculateCourseNet(c));
      existing.corrects.push(c.correct);
      existing.wrongs.push(c.wrong);
      existing.empties.push(c.empty);
      const questionCount = c.correct + c.wrong + c.empty || def?.maxQuestions || 20;
      existing.successRates.push(getSuccessRate(c.correct, questionCount));
      existing.segments.push(
        getProgressSegments(c.correct, c.wrong, c.empty, questionCount),
      );
      stats.set(analysisKey, existing);
    });
  });

  return Array.from(stats.entries())
    .map(([courseKey, s]) => ({
      courseKey,
      courseName: s.courseName,
      maxQuestions: s.maxQuestions,
      avgNet: avg(s.nets),
      avgCorrect: avg(s.corrects),
      avgWrong: avg(s.wrongs),
      avgSuccessRate: avg(s.successRates),
      progressSegments: {
        correct: avg(s.segments.map((segment) => segment.correct)),
        wrong: avg(s.segments.map((segment) => segment.wrong)),
        remainder: avg(s.segments.map((segment) => segment.remainder)),
      },
      examCount: s.nets.length,
    }))
    .sort((a, b) => a.avgNet - b.avgNet);
}

export function getWeakestCourses(
  analysis: CourseAnalysis[],
): CourseAnalysis[] {
  if (analysis.length === 0) return [];
  const minNet = analysis[0].avgNet;
  return analysis.filter((c) => c.avgNet === minNet);
}

export function getExamTrend(exams: MockExam[]): {
  id: string;
  name: string;
  date: string;
  net: number;
  type: string;
}[] {
  return [...exams]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      net: calculateExamTotalNet(e),
      type: e.type,
    }));
}

export function createEmptyCourseResults(type: string): MockExamCourseResult[] {
  const defs = denemeCoursesByType[type] ?? [];
  const filtered =
    type === "TYT"
      ? defs.filter((c) => c.key !== "TYT-Sosyal" && c.key !== "TYT-Fen")
      : defs;

  return filtered.map((c) => ({
    courseKey: c.key,
    courseName: c.name,
    correct: 0,
    wrong: 0,
    empty: 0,
  }));
}

export function mergeCourseResults(
  type: string,
  existing: MockExamCourseResult[],
): MockExamCourseResult[] {
  const empty = createEmptyCourseResults(type);
  const result: MockExamCourseResult[] = [...existing];

  for (const emp of empty) {
    if (!result.some((r) => r.courseKey === emp.courseKey)) {
      result.push(emp);
    }
  }
  return result;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return (
    Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
  );
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function normalizeExamName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildExamSessionKey(
  date: string,
  type: string,
): string {
  return `${date}|${type}`;
}

export type ExamGroup = {
  key: string;
  date: string;
  type: string;
  names: string[];
  studentCount: number;
};

export type StudentExamSource = {
  _id: string;
  name: string;
  teacherEmail: string;
  mockExams: MockExam[];
};

export type ExamRankingEntry = {
  rank: number;
  studentId: string;
  studentName: string;
  teacherEmail: string;
  net: number;
  examName: string;
};

export function findMatchingExam(
  exams: MockExam[],
  groupKey: string,
): MockExam | undefined {
  const [date, type] = groupKey.split("|") as [string, string];
  const matches = exams.filter(
    (exam) => exam.date === date && exam.type === type,
  );

  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  return matches.slice(1).reduce((best, current) =>
    calculateExamTotalNet(current) > calculateExamTotalNet(best)
      ? current
      : best,
  matches[0]);
}

export function discoverExamGroups(students: StudentExamSource[]): ExamGroup[] {
  const groups = new Map<
    string,
    ExamGroup & { studentIds: Set<string>; nameSet: Set<string> }
  >();

  students.forEach((student) => {
    student.mockExams.forEach((exam) => {
      const key = buildExamSessionKey(exam.date, exam.type);
      const existing = groups.get(key);

      if (existing) {
        existing.studentIds.add(student._id);
        existing.nameSet.add(exam.name.trim());
        existing.studentCount = existing.studentIds.size;
        return;
      }

      groups.set(key, {
        key,
        date: exam.date,
        type: exam.type,
        names: [],
        studentCount: 1,
        studentIds: new Set([student._id]),
        nameSet: new Set([exam.name.trim()]),
      });
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      key: group.key,
      date: group.date,
      type: group.type,
      studentCount: group.studentCount,
      names: [...group.nameSet].sort((a, b) => a.localeCompare(b, "tr")),
    }))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        a.type.localeCompare(b.type),
    );
}

export function rankStudentsForExamGroup(
  students: StudentExamSource[],
  groupKey: string,
  teacherEmail?: string,
): ExamRankingEntry[] {
  const entries: Omit<ExamRankingEntry, "rank">[] = [];

  students.forEach((student) => {
    if (teacherEmail && student.teacherEmail !== teacherEmail) return;

    const exam = findMatchingExam(student.mockExams, groupKey);
    if (!exam) return;

    entries.push({
      studentId: student._id,
      studentName: student.name,
      teacherEmail: student.teacherEmail,
      net: calculateExamTotalNet(exam),
      examName: exam.name.trim(),
    });
  });

  entries.sort((a, b) => b.net - a.net);

  let currentRank = 1;

  return entries.map((entry, index) => {
    if (index > 0 && entry.net < entries[index - 1].net) {
      currentRank = index + 1;
    }

    return { rank: currentRank, ...entry };
  });
}
