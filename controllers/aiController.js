const { successResponse, errorResponse } = require("../utils/responseHelper");

function analyzeMealImage(req, res) {
  const imageName = req.body.imageName;

  if (!imageName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: imageName", {
      field: "imageName"
    });
  }

  const mockAiResult = {
    imageName: imageName,
    modelName: "mock-gemini-vision",
    message: "This is a mock AI response. No real external AI API was called.",
    detectedItems: [
      {
        foodName: "chicken breast",
        estimatedPortionGrams: 180,
        confidence: 0.87,
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6
      },
      {
        foodName: "white rice",
        estimatedPortionGrams: 200,
        confidence: 0.81,
        caloriesPer100g: 130,
        proteinPer100g: 2.7,
        carbsPer100g: 28,
        fatPer100g: 0.3
      },
      {
        foodName: "salad",
        estimatedPortionGrams: 100,
        confidence: 0.72,
        caloriesPer100g: 25,
        proteinPer100g: 1.2,
        carbsPer100g: 4,
        fatPer100g: 0.2
      }
    ],
    nextStep: "User should review, edit, delete, or confirm the detected items before saving the meal."
  };

  return successResponse(res, 200, mockAiResult);
}

module.exports = {
  analyzeMealImage
};
