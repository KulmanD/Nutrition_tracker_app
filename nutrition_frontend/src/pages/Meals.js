import { useEffect, useState } from "react";
import AiMealForm from "../components/AiMealForm";
import MealsTable from "../components/MealsTable";
import SharedMealForm from "../components/SharedMealForm";
import { createMeal, deleteMeal, getMeals, updateMeal } from "../services/mealService";
import { getInitialFormValues, mealToFormValues } from "../utils/mealFormHelpers";
import { todayLocalISO } from "../utils/date";

function mealDateOnly(value) {
  return String(value || "").slice(0, 10);
}

function Meals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayLocalISO());
  const [addMode, setAddMode] = useState("manual"); // "manual" | "ai"
  const [editingMeal, setEditingMeal] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

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

  const mealsForSelectedDate = meals.filter(
    (meal) => mealDateOnly(meal.mealDate) === selectedDate
  );

  function clearActionFeedback() {
    setActionMessage("");
    setActionError("");
  }

  function handleSelectMode(mode) {
    clearActionFeedback();
    setAddMode(mode);
    setEditingMeal(null);
    setFormKey((current) => current + 1);
  }

  function handleEditMeal(meal) {
    clearActionFeedback();
    setEditingMeal(meal);
    setAddMode("manual");
    setFormKey((current) => current + 1);
  }

  function handleCancelEdit() {
    clearActionFeedback();
    setEditingMeal(null);
    setFormKey((current) => current + 1);
  }

  async function handleDeleteMeal(meal) {
    const confirmed = window.confirm(`Delete "${meal.mealName}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    clearActionFeedback();

    try {
      await deleteMeal(meal.mealId);
      await refreshMeals();
      if (editingMeal && editingMeal.mealId === meal.mealId) {
        setEditingMeal(null);
      }
      setActionMessage("Meal deleted successfully.");
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  async function handleCreateMeal(payload) {
    await createMeal(payload);
    await refreshMeals();
  }

  async function handleUpdateMeal(payload) {
    await updateMeal(editingMeal.mealId, payload);
    await refreshMeals();
  }

  if (loading) {
    return <p className="status-text">Loading meals...</p>;
  }

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
          <h2 style={{ whiteSpace: "nowrap" }}>Meals for the day</h2>
          <input
            type="date"
            aria-label="Filter meals by date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>

        {error && <p className="alert error-alert">{error}</p>}
        {actionMessage && <p className="alert success-alert">{actionMessage}</p>}
        {actionError && <p className="alert error-alert">{actionError}</p>}

        {!error && (
          <MealsTable
            meals={mealsForSelectedDate}
            onEdit={handleEditMeal}
            onDelete={handleDeleteMeal}
            expandable
            emptyMessage="No meals found for this date."
          />
        )}
      </section>

      <section className="content-block">
        <div className="section-heading">
          <h2>Add a meal</h2>
        </div>

        <div className="table-actions">
          <button
            type="button"
            className={addMode === "manual" ? "primary-button" : "secondary-button"}
            onClick={() => handleSelectMode("manual")}
          >
            Add Manually
          </button>
          <button
            type="button"
            className={addMode === "ai" ? "primary-button" : "secondary-button"}
            onClick={() => handleSelectMode("ai")}
          >
            Add with AI
          </button>
        </div>

        {addMode === "manual" ? (
          <>
            <div className="section-heading">
              <h2>{editingMeal ? "Edit Meal" : "Add Meal"}</h2>
              <span>Manual entry</span>
            </div>

            <SharedMealForm
              key={`manual-${formKey}`}
              initialValues={editingMeal ? mealToFormValues(editingMeal) : getInitialFormValues()}
              onSubmit={editingMeal ? handleUpdateMeal : handleCreateMeal}
              submitLabel={editingMeal ? "Update meal" : "Add meal"}
              submittingLabel={editingMeal ? "Updating..." : "Adding..."}
              resetAfterSubmit={!editingMeal}
              successMessage={
                editingMeal ? "Meal updated successfully." : "Meal added successfully."
              }
              secondaryButton={
                editingMeal ? { label: "Cancel edit", onClick: handleCancelEdit } : undefined
              }
            />
          </>
        ) : (
          <AiMealForm key={`ai-${formKey}`} onSaved={refreshMeals} />
        )}
      </section>
    </section>
  );
}

export default Meals;
