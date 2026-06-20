// Local mock fixtures for the A4 AI endpoints.
//
// These MIRROR docs/API_CONTRACT.md byte-for-byte (same field names + nesting), so any UI
// built against them works unchanged once wired to Denis's real backend. Enabled by setting
// REACT_APP_USE_MOCKS=true (see .env.example). Pure functions returning Promises so they are
// drop-in replacements for the real network calls.

// Mirrors the success `data` of POST /api/ai/analyze-image.
export function mockAnalyzeImage() {
  return Promise.resolve({
    analysisId: "mock-analysis-1",
    imagePath: "uploads/mock-meal.jpg",
    modelName: "mock-gemini-vision",
    detectedItems: [
      { clientItemId: "item-1", foodName: "chicken breast", estimatedPortionGrams: 180, confidence: 0.87, calories: 297, protein: 55.8, carbs: 0, fat: 6.5 },
      { clientItemId: "item-2", foodName: "white rice", estimatedPortionGrams: 200, confidence: 0.81, calories: 260, protein: 5.4, carbs: 56, fat: 0.6 },
      { clientItemId: "item-3", foodName: "salad", estimatedPortionGrams: 100, confidence: 0.72, calories: 25, protein: 1.2, carbs: 4, fat: 0.2 }
    ],
    totals: { calories: 582, protein: 62.4, carbs: 60, fat: 7.3 },
    nextStep: "review_and_confirm"
  });
}

// Mirrors the success `data` of POST /api/meals/from-ai. Echoes the reviewed payload back
// as a saved meal so the confirm flow can show a result without a real backend.
export function mockSaveMealFromAi(payload) {
  return Promise.resolve({
    mealId: 999,
    meal: {
      mealId: 999,
      mealName: payload.mealName,
      mealDate: payload.mealDate,
      imagePath: payload.imagePath || null,
      items: payload.items || []
    }
  });
}
