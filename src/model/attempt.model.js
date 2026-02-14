import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true
    },

    selectedOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },

    isCorrect: {
      type: Boolean,
      required: true
    },

    xpEarned: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

AttemptSchema.index({ user: 1, question: 1 }, { unique: true });

const Attempt = mongoose.model("Attempt", AttemptSchema);

export default Attempt;
