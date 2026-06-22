import { request, requestMultipart, USE_MOCKS } from "./api";
import { mockAnalyzeImage, mockSaveMealFromAi } from "./mocks/aiMocks";

// POST /api/ai/analyze-image — sends the photo as multipart/form-data (field "image").
// Returns { analysisId, imagePath, detectedItems[], totals, nextStep } per the contract.
export async function analyzeImage(file, mealDate) {
  if (USE_MOCKS) {
    return mockAnalyzeImage(file, mealDate);
  }

  const formData = new FormData();
  formData.append("image", file);

  if (mealDate) {
    formData.append("mealDate", mealDate);
  }

  return requestMultipart("/api/ai/analyze-image", formData);
}

// POST /api/meals/from-ai — saves the user-reviewed AI result as a real meal.
// The backend derives the owner from the auth header; we never send a trusted userId.
// `payload` = { analysisId, mealName, mealDate, imagePath, items[] }. Returns { mealId, meal }.
export async function saveMealFromAi(payload) {
  if (USE_MOCKS) {
    return mockSaveMealFromAi(payload);
  }

  return request("/api/meals/from-ai", {
    method: "POST",
    body: payload
  });
}
