const { successResponse } = require("../utils/responseHelper"); //grab success helper
const AppError = require("../utils/AppError"); //grab custom error
const aiImageAnalysisService = require("../services/aiImageAnalysisService");

function analyzeMealImage(req, res) { //fake ai analysis
  const imageName = req.body.imageName; //get the image name

  if (!imageName) { //if they forgot it
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: imageName", { //send an error
      field: "imageName"
    });
  }

  if (typeof imageName !== 'string' || imageName.trim().length === 0) { //if it's empty
    throw new AppError(400, "VALIDATION_ERROR", "Image name must be a non-empty string.", { field: "imageName" }); //send an error
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']; //allowed file types
  const hasValidExtension = validExtensions.some(ext => imageName.toLowerCase().endsWith(ext)); //check if valid

  if (!hasValidExtension) { //if wrong file type
    throw new AppError(400, "VALIDATION_ERROR", "Invalid image format. Supported: jpg, jpeg, png, webp.", { field: "imageName" }); //send an error
  }


  const mockAiResult = { //our fake result
    imageName: imageName, //the image name
    modelName: "mock-gemini-vision", //fake model
    message: "This is a mock AI response. No real external AI API was called.", //disclaimer
    detectedItems: [ //what it 'found'
      {
        foodName: "chicken breast",
        estimatedPortionGrams: 180,
        confidence: 0.87,
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6
      },
      {
        foodName: "white rice",
        estimatedPortionGrams: 200,
        confidence: 0.81,
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3
      },
      {
        foodName: "salad",
        estimatedPortionGrams: 100,
        confidence: 0.72,
        calories: 25,
        protein: 1.2,
        carbs: 4,
        fat: 0.2
      }
    ],
    nextStep: "User should review, edit, delete, or confirm the detected items before saving the meal." //what to do next
  };

  return successResponse(res, 200, mockAiResult); //send back the fake data
}

async function analyzeUploadedMealImage(req, res) {
  if (!req.file) {
    throw new AppError(400, "VALIDATION_ERROR", "Missing required image file.", {
      field: "image"
    });
  }

  const analysis = await aiImageAnalysisService.analyzeMealImage(req.file, {
    mealDate: req.body.mealDate || null,
    userId: req.currentUserId || null
  });

  return successResponse(res, 200, analysis);
}

module.exports = { //share our ai function
  analyzeMealImage,
  analyzeUploadedMealImage
};
