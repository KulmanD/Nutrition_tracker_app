import { useState } from "react";
import { NavLink } from "react-router-dom";
import { analyzeImage, saveMealFromAi } from "../services/aiService";
import { detectedToFormItem, emptyFoodItem } from "../utils/mealFormHelpers";
import { todayLocalISO } from "../utils/date";
import SharedMealForm from "./SharedMealForm";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

// The AI side of the unified Meals tab: it adds the image upload and analyze step and
// the saved screen, and reuses SharedMealForm for reviewing and confirming the result.
function AiMealForm({ onSaved }) {
  const [step, setStep] = useState("select"); // "select" | "review"

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [analysisId, setAnalysisId] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [reviewInitialValues, setReviewInitialValues] = useState(null);
  const [savedMeal, setSavedMeal] = useState(null);

  function handleFileChange(event) {
    const selected = event.target.files[0];
    setAnalyzeError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!selected) {
      setFile(null);
      setPreviewUrl("");
      setFileError("");
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFile(null);
      setPreviewUrl("");
      setFileError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setFile(null);
      setPreviewUrl("");
      setFileError(`Image must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setFileError("");
  }

  async function handleAnalyze() {
    if (!file) {
      setFileError("Please choose an image first.");
      return;
    }

    setAnalyzing(true);
    setAnalyzeError("");

    try {
      const result = await analyzeImage(file);
      const items = (result.detectedItems || []).map(detectedToFormItem);

      setAnalysisId(result.analysisId || null);
      setImagePath(result.imagePath || null);
      setReviewInitialValues({
        mealName: `AI meal ${todayLocalISO()}`,
        mealDate: todayLocalISO(),
        items: items.length > 0 ? items : [{ ...emptyFoodItem }]
      });
      setSavedMeal(null);
      setStep("review");
    } catch (error) {
      setAnalyzeError(error.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm(payload) {
    const result = await saveMealFromAi({ ...payload, analysisId, imagePath });
    setSavedMeal(result.meal || { mealId: result.mealId, ...payload });

    if (onSaved) {
      onSaved();
    }
  }

  function handleStartOver() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setStep("select");
    setFile(null);
    setPreviewUrl("");
    setFileError("");
    setAnalyzeError("");
    setAnalysisId(null);
    setImagePath(null);
    setReviewInitialValues(null);
    setSavedMeal(null);
  }

  if (step === "select") {
    return (
      <>
        <div className="section-heading">
          <h2>Upload a meal photo</h2>
          <span>Step 1 of 2</span>
        </div>

        <form className="meal-form" onSubmit={(event) => event.preventDefault()} noValidate>
          <label htmlFor="mealImage">Meal photo</label>
          <input
            id="mealImage"
            name="mealImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <p className="status-text">Accepted: JPG, PNG, or WEBP. Max {MAX_SIZE_MB} MB.</p>
          {fileError && <p className="field-error">{fileError}</p>}

          {previewUrl && (
            <img src={previewUrl} alt="Selected meal preview" className="image-preview" />
          )}

          {analyzeError && <p className="alert error-alert">{analyzeError}</p>}

          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
            disabled={!file || analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze meal"}
          </button>
        </form>
      </>
    );
  }

  if (savedMeal) {
    return (
      <>
        <p className="alert success-alert">Meal saved successfully.</p>

        <div className="section-heading">
          <h2>{savedMeal.mealName}</h2>
          <span>{savedMeal.mealDate}</span>
        </div>

        <div className="table-actions">
          <button type="button" className="primary-button" onClick={handleStartOver}>
            Add another meal
          </button>
          <NavLink to="/dashboard" className="secondary-button small-button">
            View dashboard
          </NavLink>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-heading">
        <h2>Review &amp; confirm</h2>
        <span>Step 2 of 2</span>
      </div>

      <p className="status-text">
        The AI detected these items. Fix any names or amounts, remove wrong items, or add missing
        ones, then confirm to save the meal.
      </p>

      <SharedMealForm
        initialValues={reviewInitialValues}
        onSubmit={handleConfirm}
        submitLabel="Confirm & save meal"
        submittingLabel="Saving..."
        secondaryButton={{ label: "Start over", onClick: handleStartOver }}
      />
    </>
  );
}

export default AiMealForm;
