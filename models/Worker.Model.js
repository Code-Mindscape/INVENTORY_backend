import mongoose from "mongoose";
import bcrypt from "bcrypt";

const workerSchema = new mongoose.Schema(
  {
    workerID: {
      type: String,
      unique: true, // Ensures uniqueness
      required: true, // Prevents null values
      default: () => new mongoose.Types.ObjectId().toString(), // Generates unique ID
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    Orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order", // Orders added by this worker
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
workerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is modified
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check if password is correct
workerSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Worker = mongoose.model("Worker", workerSchema);
