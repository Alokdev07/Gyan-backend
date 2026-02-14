import Question from "../model/question.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import User from "../model/user.model.js";
import Attempt from "../model/attempt.model.js";

const createQuestion = asyncHandler(async (req, res) => {
  const { question, options, answer, expiryTime, subject } = req.body;

  if (
    !question ||
    !subject ||
    !options ||
    options.length !== 4 ||
    options.some((opt) => !opt || opt.trim() === "") ||
    answer === undefined ||
    answer === null
  ) {
    throw new ApiError("All fields are required", [], 400);
  }

  const user = req.user;

  const newQuestion = await Question.create({
    question,
    options,
    answer,
    expiryTime: expiryTime || "unlimited",
    subject,
    createdBy: user._id,
  });

  if (!newQuestion) throw new ApiError("internal server error", [], 500);

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $inc: { xp: 5 } },
    { new: true }
  );
  if (!updatedUser) throw new ApiError("internal server error", [], 500);

  return res
    .status(201)
    .json(new ApiResponse(201, newQuestion, "Question created successfully"));
});

const getQuestion = asyncHandler(async (req, res) => {
  const { subject, lastId, limit = 5 } = req.query;
  const userId = req.user._id;

  if (!subject) {
    throw new ApiError("Subject is required", [], 400);
  }

  const limitNumber = Number(limit);

  const attemptedQuestions = await Attempt.find({ user: userId })
    .select("question")
    .lean();

  const attemptedIds = attemptedQuestions.map(a => a.question);


  let filter = {
    _id: { $nin: attemptedIds }  
  };

  if (subject !== "All") {
    filter.subject = subject;
  }

  if (lastId) {
    filter._id = { 
      ...filter._id,
      $lt: lastId 
    };
  }

  const questions = await Question.find(filter)
    .sort({ _id: -1 })
    .limit(limitNumber)
    .populate("createdBy", "username")
    .lean();

  const newLastId =
    questions.length > 0 ? questions[questions.length - 1]._id : null;

  const hasMore = questions.length === limitNumber;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        questions,
        newLastId,
        hasMore,
      },
      "Unattempted questions fetched successfully"
    )
  );
});

export { createQuestion, getQuestion };
