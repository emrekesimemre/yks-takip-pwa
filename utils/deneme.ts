import { denemeCoursesByType, type DenemeExamType } from "@/data/denemeCourses";
import type { MockExam, MockExamCourseResult } from "@/store/useStudentStore";

export function calculateNet(correct: number, wrong: number): number {
  return Math.round((correct - wrong / 4) * 100) / 100;
}

export function calculateCourseNet(result: MockExamCourseResult): number {
  return calculateNet(result.correct, result.wrong);
}

export function calculateExamTotalNet(exam: MockExam): number {
  return exam.courses.reduce((sum, c) => sum + calculateCourseNet(c), 0);
}

export function calculateExamTotals(exam: MockExam) {
  const correct = exam.courses.reduce((s, c) => s + c.correct, 0);
  const wrong = exam.courses.reduce((s, c) => s + c.wrong, 0);
  const empty = exam.courses.reduce((s, c) => s + c.empty, 0);
  const net = calculateNet(correct, wrong);
  const total = correct + wrong + empty;
  const maxTotal = denemeCoursesByType[exam.type].reduce(
    (s, c) => s + c.maxQuestions,
    0,
  );

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
    }
  >();

  exams.forEach((exam) => {
    exam.courses.forEach((c) => {
      const def = denemeCoursesByType[exam.type].find(
        (d) => d.key === c.courseKey,
      );
      if (!def) return;
      if (!hasAnsweredQuestions(c.correct, c.wrong, c.empty)) return;

      const existing = stats.get(c.courseKey) ?? {
        courseName: def.name,
        maxQuestions: def.maxQuestions,
        nets: [],
        corrects: [],
        wrongs: [],
        empties: [],
        segments: [],
      };

      existing.nets.push(calculateCourseNet(c));
      existing.corrects.push(c.correct);
      existing.wrongs.push(c.wrong);
      existing.empties.push(c.empty);
      existing.segments.push(
        getProgressSegments(c.correct, c.wrong, c.empty, def.maxQuestions),
      );
      stats.set(c.courseKey, existing);
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
      avgSuccessRate: avg(
        s.corrects.map((correct) => getSuccessRate(correct, s.maxQuestions)),
      ),
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
  type: DenemeExamType;
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

export function createEmptyCourseResults(
  type: DenemeExamType,
): MockExamCourseResult[] {
  return denemeCoursesByType[type].map((c) => ({
    courseKey: c.key,
    correct: 0,
    wrong: 0,
    empty: 0,
  }));
}

export function mergeCourseResults(
  type: DenemeExamType,
  existing: MockExamCourseResult[],
): MockExamCourseResult[] {
  return createEmptyCourseResults(type).map((c) => {
    const found = existing.find((e) => e.courseKey === c.courseKey);
    return found ?? c;
  });
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
  type: DenemeExamType,
): string {
  return `${date}|${type}`;
}

export type ExamGroup = {
  key: string;
  date: string;
  type: DenemeExamType;
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
  const [date, type] = groupKey.split("|") as [string, DenemeExamType];
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
