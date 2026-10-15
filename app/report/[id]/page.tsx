import { Metadata } from "next";
import { isValidObjectId } from "mongoose";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import DevelopmentReportView from "@/components/DevelopmentReportView";
import ReportPageHeader from "@/components/ReportPageHeader";

export const metadata: Metadata = {
  title: "Öğrenci Gelişim Raporu",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!id || !isValidObjectId(id)) {
    return <InvalidReportLink />;
  }

  await connectMongo();
  const student = await Student.findById(id);

  if (!student) {
    return <InvalidReportLink />;
  }

  // If token is provided and differs, sync it to student document
  if (token && student.reportToken !== token) {
    student.reportToken = token;
    try {
      await student.save();
    } catch (e) {
      console.warn("Could not sync reportToken:", e);
    }
  }

  const studentObj = JSON.parse(
    JSON.stringify(student.toObject({ flattenMaps: true })),
  );

  const topics = (studentObj.topics ?? []).map(
    (t: { id: string; isCompleted?: boolean }) => ({
      id: String(t.id),
      isCompleted: Boolean(t.isCompleted),
    }),
  );

  const solvedQuestionsByCourse = (studentObj.solvedQuestionsByCourse ??
    {}) as Record<string, number>;
  const solvedQuestionsByTopic = (studentObj.solvedQuestionsByTopic ??
    {}) as Record<string, number>;
  const mockExams = studentObj.mockExams ?? [];

  return (
    <div className="min-h-screen bg-slate-100/70 print:bg-white text-slate-800">
      <ReportPageHeader
        studentName={studentObj.name}
        grade={studentObj.grade}
        field={studentObj.field}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 print:p-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden print:border-none print:shadow-none">
          <DevelopmentReportView
            studentName={studentObj.name}
            grade={studentObj.grade}
            field={studentObj.field}
            target={studentObj.target}
            topics={topics}
            solvedQuestionsByCourse={solvedQuestionsByCourse}
            solvedQuestionsByTopic={solvedQuestionsByTopic}
            mockExams={mockExams}
          />
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400 print:hidden pb-10">
          Bu gelişim raporu YKS Takip sistemi üzerinden danışman öğretmen tarafından veli bilgilendirmesi amacıyla oluşturulmuştur.
        </footer>
      </main>
    </div>
  );
}

function InvalidReportLink() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Rapor Bağlantısı Geçersiz
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Bu gelişim raporu bağlantısı geçersiz veya süresi dolmuş olabilir. Güncel gelişim raporuna ulaşmak için lütfen öğrencinin danışman öğretmeni ile iletişime geçin.
        </p>
      </div>
    </div>
  );
}
