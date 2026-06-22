const fs = require("node:fs/promises");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
  quiet: true
});

function toOneDecimal(value) {
  return Number(Number(value || 0).toFixed(1));
}

function calculateTotals(detectedItems) {
  return detectedItems.reduce((totals, item) => ({
    calories: toOneDecimal(totals.calories + Number(item.calories || 0)),
    protein: toOneDecimal(totals.protein + Number(item.protein || 0)),
    carbs: toOneDecimal(totals.carbs + Number(item.carbs || 0)),
    fat: toOneDecimal(totals.fat + Number(item.fat || 0))
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
}

function normalizeDetectedItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    clientItemId: String(item.clientItemId || `item-${index + 1}`),
    foodName: String(item.foodName || "unknown food").trim(),
    estimatedPortionGrams: toOneDecimal(item.estimatedPortionGrams),
    confidence: Number(Number(item.confidence || 0.5).toFixed(2)),
    calories: toOneDecimal(item.calories),
    protein: toOneDecimal(item.protein),
    carbs: toOneDecimal(item.carbs),
    fat: toOneDecimal(item.fat)
  })).filter((item) => item.foodName);
}

function mockAnalysis(file) {
  const detectedItems = [
    {
      clientItemId: "item-1",
      foodName: "chicken breast",
      estimatedPortionGrams: 180,
      confidence: 0.87,
      calories: 297,
      protein: 55.8,
      carbs: 0,
      fat: 6.5
    },
    {
      clientItemId: "item-2",
      foodName: "white rice",
      estimatedPortionGrams: 200,
      confidence: 0.81,
      calories: 260,
      protein: 5.4,
      carbs: 56,
      fat: 0.6
    },
    {
      clientItemId: "item-3",
      foodName: "salad",
      estimatedPortionGrams: 100,
      confidence: 0.72,
      calories: 25,
      protein: 1.2,
      carbs: 4,
      fat: 0.2
    }
  ];

  return {
    analysisId: "mock-analysis-1",
    imagePath: `uploads/${file.filename}`,
    modelName: "mock-gemini-vision",
    detectedItems,
    totals: calculateTotals(detectedItems),
    nextStep: "review_and_confirm"
  };
}

function buildPrompt() {
  return [
    "Analyze this meal image for a nutrition tracker.",
    "Return JSON only with this exact shape:",
    "{\"detectedItems\":[{\"foodName\":\"string\",\"estimatedPortionGrams\":100,\"confidence\":0.8,\"calories\":100,\"protein\":10,\"carbs\":10,\"fat\":5}]}",
    "Use realistic nutrition estimates for the visible prepared food. Do not include markdown."
  ].join(" ");
}

function extractGeminiText(responseBody) {
  const parts = responseBody &&
    responseBody.candidates &&
    responseBody.candidates[0] &&
    responseBody.candidates[0].content &&
    responseBody.candidates[0].content.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts.map((part) => part.text || "").join("").trim();
}

function parseJsonText(text) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let jsonText = fencedMatch ? fencedMatch[1] : text;

  // The model may wrap the JSON object in extra prose (for example a note after
  // it), so keep only the JSON object from the first "{" to the last "}".
  const start = jsonText.indexOf("{");
  const end = jsonText.lastIndexOf("}");
  if (start !== -1 && end > start) {
    jsonText = jsonText.slice(start, end + 1);
  }

  return JSON.parse(jsonText.trim());
}

async function callGemini(file) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const imageBuffer = await fs.readFile(file.path);

  const response = await fetch(`${endpoint}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: buildPrompt() },
          {
            inline_data: {
              mime_type: file.mimetype,
              data: imageBuffer.toString("base64")
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const responseBody = await response.json();
  const parsed = parseJsonText(extractGeminiText(responseBody));
  const detectedItems = normalizeDetectedItems(parsed.detectedItems);

  if (detectedItems.length === 0) {
    throw new Error("Gemini returned no detected food items");
  }

  return {
    analysisId: `gemini-${Date.now()}`,
    imagePath: `uploads/${file.filename}`,
    modelName: model,
    detectedItems,
    totals: calculateTotals(detectedItems),
    nextStep: "review_and_confirm"
  };
}

async function analyzeMealImage(file) {
  const mode = process.env.AI_MODE || "real";
  const provider = process.env.AI_PROVIDER || "gemini";
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  if (mode === "mock" || provider !== "gemini" || !hasGeminiKey) {
    return mockAnalysis(file);
  }

  try {
    return await callGemini(file);
  } catch (error) {
    console.warn(`Gemini image analysis failed; returning mock fallback. ${error.message}`);
    return mockAnalysis(file);
  }
}

module.exports = {
  analyzeMealImage,
  calculateTotals,
  mockAnalysis
};
