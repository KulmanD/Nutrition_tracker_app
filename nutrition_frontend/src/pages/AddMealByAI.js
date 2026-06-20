import { useState } from "react";
import { NavLink } from "react-router-dom";
import { analyzeImage, saveMealFromAi } from "../services/aiService";
import { todayLocalISO } from "../utils/date";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

const NUMERIC_FIELDS = [
  { name: "confirmedPortionGrams", label: "Portion grams" },
  { name: "calories", label: "Calories" },
  { name: "protein", label: "Protein" },
  { name: "carbs", label: "Carbs" },
  { name: "fat", label: "Fat" }
];

const emptyFoodItem = {
  foodName: "",
  confirmedPortionGrams: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: ""
};

// The AI returns "estimatedPortionGrams"; on save we use "confirmedPortionGrams"
// (the user-reviewed value). See docs/API_CONTRACT.md (1).
function detectedToFormItem(detected) {
  return {
    foodName: detected.foodName || "",
    confirmedPortionGrams: String(detected.estimatedPortionGrams ?? ""),
    calories: String(detected.calories ?? ""),
    protein: String(detected.protein ?? ""),
    carbs: String(detected.carbs ?? ""),
    fat: String(detected.fat ?? "")
  };
}

function itemError(formErrors, index, field) {
  if (!formErrors.items || !formErrors.items[index]) {
    return "";
  }
  return formErrors.items[index][field] || "";
}

function validateReviewedMeal(values) {
  const nextErrors = {};

  if (!values.mealName.trim()) {
    nextErrors.mealName = "Meal name is required.";
  }

  if (!values.mealDate) {
    nextErrors.mealDate = "Meal date is required.";
  }

  const itemErrors = values.items.map((item) => {
    const currentErrors = {};

    if (!item.foodName.trim()) {
      currentErrors.foodName = "Food name is required.";
    }

    for (const field of NUMERIC_FIELDS) {
      const raw = item[field.name];
      const value = Number(raw);

      if (raw === "") {
        currentErrors[field.name] = "This field is required.";
      } else if (Number.isNaN(value) || value < 0) {
        currentErrors[field.name] = "Enter a valid non-negative number.";
      }
    }

    if (Number(item.confirmedPortionGrams) <= 0 && !currentErrors.confirmedPortionGrams) {
      currentErrors.confirmedPortionGrams = "Portion must be greater than 0.";
    }

    return currentErrors;
  });

  if (itemErrors.some((currentErrors) => Object.keys(currentErrors).length > 0)) {
    nextErrors.items = itemErrors;
  }

  return nextErrors;
}

function AddMealByAI() {
  const [step, setStep] = useState("select"); // "select" | "review"

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [analysisId, setAnalysisId] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [formValues, setFormValues] = useState({
    mealName: "",
    mealDate: todayLocalISO(),
    items: []
  });
  const [formErrors, setFormErrors] = useState({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
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
      setFormValues({
        mealName: `AI meal ${todayLocalISO()}`,
        mealDate: todayLocalISO(),
        items: items.length > 0 ? items : [{ ...emptyFoodItem }]
      });
      setFormErrors({});
      setSavedMeal(null);
      setStep("review");
    } catch (error) {
      setAnalyzeError(error.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  function handleItemChange(index, event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      items: currentValues.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item
      )
    }));
  }

  function handleAddItem() {
    setFormValues((currentValues) => ({
      ...currentValues,
      items: [...currentValues.items, { ...emptyFoodItem }]
    }));
  }

  function handleRemoveItem(index) {
    setFormValues((currentValues) => {
      if (currentValues.items.length === 1) {
        return currentValues;
      }
      return {
        ...currentValues,
        items: currentValues.items.filter((item, itemIndex) => itemIndex !== index)
      };
    });
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setSaveError("");

    const nextErrors = validateReviewedMeal(formValues);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        analysisId,
        mealName: formValues.mealName.trim(),
        mealDate: formValues.mealDate,
        imagePath,
        items: formValues.items.map((item) => ({
          foodName: item.foodName.trim(),
          confirmedPortionGrams: Number(item.confirmedPortionGrams),
          calories: Number(item.calories),
          protein: Number(item.protein),
          carbs: Number(item.carbs),
          fat: Number(item.fat)
        }))
      };

      const result = await saveMealFromAi(payload);
      setSavedMeal(result.meal || { mealId: result.mealId, ...payload });
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
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
    setFormValues({ mealName: "", mealDate: todayLocalISO(), items: [] });
    setFormErrors({});
    setSaveError("");
    setSavedMeal(null);
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">AI assistant</p>
          <h1>Add Meal with AI</h1>
        </div>
      </div>

      {step === "select" && (
        <section className="content-block">
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
        </section>
      )}

      {step === "review" && savedMeal && (
        <section className="content-block">
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
            <NavLink to="/meals" className="secondary-button small-button">
              View meals
            </NavLink>
          </div>
        </section>
      )}

      {step === "review" && !savedMeal && (
        <section className="content-block">
          <div className="section-heading">
            <h2>Review &amp; confirm</h2>
            <span>Step 2 of 2</span>
          </div>

          <p className="status-text">
            The AI detected these items. Fix any names or amounts, remove wrong items, or add
            missing ones, then confirm to save the meal.
          </p>

          <form className="meal-form" onSubmit={handleConfirm} noValidate>
            <label htmlFor="mealName">Meal name</label>
            <input
              id="mealName"
              name="mealName"
              type="text"
              value={formValues.mealName}
              onChange={handleFieldChange}
              placeholder="Lunch"
            />
            {formErrors.mealName && <p className="field-error">{formErrors.mealName}</p>}

            <label htmlFor="mealDate">Meal date</label>
            <input
              id="mealDate"
              name="mealDate"
              type="date"
              value={formValues.mealDate}
              onChange={handleFieldChange}
            />
            {formErrors.mealDate && <p className="field-error">{formErrors.mealDate}</p>}

            <div className="food-items-list">
              {formValues.items.map((item, index) => (
                <div className="food-item-card" key={index}>
                  <div className="item-heading">
                    <h3>Food item {index + 1}</h3>
                    <button
                      type="button"
                      className="secondary-button small-button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formValues.items.length === 1}
                    >
                      Remove item
                    </button>
                  </div>

                  <label htmlFor={`foodName-${index}`}>Food name</label>
                  <input
                    id={`foodName-${index}`}
                    name="foodName"
                    type="text"
                    value={item.foodName}
                    onChange={(event) => handleItemChange(index, event)}
                    placeholder="Chicken breast"
                  />
                  {itemError(formErrors, index, "foodName") && (
                    <p className="field-error">{itemError(formErrors, index, "foodName")}</p>
                  )}

                  {NUMERIC_FIELDS.map((field) => (
                    <div key={field.name}>
                      <label htmlFor={`${field.name}-${index}`}>{field.label}</label>
                      <input
                        id={`${field.name}-${index}`}
                        name={field.name}
                        type="number"
                        min="0"
                        step="0.1"
                        value={item[field.name]}
                        onChange={(event) => handleItemChange(index, event)}
                      />
                      {itemError(formErrors, index, field.name) && (
                        <p className="field-error">{itemError(formErrors, index, field.name)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button type="button" className="secondary-button" onClick={handleAddItem}>
              Add food item
            </button>

            {saveError && <p className="alert error-alert">{saveError}</p>}

            <div className="table-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : "Confirm & save meal"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleStartOver}
                disabled={saving}
              >
                Start over
              </button>
            </div>
          </form>
        </section>
      )}
    </section>
  );
}

export default AddMealByAI;
