import { useEffect, useState } from "react";
import MealsTable from "../components/MealsTable";
import NutritionCard from "../components/NutritionCard";
import { getDashboard } from "../services/mealService";

const cardColors = {
  calories: "#2f7d5b",
  protein: "#3a6ea5",
  carbs: "#c4812d",
  fat: "#b75d69"
};

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
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

  if (loading) {
    return <p className="status-text">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="alert error-alert">{error}</p>;
  }

  const cards = [
    {
      title: "Calories",
      value: dashboard.consumed.calories,
      unit: "kcal",
      goal: dashboard.goals.calories,
      color: cardColors.calories
    },
    {
      title: "Protein",
      value: dashboard.consumed.protein,
      unit: "g",
      goal: dashboard.goals.protein,
      color: cardColors.protein
    },
    {
      title: "Carbs",
      value: dashboard.consumed.carbs,
      unit: "g",
      goal: dashboard.goals.carbs,
      color: cardColors.carbs
    },
    {
      title: "Fat",
      value: dashboard.consumed.fat,
      unit: "g",
      goal: dashboard.goals.fat,
      color: cardColors.fat
    }
  ];

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Daily summary</p>
          <h1>Dashboard</h1>
        </div>
        <span className="date-pill">{dashboard.date}</span>
      </div>

      <div className="cards-grid">
        {cards.map((card) => (
          <NutritionCard
            key={card.title}
            title={card.title}
            value={card.value}
            unit={card.unit}
            goal={card.goal}
            color={card.color}
          />
        ))}
      </div>

      <section className="content-block">
        <div className="section-heading">
          <h2>Meals for the day</h2>
          <span>{dashboard.meals.length} meals</span>
        </div>
        <MealsTable meals={dashboard.meals} />
      </section>
    </section>
  );
}

export default Dashboard;
