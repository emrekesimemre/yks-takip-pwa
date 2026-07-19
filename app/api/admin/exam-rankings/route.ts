import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "@/lib/auth";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import {
  discoverExamGroups,
  rankStudentsForExamGroup,
  type StudentExamSource,
} from "@/utils/deneme";
import type { MockExam } from "@/store/useStudentStore";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongo();

    const students = await Student.find().sort({ createdAt: -1 }).lean();

    const sources: StudentExamSource[] = students.map((student) => ({
      _id: String(student._id),
      name: student.name,
      teacherEmail: student.teacherEmail,
      mockExams: (student.mockExams ?? []) as MockExam[],
    }));

    const examGroups = discoverExamGroups(sources);

    const resultsByGroup = Object.fromEntries(
      examGroups.map((group) => [
        group.key,
        rankStudentsForExamGroup(sources, group.key),
      ]),
    );

    return NextResponse.json({ examGroups, resultsByGroup });
  } catch (error) {
    console.error("Admin exam rankings hatası:", error);
    return NextResponse.json(
      { error: "Deneme sıralaması getirilemedi." },
      { status: 500 },
    );
  }
}
