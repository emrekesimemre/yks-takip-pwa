import { z } from "zod";

const topicProgressSchema = z.object({
  id: z.string().min(1).max(80),
  isCompleted: z.boolean(),
});

const solvedMapSchema = z
  .record(z.string().min(1).max(80), z.number().int().min(0).max(100_000))
  .refine((value) => Object.keys(value).length <= 2000, {
    message: "Soru kaydı limiti aşıldı.",
  });

const mockExamCourseSchema = z.object({
  courseKey: z.string().min(1).max(80),
  correct: z.number().int().min(0).max(200),
  wrong: z.number().int().min(0).max(200),
  empty: z.number().int().min(0).max(200),
});

const mockExamSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  type: z.enum(["TYT", "AYT"]),
  date: z.string().min(4).max(40),
  courses: z.array(mockExamCourseSchema).max(20),
});

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, "Öğrenci adı gerekli.").max(80),
  target: z.string().trim().max(80).optional().default(""),
  parentEmail: z.unknown().optional(),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const patchStudentSchema = z.object({
  topics: z.array(topicProgressSchema).max(2000).optional(),
  weeklySelectedTopics: z.array(z.string().min(1).max(80)).max(500).optional(),
  solvedQuestionsByCourse: solvedMapSchema.optional(),
  solvedQuestionsByTopic: solvedMapSchema.optional(),
  weeklySolvedQuestionsByCourse: solvedMapSchema.optional(),
  weeklySolvedQuestionsByTopic: solvedMapSchema.optional(),
  mockExams: z.array(mockExamSchema).max(200).optional(),
  name: z.string().trim().min(1, "Öğrenci adı boş olamaz.").max(80).optional(),
  target: z.string().trim().max(80).optional(),
  parentEmail: z.unknown().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type StudentPatchInput = z.infer<typeof patchStudentSchema>;

export function zodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Geçersiz istek.";
}

export function studentPatchToUpdate(body: StudentPatchInput) {
  const updateFields: Record<string, unknown> = {};
  if (body.topics !== undefined) updateFields.topics = body.topics;
  if (body.weeklySelectedTopics !== undefined) {
    updateFields.weeklySelectedTopics = body.weeklySelectedTopics;
  }
  if (body.solvedQuestionsByCourse !== undefined) {
    updateFields.solvedQuestionsByCourse = body.solvedQuestionsByCourse;
  }
  if (body.solvedQuestionsByTopic !== undefined) {
    updateFields.solvedQuestionsByTopic = body.solvedQuestionsByTopic;
  }
  if (body.weeklySolvedQuestionsByCourse !== undefined) {
    updateFields.weeklySolvedQuestionsByCourse =
      body.weeklySolvedQuestionsByCourse;
  }
  if (body.weeklySolvedQuestionsByTopic !== undefined) {
    updateFields.weeklySolvedQuestionsByTopic = body.weeklySolvedQuestionsByTopic;
  }
  if (body.mockExams !== undefined) updateFields.mockExams = body.mockExams;
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.target !== undefined) updateFields.target = body.target;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  return updateFields;
}
