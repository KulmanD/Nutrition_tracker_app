import { useEffect, useState } from "react";
import MealsTable from "../components/MealsTable";
import { createMeal, deleteMeal, getMeals } from "../services/mealService";

const initialFormValues = {
  mealName: "",
  mealDate: "2026-05-06",
  foodName: "",
  confirmedPortionGrams: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: ""
};

function validateMeal(values) {
  const nextErrors = {};
  const numericFields = ["confirmedPortionGrams", "calories", "protein", "carbs", "fat"];

  if (!values.mealName.trim()) {
    nextErrors.mealName = "Meal name is required.";
  }

  if (!values.mealDate) {
    nextErrors.mealDate = "Meal date is required.";
  }

  if (!values.foodName.trim()) {
    nextErrors.foodName = "Food name is required.";
  }

  for (const field of numericFields) {
    const value = Number(values[field]);

    if (values[field] === "") {
      nextErrors[field] = "This field is required.";
    } else if (Number.isNaN(value) || value < 0) {
      nextErrors[field] = "Enter a valid non-negative number.";
    }
  }

  if (Number(values.confirmedPortionGrams) <= 0 && !nextErrors.confirmedPortionGrams) {
    nextErrors.confirmedPortionGrams = "Portion must be greater than 0.";
  }

  return nextErrors;
}

function Meals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");

  async function refreshMeals() {
    const data = await getMeals();
    setMeals(data);
    setError("");
  }

  useEffect(() => {
    let isMounted = true;

    getMeals()
      .then((data) => {
        if (isMounted) {
          setMeals(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  function handleSelectMeal(mealId) {
    setSelectedMealId(mealId);
    setDeleteMessage("");
    setDeleteError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormMessage("");
    setFormError("");

    const nextErrors = validateMeal(formValues);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      await createMeal({
        mealName: formValues.mealName.trim(),
        mealDate: formValues.mealDate,
        items: [
          {
            foodName: formValues.foodName.trim(),
            confirmedPortionGrams: Number(formValues.confirmedPortionGrams),
            calories: Number(formValues.calories),
            protein: Number(formValues.protein),
            carbs: Number(formValues.carbs),
            fat: Number(formValues.fat)
          }
        ]
      });
      await refreshMeals();
      setFormValues(initialFormValues);
      setFormErrors({});
      setFormMessage("Meal added successfully.");
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelected() {
    setDeleteMessage("");
    setDeleteError("");

    if (!selectedMealId) {
      setDeleteError("Select a meal before deleting.");
      return;
    }

    setDeleting(true);

    try {
      await deleteMeal(selectedMealId);
      setMeals((currentMeals) => currentMeals.filter((meal) => meal.mealId !== selectedMealId));
      setSelectedMealId(null);
      setDeleteMessage("Meal deleted successfully.");
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="status-text">Loading meals...</p>;
  }

  const selectedMeal = meals.find((meal) => meal.mealId === selectedMealId);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Meal history</p>
          <h1>Meals</h1>
        </div>
      </div>

      <section className="content-block">
        <div className="section-heading">
          <h2>Meals List</h2>
          <span>{meals.length} meals</span>
        </div>

        {error ? (
          <p className="alert error-alert">{error}</p>
        ) : (
          <>
            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleDeleteSelected}
                disabled={!selectedMealId || deleting}
              >
                {deleting ? "Deleting..." : "Delete selected meal"}
              </button>
              {!selectedMealId && <span>Select one meal to enable delete.</span>}
            </div>

            {deleteMessage && <p className="alert success-alert">{deleteMessage}</p>}
            {deleteError && <p className="alert error-alert">{deleteError}</p>}

            <MealsTable
              meals={meals}
              selectedMealId={selectedMealId}
              onSelectMeal={handleSelectMeal}
            />

            <div className="meal-details">
              {selectedMeal ? (
                <>
                  <div className="section-heading">
                    <h2>{selectedMeal.mealName}</h2>
                    <span>{selectedMeal.mealDate}</span>
                  </div>

                  {selectedMeal.items && selectedMeal.items.length > 0 ? (
                    <div className="table-wrap">
                      <table className="meals-table">
                        <thead>
                          <tr>
                            <th>Food</th>
                            <th>Portion</th>
                            <th>Calories</th>
                            <th>Protein</th>
                            <th>Carbs</th>
                            <th>Fat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMeal.items.map((item) => (
                            <tr key={item.itemId}>
                              <td>{item.foodName}</td>
                              <td>{item.confirmedPortionGrams} g</td>
                              <td>{item.calories} kcal</td>
                              <td>{item.protein} g</td>
                              <td>{item.carbs} g</td>
                              <td>{item.fat} g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-state">No food items found for this meal.</p>
                  )}
                </>
              ) : (
                <p className="empty-state">Select a meal to see its food items.</p>
              )}
            </div>
          </>
        )}
      </section>

      <section className="content-block">
        <div className="section-heading">
          <h2>Add Meal</h2>
          <span>Manual entry</span>
        </div>

        <form className="meal-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="mealName">Meal name</label>
          <input
            id="mealName"
            name="mealName"
            type="text"
            value={formValues.mealName}
            onChange={handleChange}
            placeholder="Lunch"
          />
          {formErrors.mealName && <p className="field-error">{formErrors.mealName}</p>}

          <label htmlFor="mealDate">Meal date</label>
          <input
            id="mealDate"
            name="mealDate"
            type="date"
            value={formValues.mealDate}
            onChange={handleChange}
          />
          {formErrors.mealDate && <p className="field-error">{formErrors.mealDate}</p>}

          <label htmlFor="foodName">Food name</label>
          <input
            id="foodName"
            name="foodName"
            type="text"
            value={formValues.foodName}
            onChange={handleChange}
            placeholder="Chicken breast"
          />
          {formErrors.foodName && <p className="field-error">{formErrors.foodName}</p>}

          <label htmlFor="confirmedPortionGrams">Portion grams</label>
          <input
            id="confirmedPortionGrams"
            name="confirmedPortionGrams"
            type="number"
            min="0"
            step="0.1"
            value={formValues.confirmedPortionGrams}
            onChange={handleChange}
          />
          {formErrors.confirmedPortionGrams && (
            <p className="field-error">{formErrors.confirmedPortionGrams}</p>
          )}

          <label htmlFor="calories">Calories</label>
          <input
            id="calories"
            name="calories"
            type="number"
            min="0"
            step="0.1"
            value={formValues.calories}
            onChange={handleChange}
          />
          {formErrors.calories && <p className="field-error">{formErrors.calories}</p>}

          <label htmlFor="protein">Protein</label>
          <input
            id="protein"
            name="protein"
            type="number"
            min="0"
            step="0.1"
            value={formValues.protein}
            onChange={handleChange}
          />
          {formErrors.protein && <p className="field-error">{formErrors.protein}</p>}

          <label htmlFor="carbs">Carbs</label>
          <input
            id="carbs"
            name="carbs"
            type="number"
            min="0"
            step="0.1"
            value={formValues.carbs}
            onChange={handleChange}
          />
          {formErrors.carbs && <p className="field-error">{formErrors.carbs}</p>}

          <label htmlFor="fat">Fat</label>
          <input
            id="fat"
            name="fat"
            type="number"
            min="0"
            step="0.1"
            value={formValues.fat}
            onChange={handleChange}
          />
          {formErrors.fat && <p className="field-error">{formErrors.fat}</p>}

          {formMessage && <p className="alert success-alert">{formMessage}</p>}
          {formError && <p className="alert error-alert">{formError}</p>}

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Adding..." : "Add meal"}
          </button>
        </form>
      </section>
    </section>
  );
}

export default Meals;
