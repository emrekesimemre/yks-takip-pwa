import { NextResponse } from "next/server";
import { clientIp, jsonError, readJsonBody } from "@/lib/api";
import { requireAdminSession } from "@/lib/api-auth";
import { staffInviteHtml, staffInviteSubject } from "@/lib/emails";
import { sendMail } from "@/lib/mail";
import { consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createStaff,
  deleteStaff,
  isBootstrapAdminEmail,
  listStaff,
  normalizeEmail,
  StaffError,
  updateStaffRoles,
} from "@/lib/staff";

function staffErrorResponse(error: unknown) {
  if (error instanceof StaffError) {
    return jsonError(error.message, error.status);
  }
  console.error(error);
  return jsonError("Personel işlemi başarısız.", 500);
}

function staffManagerForbidden() {
  return jsonError(
    "Personel ekleme, silme ve yetki değişikliği yalnızca ortam ayarındaki yöneticiye açıktır.",
    403,
  );
}

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    if (!isBootstrapAdminEmail(auth.email)) return staffManagerForbidden();

    const staff = await listStaff();
    return NextResponse.json({ staff, currentEmail: auth.email });
  } catch (error) {
    return staffErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    if (!isBootstrapAdminEmail(auth.email)) return staffManagerForbidden();

    const limited = consumeRateLimit(
      `staff-invite:${auth.email}:${clientIp(req)}`,
      10,
      10 * 60 * 1000,
    );
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const parsedBody = await readJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data as { email?: unknown; roles?: unknown };

    await createStaff(auth.email, body.email, body.roles);
    const staff = await listStaff();
    const invitedEmail = normalizeEmail(body.email);
    const created = staff.find((member) => member.email === invitedEmail);
    let emailSent = false;
    if (invitedEmail && created) {
      const mail = await sendMail({
        to: invitedEmail,
        subject: staffInviteSubject("invite"),
        html: staffInviteHtml({
          roles: created.roles,
          actorEmail: auth.email,
          kind: "invite",
        }),
        replyTo: auth.email,
      });
      emailSent = mail.sent;
    }
    return NextResponse.json(
      { staff, currentEmail: auth.email, emailSent },
      { status: 201 },
    );
  } catch (error) {
    return staffErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    if (!isBootstrapAdminEmail(auth.email)) return staffManagerForbidden();

    const limited = consumeRateLimit(
      `staff-update:${auth.email}:${clientIp(req)}`,
      20,
      10 * 60 * 1000,
    );
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const parsedBody = await readJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data as { email?: unknown; roles?: unknown };

    await updateStaffRoles(auth.email, body.email, body.roles);
    const staff = await listStaff();
    const updatedEmail = normalizeEmail(body.email);
    const updated = staff.find((member) => member.email === updatedEmail);
    let emailSent = false;
    if (updatedEmail && updated) {
      const mail = await sendMail({
        to: updatedEmail,
        subject: staffInviteSubject("update"),
        html: staffInviteHtml({
          roles: updated.roles,
          actorEmail: auth.email,
          kind: "update",
        }),
        replyTo: auth.email,
      });
      emailSent = mail.sent;
    }
    return NextResponse.json({
      staff,
      currentEmail: auth.email,
      emailSent,
    });
  } catch (error) {
    return staffErrorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    if (!isBootstrapAdminEmail(auth.email)) return staffManagerForbidden();

    const parsedBody = await readJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data as { email?: unknown };

    await deleteStaff(auth.email, body.email);
    const staff = await listStaff();
    return NextResponse.json({ staff, currentEmail: auth.email });
  } catch (error) {
    return staffErrorResponse(error);
  }
}
