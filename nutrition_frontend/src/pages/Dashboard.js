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

  const meals = Array.isArray(dashboard?.meals) ? dashboard.meals : [];
  const consumed = dashboard?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = dashboard?.goals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const dashboardDate = dashboard?.date || "Today";

  const cards = [
    {
      title: "Calories",
      value: consumed.calories,
      unit: "kcal",
      goal: goals.calories,
      color: cardColors.calories
    },
    {
      title: "Protein",
      value: consumed.protein,
      unit: "g",
      goal: goals.protein,
      color: cardColors.protein
    },
    {
      title: "Carbs",
      value: consumed.carbs,
      unit: "g",
      goal: goals.carbs,
      color: cardColors.carbs
    },
    {
      title: "Fat",
      value: consumed.fat,
      unit: "g",
      goal: goals.fat,
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
        <span className="date-pill">{dashboardDate}</span>
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
          <span>{meals.length} meals</span>
        </div>
        <MealsTable meals={meals} />
      </section>
    </section>
  );
}

export default Dashboard;
