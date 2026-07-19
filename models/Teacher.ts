import mongoose, { Schema, models } from "mongoose";

const teacherSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Teacher = models.Teacher || mongoose.model("Teacher", teacherSchema);
export default Teacher;
