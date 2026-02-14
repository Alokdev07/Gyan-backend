import Attempt from "../model/attempt.model.js";
import User from "../model/user.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";

const saveHistory = asyncHandler(async (req, res) => {
  const { attempts } = req.body;

  if (!attempts || !Array.isArray(attempts) || attempts.length === 0) {
    throw new ApiError("No attempts provided", [], 400);
  }

  const userId = req.user._id;

  let totalXP = 0;
  const savedAttempts = [];

  for (const item of attempts) {
    const { questionId, selectedOption, isCorrect } = item;

    try {
      const xpEarned = isCorrect ? 5 : 0;

      const attempt = await Attempt.create({
        user: userId,
        question: questionId,
        selectedOption,
        isCorrect,
        xpEarned,
      });

      totalXP += xpEarned;
      savedAttempts.push(attempt);
    } catch (error) {
      if (error.code === 11000) {
        continue;
      } else {
        throw error;
      }
    }
  }

  await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: totalXP } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalXPAdded: totalXP,
        attemptsSaved: savedAttempts.length,
      },
      "Quiz history saved successfully"
    )
  );
});

const getHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const history = await Attempt.find({ user: user._id }).populate({
    path: "question",
    populate: {
      path: "createdBy",
      select: "username",
    },
  });

  if (!history) throw new ApiError("internal server error", [], 500);
  return res
    .status(200)
    .json(new ApiResponse(200, { history }, "history fetched successfully"));
});

export { saveHistory,getHistory };
