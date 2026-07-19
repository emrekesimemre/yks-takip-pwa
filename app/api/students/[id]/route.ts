import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";
import Student from "@/models/Student";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Güvenlik: Sadece kendi öğrencisini görebilsin
    const student = await Student.findOne({
      _id: id,
      teacherEmail: session.user.email,
    });

    if (!student) {
      return NextResponse.json(
        { error: "Öğrenci bulunamadı veya yetkiniz yok." },
        { status: 404 },
      );
    }

    return NextResponse.json(student.toObject(), { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Öğrenci bilgileri alınırken hata oluştu." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();
    const updateFields: Record<string, unknown> = {};

    if (body.topics !== undefined) {
      updateFields.topics = body.topics;
    }
    if (body.weeklySelectedTopics !== undefined) {
      updateFields.weeklySelectedTopics = body.weeklySelectedTopics;
    }
    if (body.solvedQuestionsByCourse !== undefined) {
      updateFields.solvedQuestionsByCourse = body.solvedQuestionsByCourse;
    }
    if (body.weeklySolvedQuestionsByCourse !== undefined) {
      updateFields.weeklySolvedQuestionsByCourse =
        body.weeklySolvedQuestionsByCourse;
    }
    if (body.mockExams !== undefined) {
      updateFields.mockExams = body.mockExams;
    }
    if (body.name !== undefined) {
      const trimmedName = String(body.name).trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: "Öğrenci adı boş olamaz." },
          { status: 400 },
        );
      }
      updateFields.name = trimmedName;
    }
    if (body.target !== undefined) {
      updateFields.target = String(body.target).trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek alan belirtilmedi." },
        { status: 400 },
      );
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, teacherEmail: session.user.email },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!student) {
      return NextResponse.json(
        { error: "Öğrenci bulunamadı veya yetkiniz yok." },
        { status: 404 },
      );
    }

    return NextResponse.json(student.toObject(), { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Öğrenci güncellenirken hata oluştu." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const student = await Student.findOneAndDelete({
      _id: id,
      teacherEmail: session.user.email,
    });

    if (!student) {
      return NextResponse.json(
        { error: "Öğrenci bulunamadı veya yetkiniz yok." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Öğrenci silinirken hata oluştu." },
      { status: 500 },
    );
  }
}
