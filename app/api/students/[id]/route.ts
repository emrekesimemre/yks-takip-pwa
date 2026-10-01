import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import { parseOptionalEmail } from "@/lib/mail";
import {
  isMongoCastError,
  jsonError,
  parseObjectIdParam,
  readJsonBody,
} from "@/lib/api";
import { requireTeacherSession } from "@/lib/api-auth";
import {
  patchStudentSchema,
  studentPatchToUpdate,
  zodErrorMessage,
} from "@/lib/student-payload";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const invalidId = parseObjectIdParam(id);
    if (invalidId) return invalidId;

    const auth = await requireTeacherSession();
    if (!auth.ok) return auth.response;

    await connectMongo();

    const student = await Student.findOne({
      _id: id,
      teacherEmail: auth.email,
    });

    if (!student) {
      return jsonError("Öğrenci bulunamadı veya yetkiniz yok.", 404);
    }

    return NextResponse.json(student.toObject({ flattenMaps: true }), {
      status: 200,
    });
  } catch (error) {
    if (isMongoCastError(error)) {
      return jsonError("Geçersiz öğrenci kimliği.", 400);
    }
    console.error("Öğrenci bilgileri alınırken hata:", error);
    return jsonError("Öğrenci bilgileri alınırken hata oluştu.", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const invalidId = parseObjectIdParam(id);
    if (invalidId) return invalidId;

    const auth = await requireTeacherSession();
    if (!auth.ok) return auth.response;

    const parsedBody = await readJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = patchStudentSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const updateFields = studentPatchToUpdate(parsed.data);
    if (parsed.data.parentEmail !== undefined) {
      const parentEmail = parseOptionalEmail(parsed.data.parentEmail);
      if (parentEmail === null) {
        return jsonError("Geçerli bir veli e-postası girin.", 400);
      }
      updateFields.parentEmail = parentEmail;
    }

    if (Object.keys(updateFields).length === 0) {
      return jsonError("Güncellenecek alan belirtilmedi.", 400);
    }

    await connectMongo();

    const student = await Student.findOneAndUpdate(
      { _id: id, teacherEmail: auth.email },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!student) {
      return jsonError("Öğrenci bulunamadı veya yetkiniz yok.", 404);
    }

    return NextResponse.json(student.toObject({ flattenMaps: true }), {
      status: 200,
    });
  } catch (error) {
    if (isMongoCastError(error)) {
      return jsonError("Geçersiz öğrenci kimliği.", 400);
    }
    console.error("Öğrenci güncellenirken hata:", error);
    return jsonError("Öğrenci güncellenirken hata oluştu.", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const invalidId = parseObjectIdParam(id);
    if (invalidId) return invalidId;

    const auth = await requireTeacherSession();
    if (!auth.ok) return auth.response;

    await connectMongo();

    const student = await Student.findOneAndDelete({
      _id: id,
      teacherEmail: auth.email,
    });

    if (!student) {
      return jsonError("Öğrenci bulunamadı veya yetkiniz yok.", 404);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (isMongoCastError(error)) {
      return jsonError("Geçersiz öğrenci kimliği.", 400);
    }
    console.error("Öğrenci silinirken hata:", error);
    return jsonError("Öğrenci silinirken hata oluştu.", 500);
  }
}
