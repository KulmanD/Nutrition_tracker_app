import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  getSettings,
  getStoredTheme,
  saveStoredTheme,
  THEME_CHANGE_EVENT
} from "../services/settingsService";
import Footer from "./Footer";
import Navbar from "./Navbar";

function Layout() {
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (isMounted) {
          setTheme(saveStoredTheme(settings.theme));
        }
      })
      .catch(() => {
        if (isMounted) {
          setTheme(getStoredTheme());
        }
      });

    function handleThemeChange() {
      setTheme(getStoredTheme());
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      isMounted = false;
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  return (
    <div className={`app-shell theme-${theme}`}>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
