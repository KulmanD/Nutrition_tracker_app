function NutritionCard({ title, value, unit, goal, color }) {
  const percentage = goal > 0 ? Math.min((Number(value) / Number(goal)) * 100, 100) : 0;

  return (
    <article className="nutrition-card" style={{ "--card-color": color }}>
      <div className="card-title-row">
        <p>{title}</p>
        <span>{goal} {unit}</span>
      </div>
      <div className="card-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="progress-track" aria-label={`${title} progress`}>
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </article>
  );
}

export default NutritionCard;
