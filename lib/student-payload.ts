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
  courseName: z.string().max(80).optional(),
  correct: z.number().int().min(0).max(200),
  wrong: z.number().int().min(0).max(200),
  empty: z.number().int().min(0).max(200),
});

const mockExamTopicSchema = z.object({
  courseKey: z.string().max(80).optional(),
  courseName: z.string().max(80).optional(),
  topicName: z.string().min(1).max(200),
  questionCount: z.number().int().min(0).max(100).optional(),
  correctCount: z.number().int().min(0).max(100).optional(),
  wrongCount: z.number().int().min(0).max(100).optional(),
  emptyCount: z.number().int().min(0).max(100).optional(),
  matchedTopicId: z.string().max(100).optional(),
  matchedTopicTitle: z.string().max(200).optional(),
});

const mockExamWrongTopicSchema = z.object({
  courseKey: z.string().max(80).optional(),
  courseName: z.string().max(80).optional(),
  topicName: z.string().min(1).max(200),
  questionCount: z.number().int().min(0).max(100).optional(),
  correctCount: z.number().int().min(0).max(100).optional(),
  wrongCount: z.number().int().min(0).max(100).optional(),
  emptyCount: z.number().int().min(0).max(100).optional(),
  matchedTopicId: z.string().max(100).optional(),
  matchedTopicTitle: z.string().max(200).optional(),
});

const schoolExamEntrySchema = z.object({
  id: z.string().min(1).max(80),
  subject: z.string().min(1).max(80),
  term: z.union([z.literal(1), z.literal(2)]),
  examIndex: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  score: z.number().min(0).max(100),
});

const mockExamSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  type: z.string().min(1).max(40),
  date: z.string().min(4).max(40),
  courses: z.array(mockExamCourseSchema).max(30),
  topics: z.array(mockExamTopicSchema).max(500).optional(),
  wrongTopics: z.array(mockExamWrongTopicSchema).max(500).optional(),
});

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, "Öğrenci adı gerekli.").max(80),
  grade: z.enum(["9", "10", "11", "12", "mezun"]).optional().default("12"),
  field: z.enum(["sayisal", "esit-agirlik", "sozel", "dil", "genel", ""]).optional().default(""),
  target: z.string().trim().max(80).optional().default(""),
  parentEmail: z.unknown().optional(),
  parentPhone: z.string().trim().max(25).optional().default(""),
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
  schoolGrades: z.array(schoolExamEntrySchema).max(300).optional(),
  name: z.string().trim().min(1, "Öğrenci adı boş olamaz.").max(80).optional(),
  grade: z.enum(["9", "10", "11", "12", "mezun"]).optional(),
  field: z.enum(["sayisal", "esit-agirlik", "sozel", "dil", "genel", ""]).optional(),
  target: z.string().trim().max(80).optional(),
  parentEmail: z.unknown().optional(),
  parentPhone: z.string().trim().max(25).optional(),
  reportToken: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type StudentPatchInput = z.infer<typeof patchStudentSchema>;

export function zodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Geçersiz istek.";
}

export function sanitizeMapKeys(
  map?: Record<string, number>,
): Record<string, number> | undefined {
  if (!map) return undefined;
  const sanitized: Record<string, number> = {};
  for (const [key, value] of Object.entries(map)) {
    const safeKey = key.replace(/\./g, "");
    sanitized[safeKey] = value;
  }
  return sanitized;
}

export function studentPatchToUpdate(body: StudentPatchInput) {
  const updateFields: Record<string, unknown> = {};
  if (body.topics !== undefined) updateFields.topics = body.topics;
  if (body.weeklySelectedTopics !== undefined) {
    updateFields.weeklySelectedTopics = body.weeklySelectedTopics;
  }
  if (body.solvedQuestionsByCourse !== undefined) {
    updateFields.solvedQuestionsByCourse = sanitizeMapKeys(
      body.solvedQuestionsByCourse,
    );
  }
  if (body.solvedQuestionsByTopic !== undefined) {
    updateFields.solvedQuestionsByTopic = sanitizeMapKeys(
      body.solvedQuestionsByTopic,
    );
  }
  if (body.weeklySolvedQuestionsByCourse !== undefined) {
    updateFields.weeklySolvedQuestionsByCourse = sanitizeMapKeys(
      body.weeklySolvedQuestionsByCourse,
    );
  }
  if (body.weeklySolvedQuestionsByTopic !== undefined) {
    updateFields.weeklySolvedQuestionsByTopic = sanitizeMapKeys(
      body.weeklySolvedQuestionsByTopic,
    );
  }
  if (body.mockExams !== undefined) updateFields.mockExams = body.mockExams;
  if (body.schoolGrades !== undefined) updateFields.schoolGrades = body.schoolGrades;
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.grade !== undefined) updateFields.grade = body.grade;
  if (body.field !== undefined) updateFields.field = body.field;
  if (body.target !== undefined) updateFields.target = body.target;
  if (body.parentPhone !== undefined) updateFields.parentPhone = body.parentPhone;
  if (body.reportToken !== undefined) updateFields.reportToken = body.reportToken;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  return updateFields;
}
