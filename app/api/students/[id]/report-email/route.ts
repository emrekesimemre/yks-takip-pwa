import { NextResponse } from "next/server";
import { developmentReportHtml, developmentReportSubject } from "@/lib/emails";
import { sendMail } from "@/lib/mail";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import type { MockExam, TopicProgress } from "@/store/useStudentStore";
import { normalizeSolvedQuestions, normalizeTopics } from "@/utils/student";
import {
  clientIp,
  isMongoCastError,
  jsonError,
  parseObjectIdParam,
} from "@/lib/api";
import { requireTeacherSession } from "@/lib/api-auth";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const invalidId = parseObjectIdParam(id);
    if (invalidId) return invalidId;

    const auth = await requireTeacherSession();
    if (!auth.ok) return auth.response;

    const limited = consumeRateLimit(
      `report-email:${auth.email}:${id}:${clientIp(req)}`,
      5,
      10 * 60 * 1000,
    );
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    await connectMongo();
    const student = await Student.findOne({
      _id: id,
      teacherEmail: auth.email,
    });
    if (!student) {
      return jsonError("Öğrenci bulunamadı veya yetkiniz yok.", 404);
    }

    const data = student.toObject({ flattenMaps: true }) as {
      name: string;
      target?: string;
      parentEmail?: string;
      topics: TopicProgress[];
      solvedQuestionsByCourse: Record<string, number>;
      solvedQuestionsByTopic: Record<string, number>;
      mockExams: MockExam[];
    };

    const parentEmail = (data.parentEmail ?? "").trim().toLowerCase();
    if (!parentEmail) {
      return jsonError("Veli e-postası kayıtlı değil.", 400);
    }

    const result = await sendMail({
      to: parentEmail,
      subject: developmentReportSubject(data.name),
      html: developmentReportHtml({
        studentName: data.name,
        target: data.target,
        topics: normalizeTopics(data.topics),
        solvedQuestionsByCourse: normalizeSolvedQuestions(
          data.solvedQuestionsByCourse,
        ),
        solvedQuestionsByTopic: normalizeSolvedQuestions(
          data.solvedQuestionsByTopic,
        ),
        mockExams: Array.isArray(data.mockExams) ? data.mockExams : [],
        teacherEmail: auth.email,
      }),
      replyTo: auth.email,
    });

    if (!result.sent) {
      const error =
        result.reason === "not_configured"
          ? "Mail ayarı yok."
          : "Mail gönderilemedi.";
      return NextResponse.json(
        { error, emailSent: false },
        { status: result.reason === "not_configured" ? 503 : 502 },
      );
    }

    return NextResponse.json({ emailSent: true });
  } catch (error) {
    if (isMongoCastError(error)) {
      return jsonError("Geçersiz öğrenci kimliği.", 400);
    }
    console.error("Rapor maili gönderilirken hata:", error);
    return jsonError("Rapor maili gönderilirken hata oluştu.", 500);
  }
}
