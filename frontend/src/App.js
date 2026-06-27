import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ThemeToggle from "./components/ThemeToggle";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:name/:tag" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
