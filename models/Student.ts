import { Schema, model, models } from "mongoose";

const TopicProgressSchema = new Schema({
  id: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
});

const MockExamCourseResultSchema = new Schema(
  {
    courseKey: { type: String, required: true },
    courseName: { type: String, default: "" },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    empty: { type: Number, default: 0 },
  },
  { _id: false },
);

const MockExamTopicResultSchema = new Schema(
  {
    courseKey: { type: String, default: "" },
    courseName: { type: String, default: "" },
    topicName: { type: String, required: true },
    questionCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    emptyCount: { type: Number, default: 0 },
    matchedTopicId: { type: String, default: "" },
    matchedTopicTitle: { type: String, default: "" },
  },
  { _id: false },
);

const MockExamWrongTopicSchema = new Schema(
  {
    courseKey: { type: String, default: "" },
    courseName: { type: String, default: "" },
    topicName: { type: String, required: true },
    questionCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    emptyCount: { type: Number, default: 0 },
    matchedTopicId: { type: String, default: "" },
    matchedTopicTitle: { type: String, default: "" },
  },
  { _id: false },
);

const MockExamSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    date: { type: String, required: true },
    courses: [MockExamCourseResultSchema],
    topics: { type: [MockExamTopicResultSchema], default: [] },
    wrongTopics: { type: [MockExamWrongTopicSchema], default: [] },
  },
  { _id: false },
);

const SchoolExamEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    subject: { type: String, required: true },
    term: { type: Number, enum: [1, 2], required: true },
    examIndex: { type: Number, enum: [1, 2, 3], required: true },
    score: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false },
);

const StudentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    grade: {
      type: String,
      enum: ["9", "10", "11", "12", "mezun"],
      default: "12",
    },
    field: {
      type: String,
      enum: ["sayisal", "esit-agirlik", "sozel", "dil", "genel", ""],
      default: "",
    },
    target: { type: String, trim: true, maxlength: 80 },
    teacherEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    parentEmail: { type: String, default: "", lowercase: true, trim: true },
    parentPhone: { type: String, default: "", trim: true, maxlength: 25 },
    reportToken: {
      type: String,
      default: () => crypto.randomUUID(),
      trim: true,
    },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    topics: [TopicProgressSchema],
    weeklySelectedTopics: { type: [String], default: [] },
    solvedQuestionsByCourse: { type: Map, of: Number, default: {} },
    solvedQuestionsByTopic: { type: Map, of: Number, default: {} },
    weeklySolvedQuestionsByCourse: { type: Map, of: Number, default: {} },
    weeklySolvedQuestionsByTopic: { type: Map, of: Number, default: {} },
    mockExams: { type: [MockExamSchema], default: [] },
    schoolGrades: { type: [SchoolExamEntrySchema], default: [] },
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
