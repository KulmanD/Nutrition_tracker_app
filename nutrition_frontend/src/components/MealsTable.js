import { Fragment, useState } from "react";

function formatDate(dateValue) {
  if (!dateValue) {
    return "No date";
  }

  const parsed = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function MealsTable({
  meals,
  onEdit,
  onDelete,
  expandable = false,
  emptyMessage = "No meals found for this user."
}) {
  const [expandedMealId, setExpandedMealId] = useState(null);
  const hasActions = Boolean(onEdit || onDelete);
  const columnCount = 6 + (hasActions ? 1 : 0);

  if (!meals || meals.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  function toggleExpanded(mealId) {
    setExpandedMealId((current) => (current === mealId ? null : mealId));
  }

  return (
    <div className="table-wrap">
      <table className="meals-table">
        <thead>
          <tr>
            <th>Meal</th>
            <th>Date</th>
            <th>Calories</th>
            <th>Protein</th>
            <th>Carbs</th>
            <th>Fat</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => (
            <Fragment key={meal.mealId}>
              <tr
                onClick={expandable ? () => toggleExpanded(meal.mealId) : undefined}
                style={expandable ? { cursor: "pointer" } : undefined}
              >
                <td>{meal.mealName}</td>
                <td>{formatDate(meal.mealDate)}</td>
                <td>{meal.totalCalories} kcal</td>
                <td>{meal.totalProtein} g</td>
                <td>{meal.totalCarbs} g</td>
                <td>{meal.totalFat} g</td>
                {hasActions && (
                  <td>
                    <div className="table-actions">
                      {onEdit && (
                        <button
                          type="button"
                          className="secondary-button small-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(meal);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="secondary-button small-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(meal);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>

              {expandable && expandedMealId === meal.mealId && (
                <tr>
                  <td colSpan={columnCount}>
                    {meal.items && meal.items.length > 0 ? (
                      <>
                        <p className="status-text">Food items in this meal</p>
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
                            {meal.items.map((item, index) => (
                              <tr key={index}>
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
                      </>
                    ) : (
                      <p className="empty-state">No food items found for this meal.</p>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MealsTable;
