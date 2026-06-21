import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AUTH_USER_CHANGE_EVENT } from "../services/api";
import { getCurrentUser, getLoggedInUser, logout } from "../services/authService";
import OnlineUsers from "./OnlineUsers";

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

    function handleAuthUserChange() {
      setUser(getLoggedInUser());
    }

    window.addEventListener(AUTH_USER_CHANGE_EVENT, handleAuthUserChange);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_USER_CHANGE_EVENT, handleAuthUserChange);
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
        <OnlineUsers />
        <span className="user-name">{user ? user.fullName || user.firstName : "User"}</span>
        <button type="button" className="secondary-button small-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
