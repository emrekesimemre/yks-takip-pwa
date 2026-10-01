import { NextResponse } from "next/server";
import { jsonError, readJsonBody } from "@/lib/api";
import { requireTeacherSession } from "@/lib/api-auth";
import { parseOptionalEmail } from "@/lib/mail";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import { masterCurriculum } from "@/data/subjects";
import { createStudentSchema, zodErrorMessage } from "@/lib/student-payload";

export async function POST(req: Request) {
  try {
    const auth = await requireTeacherSession();
    if (!auth.ok) return auth.response;
    await connectMongo();

    const parsedBody = await readJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = createStudentSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const parentEmail = parseOptionalEmail(parsed.data.parentEmail);
    if (parentEmail === null) {
      return jsonError("Geçerli bir veli e-postası girin.", 400);
    }

    const initialTopics: { id: string; isCompleted: boolean }[] = [];
    const exams = ["TYT", "AYT"] as const;
    exams.forEach((exam) => {
      const courses = masterCurriculum[exam];
      Object.keys(courses).forEach((courseName) => {
        courses[courseName].forEach((topic) => {
          initialTopics.push({ id: topic.id, isCompleted: false });
        });
      });
    });

    const newStudent = await Student.create({
      name: parsed.data.name,
      target: parsed.data.target,
      parentEmail,
      teacherEmail: auth.email,
      topics: initialTopics,
      weeklySelectedTopics: [],
      solvedQuestionsByCourse: {},
      solvedQuestionsByTopic: {},
      weeklySolvedQuestionsByCourse: {},
      weeklySolvedQuestionsByTopic: {},
      mockExams: [],
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Öğrenci eklenirken hata:", error);
    return jsonError("Öğrenci eklenirken hata oluştu.", 500);
  }
}

export async function GET() {
  try {
    const auth = await requireTeacherSession();
    if (!auth.ok) return auth.response;
    await connectMongo();

    const students = await Student.find({ teacherEmail: auth.email }).sort({
      createdAt: -1,
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Öğrenciler getirilemedi:", error);
    return jsonError("Öğrenciler getirilemedi.", 500);
  }
}
