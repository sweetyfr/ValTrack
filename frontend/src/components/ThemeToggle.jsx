import React, { useEffect, useState } from "react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("valtrack_theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("valtrack_theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="tt-track">
        <span className={`tt-thumb ${isLight ? "tt-light" : "tt-dark"}`}>
          {isLight ? "☀" : "☾"}
        </span>
      </span>
    </button>
  );
}
