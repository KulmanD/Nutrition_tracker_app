import { useEffect, useState } from "react";
import AiMealForm from "../components/AiMealForm";
import MealCalendar from "../components/MealCalendar";
import MealsTable from "../components/MealsTable";
import Modal from "../components/Modal";
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
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [addMode, setAddMode] = useState("manual"); // "manual" | "ai"
  const [formKey, setFormKey] = useState(0);
  const [editingMeal, setEditingMeal] = useState(null);
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

  const markedDates = new Set(meals.map((meal) => mealDateOnly(meal.mealDate)));
  const mealsForSelectedDate = meals.filter(
    (meal) => mealDateOnly(meal.mealDate) === selectedDate
  );
  const selectedMeal = meals.find((meal) => meal.mealId === selectedMealId) || null;

  function clearActionFeedback() {
    setActionMessage("");
    setActionError("");
  }

  function handleSelectDate(dateString) {
    setSelectedDate(dateString);
    setSelectedMealId(null);
    clearActionFeedback();
  }

  function handleSelectMeal(mealId) {
    setSelectedMealId(mealId);
    clearActionFeedback();
  }

  function handleSelectMode(mode) {
    clearActionFeedback();
    setAddMode(mode);
    setFormKey((current) => current + 1);
  }

  function handleEditSelected() {
    if (!selectedMeal) {
      return;
    }
    clearActionFeedback();
    setEditingMeal(selectedMeal);
  }

  function handleCloseEdit() {
    setEditingMeal(null);
  }

  async function handleDeleteSelected() {
    if (!selectedMeal) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedMeal.mealName}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    clearActionFeedback();

    try {
      await deleteMeal(selectedMeal.mealId);
      await refreshMeals();
      setSelectedMealId(null);
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
    setEditingMeal(null);
    setActionMessage("Meal updated successfully.");
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
          <h2>Meals for the day</h2>
        </div>

        <MealCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          markedDates={markedDates}
        />

        {error && <p className="alert error-alert">{error}</p>}
        {actionMessage && <p className="alert success-alert">{actionMessage}</p>}
        {actionError && <p className="alert error-alert">{actionError}</p>}

        {!error && (
          <>
            <div className="table-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleEditSelected}
                disabled={!selectedMealId}
              >
                Edit selected meal
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleDeleteSelected}
                disabled={!selectedMealId}
              >
                Delete selected meal
              </button>
              {!selectedMealId && <span>Select a meal to edit or delete.</span>}
            </div>

            <MealsTable
              meals={mealsForSelectedDate}
              selectedMealId={selectedMealId}
              onSelectMeal={handleSelectMeal}
              emptyMessage="No meals found for this date."
            />
          </>
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
              <h2>Add Meal</h2>
              <span>Manual entry</span>
            </div>

            <SharedMealForm
              key={`manual-${formKey}`}
              initialValues={getInitialFormValues()}
              onSubmit={handleCreateMeal}
              submitLabel="Add meal"
              submittingLabel="Adding..."
              resetAfterSubmit
              successMessage="Meal added successfully."
            />
          </>
        ) : (
          <AiMealForm key={`ai-${formKey}`} onSaved={refreshMeals} />
        )}
      </section>

      {editingMeal && (
        <Modal title="Edit Meal" onClose={handleCloseEdit}>
          <SharedMealForm
            initialValues={mealToFormValues(editingMeal)}
            onSubmit={handleUpdateMeal}
            submitLabel="Update meal"
            submittingLabel="Updating..."
            secondaryButton={{ label: "Cancel", onClick: handleCloseEdit }}
          />
        </Modal>
      )}
    </section>
  );
}

export default Meals;
