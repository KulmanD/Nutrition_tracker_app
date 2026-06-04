import { useEffect, useState } from "react";
import MealsTable from "../components/MealsTable";
import { createMeal, deleteMeal, getMeals } from "../services/mealService";

const emptyFoodItem = {
  foodName: "",
  confirmedPortionGrams: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: ""
};

function getInitialFormValues() {
  return {
    mealName: "",
    mealDate: "2026-05-06",
    items: [{ ...emptyFoodItem }]
  };
}

function validateMeal(values) {
  const nextErrors = {};
  const numericFields = ["confirmedPortionGrams", "calories", "protein", "carbs", "fat"];

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

    for (const field of numericFields) {
      const value = Number(item[field]);

      if (item[field] === "") {
        currentErrors[field] = "This field is required.";
      } else if (Number.isNaN(value) || value < 0) {
        currentErrors[field] = "Enter a valid non-negative number.";
      }
    }

    if (Number(item.confirmedPortionGrams) <= 0 && !currentErrors.confirmedPortionGrams) {
      currentErrors.confirmedPortionGrams = "Portion must be greater than 0.";
    }

    return currentErrors;
  });

  const hasItemErrors = itemErrors.some((itemError) => Object.keys(itemError).length > 0);

  if (hasItemErrors) {
    nextErrors.items = itemErrors;
  }

  return nextErrors;
}

function Meals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState(getInitialFormValues());
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

  function handleItemChange(index, event) {
    const { name, value } = event.target;

    setFormValues((currentValues) => {
      const nextItems = currentValues.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [name]: value
        };
      });

      return {
        ...currentValues,
        items: nextItems
      };
    });
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
        items: formValues.items.map((item) => ({
          foodName: item.foodName.trim(),
          confirmedPortionGrams: Number(item.confirmedPortionGrams),
          calories: Number(item.calories),
          protein: Number(item.protein),
          carbs: Number(item.carbs),
          fat: Number(item.fat)
        }))
      });
      await refreshMeals();
      setFormValues(getInitialFormValues());
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
                {formErrors.items && formErrors.items[index] && formErrors.items[index].foodName && (
                  <p className="field-error">{formErrors.items[index].foodName}</p>
                )}

                <label htmlFor={`confirmedPortionGrams-${index}`}>Portion grams</label>
                <input
                  id={`confirmedPortionGrams-${index}`}
                  name="confirmedPortionGrams"
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.confirmedPortionGrams}
                  onChange={(event) => handleItemChange(index, event)}
                />
                {formErrors.items &&
                  formErrors.items[index] &&
                  formErrors.items[index].confirmedPortionGrams && (
                    <p className="field-error">{formErrors.items[index].confirmedPortionGrams}</p>
                  )}

                <label htmlFor={`calories-${index}`}>Calories</label>
                <input
                  id={`calories-${index}`}
                  name="calories"
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.calories}
                  onChange={(event) => handleItemChange(index, event)}
                />
                {formErrors.items && formErrors.items[index] && formErrors.items[index].calories && (
                  <p className="field-error">{formErrors.items[index].calories}</p>
                )}

                <label htmlFor={`protein-${index}`}>Protein</label>
                <input
                  id={`protein-${index}`}
                  name="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.protein}
                  onChange={(event) => handleItemChange(index, event)}
                />
                {formErrors.items && formErrors.items[index] && formErrors.items[index].protein && (
                  <p className="field-error">{formErrors.items[index].protein}</p>
                )}

                <label htmlFor={`carbs-${index}`}>Carbs</label>
                <input
                  id={`carbs-${index}`}
                  name="carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.carbs}
                  onChange={(event) => handleItemChange(index, event)}
                />
                {formErrors.items && formErrors.items[index] && formErrors.items[index].carbs && (
                  <p className="field-error">{formErrors.items[index].carbs}</p>
                )}

                <label htmlFor={`fat-${index}`}>Fat</label>
                <input
                  id={`fat-${index}`}
                  name="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={item.fat}
                  onChange={(event) => handleItemChange(index, event)}
                />
                {formErrors.items && formErrors.items[index] && formErrors.items[index].fat && (
                  <p className="field-error">{formErrors.items[index].fat}</p>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="secondary-button" onClick={handleAddItem}>
            Add food item
          </button>

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
