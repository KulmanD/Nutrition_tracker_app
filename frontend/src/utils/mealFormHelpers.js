import { todayLocalISO } from "./date";

export const emptyFoodItem = {
  foodName: "",
  confirmedPortionGrams: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: ""
};

export const NUMERIC_FIELDS = [
  { name: "confirmedPortionGrams", label: "Portion grams" },
  { name: "calories", label: "Calories" },
  { name: "protein", label: "Protein" },
  { name: "carbs", label: "Carbs" },
  { name: "fat", label: "Fat" }
];

export function getInitialFormValues() {
  return {
    mealName: "",
    mealDate: todayLocalISO(),
    items: [{ ...emptyFoodItem }]
  };
}

// Build editable form values from a saved meal (used when editing).
export function mealToFormValues(meal) {
  const items = meal.items && meal.items.length > 0 ? meal.items : [{ ...emptyFoodItem }];

  return {
    mealName: meal.mealName || "",
    mealDate: meal.mealDate || todayLocalISO(),
    items: items.map((item) => ({
      foodName: item.foodName || "",
      confirmedPortionGrams: String(item.confirmedPortionGrams ?? ""),
      calories: String(item.calories ?? ""),
      protein: String(item.protein ?? ""),
      carbs: String(item.carbs ?? ""),
      fat: String(item.fat ?? "")
    }))
  };
}

// Build a form item from an AI detected item. The AI returns "estimatedPortionGrams";
// the user-reviewed value is stored as "confirmedPortionGrams". See docs/API_CONTRACT.md (1).
export function detectedToFormItem(detected) {
  return {
    foodName: detected.foodName || "",
    confirmedPortionGrams: String(detected.estimatedPortionGrams ?? ""),
    calories: String(detected.calories ?? ""),
    protein: String(detected.protein ?? ""),
    carbs: String(detected.carbs ?? ""),
    fat: String(detected.fat ?? "")
  };
}

export function itemError(formErrors, index, field) {
  if (!formErrors.items || !formErrors.items[index]) {
    return "";
  }
  return formErrors.items[index][field] || "";
}

export function validateMeal(values) {
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

// Convert the string-based form values into the numeric payload the backend expects.
export function toPayload(values) {
  return {
    mealName: values.mealName.trim(),
    mealDate: values.mealDate,
    items: values.items.map((item) => ({
      foodName: item.foodName.trim(),
      confirmedPortionGrams: Number(item.confirmedPortionGrams),
      calories: Number(item.calories),
      protein: Number(item.protein),
      carbs: Number(item.carbs),
      fat: Number(item.fat)
    }))
  };
}
