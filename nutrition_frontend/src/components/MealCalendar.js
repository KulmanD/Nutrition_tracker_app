import { useState } from "react";
import { todayLocalISO } from "../utils/date";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

// Build a local YYYY-MM-DD string from year, 0-indexed month, and day.
function toDateString(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseDateString(value) {
  const [year, month, day] = String(value || todayLocalISO())
    .split("-")
    .map(Number);
  return { year, monthIndex: (month || 1) - 1, day: day || 1 };
}

// A simple month calendar. Dates present in markedDates get a dot; the selected
// date is filled; today gets a ring. Clicking a day calls onSelectDate(dateString).
function MealCalendar({ selectedDate, onSelectDate, markedDates }) {
  const initial = parseDateString(selectedDate);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.monthIndex);

  const today = todayLocalISO();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
    } else {
      setViewMonth((month) => month - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
    } else {
      setViewMonth((month) => month + 1);
    }
  }

  function goToToday() {
    const current = parseDateString(today);
    setViewYear(current.year);
    setViewMonth(current.monthIndex);
    onSelectDate(today);
  }

  const cells = [];
  for (let blank = 0; blank < firstWeekday; blank += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  return (
    <div className="meal-calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          {"‹"}
        </button>
        <span className="calendar-title">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          className="calendar-nav"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          {"›"}
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="calendar-weekday">
            {weekday}
          </span>
        ))}

        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`blank-${index}`} className="calendar-empty" />;
          }

          const dateString = toDateString(viewYear, viewMonth, day);
          const isSelected = dateString === selectedDate;
          const isToday = dateString === today;
          const hasMeals = markedDates.has(dateString);

          const classes = ["calendar-day"];
          if (isSelected) {
            classes.push("is-selected");
          }
          if (isToday) {
            classes.push("is-today");
          }

          return (
            <button
              type="button"
              key={dateString}
              className={classes.join(" ")}
              onClick={() => onSelectDate(dateString)}
              aria-pressed={isSelected}
              aria-label={dateString}
            >
              <span className="calendar-day-number">{day}</span>
              {hasMeals && <span className="calendar-day-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="calendar-footer">
        <button type="button" className="secondary-button small-button" onClick={goToToday}>
          Today
        </button>
      </div>
    </div>
  );
}

export default MealCalendar;
