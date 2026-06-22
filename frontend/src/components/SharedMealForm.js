import { useState } from "react";
import {
  emptyFoodItem,
  itemError,
  NUMERIC_FIELDS,
  toPayload,
  validateMeal
} from "../utils/mealFormHelpers";

// Reusable meal-editing form (meal name, date, food items, and the submit button).
// It is used both for manual add/edit and for the AI review step. The caller decides
// what happens on submit through the onSubmit prop (create, update, or save from AI).
function SharedMealForm({
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  successMessage,
  resetAfterSubmit = false,
  secondaryButton
}) {
  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  function handleItemChange(index, event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      items: currentValues.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item
      )
    }));
  }

  function handleAddItem() {
    setFormValues((currentValues) => ({
      ...currentValues,
      items: [...currentValues.items, { ...emptyFoodItem }]
    }));
  }

  function handleRemoveItem(index) {
    setFormValues((currentValues) => {
      if (currentValues.items.length === 1) {
        return currentValues;
      }
      return {
        ...currentValues,
        items: currentValues.items.filter((item, itemIndex) => itemIndex !== index)
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormMessage("");
    setFormError("");

    const nextErrors = validateMeal(formValues);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      await onSubmit(toPayload(formValues));

      if (resetAfterSubmit) {
        setFormValues(initialValues);
        setFormErrors({});
      }

      if (successMessage) {
        setFormMessage(successMessage);
      }
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="meal-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="mealName">Meal name</label>
      <input
        id="mealName"
        name="mealName"
        type="text"
        value={formValues.mealName}
        onChange={handleChange}
        placeholder="Lunch"
      />
      {formErrors.mealName && <p className="field-error">{formErrors.mealName}</p>}

      <label htmlFor="mealDate">Meal date</label>
      <input
        id="mealDate"
        name="mealDate"
        type="date"
        value={formValues.mealDate}
        onChange={handleChange}
      />
      {formErrors.mealDate && <p className="field-error">{formErrors.mealDate}</p>}

      <div className="food-items-list">
        {formValues.items.map((item, index) => (
          <div className="food-item-card" key={index}>
            <div className="item-heading">
              <h3>Food item {index + 1}</h3>
              <button
                type="button"
                className="secondary-button small-button"
                onClick={() => handleRemoveItem(index)}
                disabled={formValues.items.length === 1}
              >
                Remove item
              </button>
            </div>

            <label htmlFor={`foodName-${index}`}>Food name</label>
            <input
              id={`foodName-${index}`}
              name="foodName"
              type="text"
              value={item.foodName}
              onChange={(event) => handleItemChange(index, event)}
              placeholder="Chicken breast"
            />
            {itemError(formErrors, index, "foodName") && (
              <p className="field-error">{itemError(formErrors, index, "foodName")}</p>
            )}

            {NUMERIC_FIELDS.map((field) => (
              <div key={field.name}>
                <label htmlFor={`${field.name}-${index}`}>{field.label}</label>
                <input
                  id={`${field.name}-${index}`}
                  name={field.name}
                  type="number"
                  min="0"
                  step="0.1"
                  value={item[field.name]}
                  onChange={(event) => handleItemChange(index, event)}
                />
                {itemError(formErrors, index, field.name) && (
                  <p className="field-error">{itemError(formErrors, index, field.name)}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="secondary-button" onClick={handleAddItem}>
        Add food item
      </button>

      {formMessage && <p className="alert success-alert">{formMessage}</p>}
      {formError && <p className="alert error-alert">{formError}</p>}

      <div className="table-actions">
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? submittingLabel : submitLabel}
        </button>
        {secondaryButton && (
          <button
            type="button"
            className="secondary-button"
            onClick={secondaryButton.onClick}
            disabled={saving}
          >
            {secondaryButton.label}
          </button>
        )}
      </div>
    </form>
  );
}

export default SharedMealForm;
