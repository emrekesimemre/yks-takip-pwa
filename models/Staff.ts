import { Schema, model, models } from "mongoose";

const StaffSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    roles: {
      type: [{ type: String, enum: ["admin", "teacher"] }],
      required: true,
    },
  },
  { timestamps: true },
);

if (models.Staff) {
  delete models.Staff;
}

const Staff = models.Staff || model("Staff", StaffSchema);

export default Staff;
