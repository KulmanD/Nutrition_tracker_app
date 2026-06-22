import { Fragment } from "react";

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

function MealsTable({ meals, selectedMealId, onSelectMeal, emptyMessage = "No meals found for this user." }) {
  const selectable = Boolean(onSelectMeal);
  const columnCount = (selectable ? 1 : 0) + 6;

  if (!meals || meals.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="meals-table">
        <thead>
          <tr>
            {selectable && <th>Select</th>}
            <th>Meal</th>
            <th>Date</th>
            <th>Calories</th>
            <th>Protein</th>
            <th>Carbs</th>
            <th>Fat</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => {
            const isSelected = selectedMealId === meal.mealId;

            return (
              <Fragment key={meal.mealId}>
                <tr
                  className={isSelected ? "selected-row" : ""}
                  onClick={selectable ? () => onSelectMeal(meal.mealId) : undefined}
                  style={selectable ? { cursor: "pointer" } : undefined}
                >
                  {selectable && (
                    <td>
                      <input
                        type="radio"
                        name="selectedMeal"
                        aria-label={`Select ${meal.mealName}`}
                        checked={isSelected}
                        onChange={() => onSelectMeal(meal.mealId)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </td>
                  )}
                  <td>{meal.mealName}</td>
                  <td>{formatDate(meal.mealDate)}</td>
                  <td>{meal.totalCalories} kcal</td>
                  <td>{meal.totalProtein} g</td>
                  <td>{meal.totalCarbs} g</td>
                  <td>{meal.totalFat} g</td>
                </tr>

                {selectable && isSelected && (
                  <tr>
                    <td colSpan={columnCount}>
                      {meal.items && meal.items.length > 0 ? (
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
                      ) : (
                        <p className="empty-state">No food items found for this meal.</p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MealsTable;
