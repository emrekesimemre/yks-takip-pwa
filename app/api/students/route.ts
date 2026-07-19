import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import { masterCurriculum } from "@/data/subjects";

// Oturum kontrolü yardımcı fonksiyonu
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    throw new Error("Unauthorized");
  }
  return session.user.email;
}

// Yeni Öğrenci Ekleme
export async function POST(req: Request) {
  try {
    const teacherEmail = await checkAuth();
    await connectMongo();

    const { name, target } = await req.json();

    // JSON havuzundan tüm konu ID'lerini çekip başlangıç state'i oluşturuyoruz
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
      name,
      target,
      teacherEmail,
      topics: initialTopics,
      weeklySelectedTopics: [],
      solvedQuestionsByCourse: {},
      weeklySolvedQuestionsByCourse: {},
      mockExams: [],
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Öğrenci eklenirken hata oluştu." },
      { status: 500 },
    );
  }
}

// Öğrencileri Listeleme
export async function GET() {
  try {
    const teacherEmail = await checkAuth();
    await connectMongo();

    // Sadece giriş yapan öğretmenin öğrencilerini getiriyoruz
    const students = await Student.find({ teacherEmail }).sort({
      createdAt: -1,
    });
    return NextResponse.json(students, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Öğrenciler getirilemedi." },
      { status: 500 },
    );
  }
}
