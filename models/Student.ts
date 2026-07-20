import { Schema, model, models } from "mongoose";

const TopicProgressSchema = new Schema({
  id: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
});

const MockExamCourseResultSchema = new Schema(
  {
    courseKey: { type: String, required: true },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    empty: { type: Number, default: 0 },
  },
  { _id: false },
);

const MockExamSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["TYT", "AYT"], required: true },
    date: { type: String, required: true },
    courses: [MockExamCourseResultSchema],
  },
  { _id: false },
);

const StudentSchema = new Schema(
  {
    name: { type: String, required: true },
    target: { type: String }, // Sayısal 10k vb.
    teacherEmail: { type: String, required: true }, // Hangi öğretmenin öğrencisi? Güvenlik için.
    topics: [TopicProgressSchema],
    weeklySelectedTopics: { type: [String], default: [] },
    solvedQuestionsByCourse: { type: Map, of: Number, default: {} },
    solvedQuestionsByTopic: { type: Map, of: Number, default: {} },
    weeklySolvedQuestionsByCourse: { type: Map, of: Number, default: {} },
    weeklySolvedQuestionsByTopic: { type: Map, of: Number, default: {} },
    mockExams: { type: [MockExamSchema], default: [] },
  },
  { timestamps: true },
);

StudentSchema.set("toJSON", { flattenMaps: true });
StudentSchema.set("toObject", { flattenMaps: true });

// HMR sırasında eski şema cache'lenmesin — yeni alanlar kaybolmasın
if (models.Student) {
  delete models.Student;
}

const Student = models.Student || model("Student", StudentSchema);

export default Student;
