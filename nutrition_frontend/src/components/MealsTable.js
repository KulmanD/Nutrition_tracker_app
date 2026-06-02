function formatDate(dateValue) {
  if (!dateValue) {
    return "No date";
  }

  return new Date(`${dateValue}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function MealsTable({ meals }) {
  if (!meals || meals.length === 0) {
    return <p className="empty-state">No meals found for this user.</p>;
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
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => (
            <tr key={meal.mealId}>
              <td>{meal.mealName}</td>
              <td>{formatDate(meal.mealDate)}</td>
              <td>{meal.totalCalories} kcal</td>
              <td>{meal.totalProtein} g</td>
              <td>{meal.totalCarbs} g</td>
              <td>{meal.totalFat} g</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MealsTable;
