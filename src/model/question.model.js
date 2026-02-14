import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: 5,
      maxlength: 500,
    },

    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: {
        validator: function (value) {
          return value.length === 4;
        },
        message: "Exactly 4 options are required",
      },
    },

    answer: {
      type: Number,
      required: [true, "Correct answer is required"],
      min: 0,
      max: 3,
    },

    expiryTime: {
      type: String,
      enum: ["unlimited","1m", "2m", "3m", "4m", "5m"],
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject : {
        type : String,
        required : true,
        minlength : 3,
        maxlength : 100,
        index : true
    },
    ranking : {
      type : Number,
      minlength : 0,
      maxlength : 5,
      default : 0
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
