import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, getLoggedInUser, logout } from "../services/authService";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getLoggedInUser());

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(getLoggedInUser());
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          N
        </span>
        <span>NutriTrack</span>
      </div>

      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/meals">Meals</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>

      <div className="user-menu">
        <span className="user-name">{user ? user.fullName || user.firstName : "User"}</span>
        <button type="button" className="secondary-button small-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
