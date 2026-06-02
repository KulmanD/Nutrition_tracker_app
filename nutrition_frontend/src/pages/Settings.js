import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../services/settingsService";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSettings(values) {
  const nextErrors = {};

  if (!values.username.trim()) {
    nextErrors.username = "Username is required.";
  }

  if (!values.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(values.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!values.theme) {
    nextErrors.theme = "Theme is required.";
  }

  return nextErrors;
}

function Settings() {
  const [values, setValues] = useState({
    username: "",
    email: "",
    theme: "light"
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (isMounted) {
          setValues({
            username: settings.username || "",
            email: settings.email || "",
            theme: settings.theme || "light"
          });
          setRequestError("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setRequestError(error.message);
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

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setRequestError("");

    const nextErrors = validateSettings(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const savedSettings = await saveSettings({
        username: values.username.trim(),
        email: values.email.trim(),
        theme: values.theme
      });
      setValues({
        username: savedSettings.username,
        email: savedSettings.email,
        theme: savedSettings.theme
      });
      setMessage("Settings saved successfully.");
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="status-text">Loading settings...</p>;
  }

  return (
    <section className="page-section narrow-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Profile preferences</p>
          <h1>Settings</h1>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={values.username}
          onChange={handleChange}
        />
        {errors.username && <p className="field-error">{errors.username}</p>}

        <label htmlFor="settings-email">Email</label>
        <input
          id="settings-email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}

        <label htmlFor="theme">Theme preference</label>
        <select id="theme" name="theme" value={values.theme} onChange={handleChange}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        {errors.theme && <p className="field-error">{errors.theme}</p>}

        {message && <p className="alert success-alert">{message}</p>}
        {requestError && <p className="alert error-alert">{requestError}</p>}

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </section>
  );
}

export default Settings;
