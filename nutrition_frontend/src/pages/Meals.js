import { useEffect, useState } from "react";
import MealsTable from "../components/MealsTable";
import { getMeals } from "../services/mealService";

function Meals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {error ? <p className="alert error-alert">{error}</p> : <MealsTable meals={meals} />}
    </section>
  );
}

export default Meals;
