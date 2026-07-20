import { authOptions, isAdminEmail } from "@/lib/auth";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import type { MockExam } from "@/store/useStudentStore";
import {
  getOverallProgress,
  getTotalSolvedQuestions as getTotalSolvedFromCurriculum,
} from "@/utils/curriculum";
import { calculateExamTotalNet } from "@/utils/deneme";
import { normalizeTopics } from "@/utils/student";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function getTotalSolvedQuestions(
  courseRecord: Record<string, number> | Map<string, number> | undefined,
  topicRecord?: Record<string, number> | Map<string, number> | undefined,
): number {
  return getTotalSolvedFromCurriculum(courseRecord, topicRecord);
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongo();

    const students = await Student.find().sort({ createdAt: -1 }).lean();

    const overview = students.map((student) => {
      const topics = normalizeTopics(student.topics);
      const mockExams = (student.mockExams ?? []) as MockExam[];

      return {
        _id: String(student._id),
        name: student.name,
        target: student.target ?? "",
        teacherEmail: student.teacherEmail,
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
        updatedAt: student.updatedAt?.toISOString?.() ?? null,
      };
    });

    const teacherEmails = [...new Set(overview.map((s) => s.teacherEmail))];
    const averageProgress =
      overview.length === 0
        ? 0
        : Math.round(
            overview.reduce((sum, s) => sum + s.progress, 0) / overview.length,
          );

    return NextResponse.json({
      summary: {
        totalStudents: overview.length,
        totalTeachers: teacherEmails.length,
        averageProgress,
      },
      students: overview,
    });
  } catch (error) {
    console.error("Admin overview hatası:", error);
    return NextResponse.json(
      { error: "Genel durum getirilemedi." },
      { status: 500 },
    );
  }
}
