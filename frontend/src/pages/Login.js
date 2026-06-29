import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getLoggedInUser, login, register } from "../services/authService";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const demoPassword = "test00";
const minimumPasswordLength = 6;

function validateForm(values) {
  const nextErrors = {};

  if (!values.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(values.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  } else if (values.password.length < minimumPasswordLength) {
    nextErrors.password = "Password must be at least 6 characters.";
  }

  return nextErrors;
}

function validateRegisterForm(values) {
  const nextErrors = {};

  if (!values.firstName.trim()) {
    nextErrors.firstName = "First name is required.";
  }

  if (!values.lastName.trim()) {
    nextErrors.lastName = "Last name is required.";
  }

  if (!values.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(values.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    nextErrors.password = "Password is required.";
  } else if (values.password.length < minimumPasswordLength) {
    nextErrors.password = "Password must be at least 6 characters.";
  }

  return nextErrors;
}

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({
    email: "",
    password: ""
  });
  const [registerValues, setRegisterValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  if (getLoggedInUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  function showLogin() {
    setMode("login");
    setErrors({});
    setServerError("");
  }

  function showRegister() {
    setMode("register");
    setRegisterErrors({});
    setRegisterError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await login(values.email.trim(), values.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setRegisterError("");
    setSuccessMessage("");

    const nextErrors = validateRegisterForm(registerValues);
    setRegisterErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setRegistering(true);

    try {
      await register(
        registerValues.firstName.trim(),
        registerValues.lastName.trim(),
        registerValues.email.trim(),
        registerValues.password
      );
      setValues({
        email: registerValues.email.trim(),
        password: registerValues.password
      });
      setRegisterValues({
        firstName: "",
        lastName: "",
        email: "",
        password: ""
      });
      setMode("login");
      setSuccessMessage("Account created successfully.");
    } catch (error) {
      setRegisterError(error.message);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <span className="brand-mark large-mark" aria-hidden="true">
            N
          </span>
          <h1>{mode === "login" ? "NutriTrack Login" : "Create NutriTrack Account"}</h1>
          <p>Track meals, calories, and daily nutrition goals from one clear dashboard.</p>
        </div>

        {mode === "login" ? (
          <form className="form-panel" onSubmit={handleSubmit} noValidate>
            <div className="auth-mode-switch" aria-label="Authentication mode">
              <button type="button" className="primary-button small-button" aria-current="true">
                Log in
              </button>
              <button type="button" className="secondary-button small-button" onClick={showRegister}>
                Create account
              </button>
            </div>

            {successMessage && <p className="alert success-alert">{successMessage}</p>}

            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              placeholder="denis@example.com"
            />
            {errors.email && <p className="field-error">{errors.email}</p>}

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              placeholder={demoPassword}
            />
            {errors.password && <p className="field-error">{errors.password}</p>}

            {serverError && <p className="alert error-alert">{serverError}</p>}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        ) : (
          <form className="form-panel" onSubmit={handleRegisterSubmit} noValidate>
            <div className="auth-mode-switch" aria-label="Authentication mode">
              <button type="button" className="secondary-button small-button" onClick={showLogin}>
                Log in
              </button>
              <button type="button" className="primary-button small-button" aria-current="true">
                Create account
              </button>
            </div>

            <label htmlFor="register-first-name">First name</label>
            <input
              id="register-first-name"
              name="firstName"
              type="text"
              value={registerValues.firstName}
              onChange={handleRegisterChange}
              placeholder="Dana"
            />
            {registerErrors.firstName && <p className="field-error">{registerErrors.firstName}</p>}

            <label htmlFor="register-last-name">Last name</label>
            <input
              id="register-last-name"
              name="lastName"
              type="text"
              value={registerValues.lastName}
              onChange={handleRegisterChange}
              placeholder="Cohen"
            />
            {registerErrors.lastName && <p className="field-error">{registerErrors.lastName}</p>}

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={registerValues.email}
              onChange={handleRegisterChange}
              placeholder="dana@example.com"
            />
            {registerErrors.email && <p className="field-error">{registerErrors.email}</p>}

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={registerValues.password}
              onChange={handleRegisterChange}
              placeholder="At least 6 characters"
            />
            {registerErrors.password && <p className="field-error">{registerErrors.password}</p>}

            {registerError && <p className="alert error-alert">{registerError}</p>}

            <button type="submit" className="primary-button" disabled={registering}>
              {registering ? "Creating..." : "Create account"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default Login;
