import { jsonError } from "@/lib/api";
import { requireAdminSession } from "@/lib/api-auth";
import connectMongo from "@/lib/mongo";
import { listTeachers, publicTeacherEmail } from "@/lib/staff";
import Student from "@/models/Student";
import type { MockExam } from "@/store/useStudentStore";
import {
  getOverallProgress,
  getTotalSolvedQuestions as getTotalSolvedFromCurriculum,
} from "@/utils/curriculum";
import { calculateExamTotalNet } from "@/utils/deneme";
import { normalizeTopics } from "@/utils/student";
import { NextResponse } from "next/server";

const ADMIN_STUDENT_LIMIT = 2000;

const OVERVIEW_PROJECTION = {
  name: 1,
  target: 1,
  teacherEmail: 1,
  topics: 1,
  weeklySelectedTopics: 1,
  solvedQuestionsByCourse: 1,
  solvedQuestionsByTopic: 1,
  weeklySolvedQuestionsByCourse: 1,
  weeklySolvedQuestionsByTopic: 1,
  mockExams: 1,
  updatedAt: 1,
} as const;

function getTotalSolvedQuestions(
  courseRecord: Record<string, number> | Map<string, number> | undefined,
  topicRecord?: Record<string, number> | Map<string, number> | undefined,
): number {
  return getTotalSolvedFromCurriculum(courseRecord, topicRecord);
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function getLatestMockExamNet(mockExams: MockExam[]): number | null {
  if (mockExams.length === 0) return null;

  const sorted = [...mockExams].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return calculateExamTotalNet(sorted[0]);
}

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    await connectMongo();

    const docs = await Student.find()
      .select(OVERVIEW_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(ADMIN_STUDENT_LIMIT + 1)
      .lean();

    const truncated = docs.length > ADMIN_STUDENT_LIMIT;
    const students = truncated ? docs.slice(0, ADMIN_STUDENT_LIMIT) : docs;

    const overview = students.map((student) => {
      const topics = normalizeTopics(student.topics);
      const mockExams = (student.mockExams ?? []) as MockExam[];

      return {
        _id: String(student._id),
        name: student.name,
        target: student.target ?? "",
        teacherEmail: publicTeacherEmail(student.teacherEmail),
        progress: getOverallProgress(topics),
        weeklyTopicCount: student.weeklySelectedTopics?.length ?? 0,
        totalSolvedQuestions: getTotalSolvedQuestions(
          student.solvedQuestionsByCourse,
          student.solvedQuestionsByTopic,
        ),
        weeklySolvedQuestions: getTotalSolvedQuestions(
          student.weeklySolvedQuestionsByCourse,
          student.weeklySolvedQuestionsByTopic,
        ),
        mockExamCount: mockExams.length,
        latestMockExamNet: getLatestMockExamNet(mockExams),
        updatedAt: isoDate(student.updatedAt),
      };
    });

    const teachers = await listTeachers();
    const averageProgress =
      overview.length === 0
        ? 0
        : Math.round(
            overview.reduce((sum, s) => sum + s.progress, 0) / overview.length,
          );

    return NextResponse.json({
      summary: {
        totalStudents: overview.length,
        totalTeachers: teachers.length,
        averageProgress,
        truncated,
      },
      teachers,
      students: overview,
    });
  } catch (error) {
    console.error("Admin overview hatası:", error);
    return jsonError("Genel durum getirilemedi.", 500);
  }
}
