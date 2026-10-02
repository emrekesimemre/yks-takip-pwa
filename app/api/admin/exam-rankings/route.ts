import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdminSession } from "@/lib/api-auth";
import connectMongo from "@/lib/mongo";
import { publicTeacherEmail } from "@/lib/staff";
import Student from "@/models/Student";
import {
  discoverExamGroups,
  rankStudentsForExamGroup,
  type StudentExamSource,
} from "@/utils/deneme";
import type { MockExam } from "@/store/useStudentStore";

const ADMIN_STUDENT_LIMIT = 2000;

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    await connectMongo();

    const docs = await Student.find()
      .select("_id name teacherEmail mockExams")
      .sort({ createdAt: -1 })
      .limit(ADMIN_STUDENT_LIMIT + 1)
      .lean();

    const truncated = docs.length > ADMIN_STUDENT_LIMIT;
    const students = truncated ? docs.slice(0, ADMIN_STUDENT_LIMIT) : docs;

    const sources: StudentExamSource[] = students.map((student) => ({
      _id: String(student._id),
      name: student.name,
      teacherEmail: publicTeacherEmail(student.teacherEmail),
      mockExams: (student.mockExams ?? []) as MockExam[],
    }));

    const examGroups = discoverExamGroups(sources);

    const resultsByGroup = Object.fromEntries(
      examGroups.map((group) => [
        group.key,
        rankStudentsForExamGroup(sources, group.key),
      ]),
    );

    return NextResponse.json({ examGroups, resultsByGroup, truncated });
  } catch (error) {
    console.error("Admin exam rankings hatası:", error);
    return jsonError("Deneme sıralaması getirilemedi.", 500);
  }
}
