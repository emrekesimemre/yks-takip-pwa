import { masterCurriculum } from "@/data/subjects";
import { getPublicSiteUrl } from "@/lib/nextauth-url";
import type { StaffRole } from "@/lib/staff";
import type {
  CourseSolvedQuestions,
  MockExam,
  TopicProgress,
} from "@/store/useStudentStore";
import {
  getCourseSolvedCount,
  getExamProgress,
  getOverallProgress,
  getTotalSolvedQuestions,
} from "@/utils/curriculum";
import {
  analyzeByCourse,
  calculateExamTotalNet,
  getWeakestCourses,
} from "@/utils/deneme";

const ROLE_LABELS: Record<StaffRole, string> = {
  teacher: "Öğretmen",
  admin: "Yönetici",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sanitizeSubject(value: string) {
  return value.replace(/[\r\n\0]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function formatRoles(roles: StaffRole[]) {
  return roles.map((role) => ROLE_LABELS[role]).join(", ");
}

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="tr">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:24px;">${body}</td>
      </tr>
    </table>
  </body>
</html>`;
}

export function staffInviteHtml(input: {
  roles: StaffRole[];
  actorEmail: string;
  kind: "invite" | "update";
}) {
  const siteUrl = getPublicSiteUrl();
  const roles = escapeHtml(formatRoles(input.roles));
  const actor = escapeHtml(input.actorEmail);
  const heading =
    input.kind === "invite"
      ? "YKS Takip paneline eklendiniz"
      : "YKS Takip yetkiniz güncellendi";
  const intro =
    input.kind === "invite"
      ? `Panele ${roles} yetkisiyle eklendiniz.`
      : `Yetkiniz ${roles} olarak güncellendi.`;

  return emailShell(`
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5;">YKS Takip</p>
    <h1 style="margin:0 0 16px;font-size:22px;">${heading}</h1>
    <p style="margin:0 0 12px;line-height:1.5;">${intro}</p>
    <p style="margin:0 0 12px;line-height:1.5;">Giriş, bu mailin geldiği Gmail adresiyle Google üzerinden yapılır.</p>
    <p style="margin:0 0 20px;">
      <a href="${siteUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:bold;">Panele git</a>
    </p>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;">
      Buton açılmazsa bu adresi kullanın:<br />
      <a href="${siteUrl}" style="color:#4f46e5;">${siteUrl}</a>
    </p>
    <p style="margin:0;font-size:13px;color:#64748b;">Gönderen: ${actor}. Yanıtlamak için Yanıtla’ya basın.</p>
  `);
}

function avgNet(exams: MockExam[]) {
  if (exams.length === 0) return null;
  const sum = exams.reduce((total, exam) => total + calculateExamTotalNet(exam), 0);
  return Math.round((sum / exams.length) * 10) / 10;
}

function lastNet(exams: MockExam[]) {
  if (exams.length === 0) return null;
  const sorted = [...exams].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return Math.round(calculateExamTotalNet(sorted[0]) * 10) / 10;
}

function formatNet(value: number | null) {
  return value == null ? "—" : String(value);
}

export function developmentReportHtml(input: {
  studentName: string;
  target?: string;
  topics: TopicProgress[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  solvedQuestionsByTopic: CourseSolvedQuestions;
  mockExams: MockExam[];
  teacherEmail: string;
}) {
  const reportDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const overall = getOverallProgress(input.topics);
  const tyt = getExamProgress("TYT", input.topics);
  const ayt = getExamProgress("AYT", input.topics);
  const totalSolved = getTotalSolvedQuestions(
    input.solvedQuestionsByCourse,
    input.solvedQuestionsByTopic,
  );
  const tytExams = input.mockExams.filter((exam) => exam.type === "TYT");
  const aytExams = input.mockExams.filter((exam) => exam.type === "AYT");
  const weakest = getWeakestCourses(analyzeByCourse(input.mockExams));

  const courseRows = (["TYT", "AYT"] as const)
    .flatMap((exam) =>
      Object.keys(masterCurriculum[exam]).map((course) => {
        const count = getCourseSolvedCount(
          input.solvedQuestionsByCourse,
          exam,
          course,
          input.solvedQuestionsByTopic,
        );
        if (count === 0) return "";
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(`${exam} ${course}`)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${count.toLocaleString("tr-TR")}</td>
        </tr>`;
      }),
    )
    .join("");

  const weakestText =
    weakest.length === 0
      ? "Deneme kaydı yok."
      : weakest.map((course) => `${course.courseName} (${course.avgNet} net)`).join(", ");

  return emailShell(`
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5;">Veli Gelişim Raporu</p>
    <h1 style="margin:0 0 8px;font-size:22px;">${escapeHtml(input.studentName)}</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">
      Hedef: ${escapeHtml(input.target || "Belirtilmedi")} · ${escapeHtml(reportDate)}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="width:33%;padding:12px;background:#f8fafc;border-radius:10px;">
          <p style="margin:0;font-size:12px;color:#64748b;">Genel ilerleme</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;">%${overall}</p>
        </td>
        <td style="width:8px;"></td>
        <td style="width:33%;padding:12px;background:#f8fafc;border-radius:10px;">
          <p style="margin:0;font-size:12px;color:#64748b;">TYT konular</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;">%${tyt.percentage}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${tyt.completed}/${tyt.total}</p>
        </td>
        <td style="width:8px;"></td>
        <td style="width:33%;padding:12px;background:#f8fafc;border-radius:10px;">
          <p style="margin:0;font-size:12px;color:#64748b;">AYT konular</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;">%${ayt.percentage}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${ayt.completed}/${ayt.total}</p>
        </td>
      </tr>
    </table>
    <h2 style="margin:0 0 8px;font-size:16px;">Çözülen sorular</h2>
    <p style="margin:0 0 12px;">Toplam: <strong>${totalSolved.toLocaleString("tr-TR")}</strong></p>
    ${
      courseRows
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">${courseRows}</table>`
        : `<p style="margin:0 0 20px;color:#64748b;">Henüz soru kaydı girilmemiş.</p>`
    }
    <h2 style="margin:0 0 8px;font-size:16px;">Deneme özeti</h2>
    <p style="margin:0 0 6px;">TYT: ${tytExams.length} deneme, ortalama ${formatNet(avgNet(tytExams))} net, son ${formatNet(lastNet(tytExams))} net</p>
    <p style="margin:0 0 12px;">AYT: ${aytExams.length} deneme, ortalama ${formatNet(avgNet(aytExams))} net, son ${formatNet(lastNet(aytExams))} net</p>
    <p style="margin:0 0 20px;">En zayıf dersler: ${escapeHtml(weakestText)}</p>
    <p style="margin:0;font-size:13px;color:#64748b;">Bu rapor ${escapeHtml(input.teacherEmail)} tarafından gönderildi. Yanıtlamak için Yanıtla’ya basın.</p>
  `);
}

export function staffInviteSubject(kind: "invite" | "update") {
  return kind === "invite"
    ? "YKS Takip paneline eklendiniz"
    : "YKS Takip yetkiniz güncellendi";
}

export function developmentReportSubject(studentName: string) {
  const name = sanitizeSubject(studentName) || "Öğrenci";
  return `${name} gelişim raporu`;
}
