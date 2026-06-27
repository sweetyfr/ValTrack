import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFavourites } from "../utils/useFavourites";
import "./Home.css";

export default function Home() {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { favourites, remove } = useFavourites();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) {
      setError("Enter both a player name and tag.");
      return;
    }
    setError("");
    navigate(`/player/${encodeURIComponent(name.trim())}/${encodeURIComponent(tag.trim().toLowerCase())}`);
  };

  return (
    <div className="home">
      {/* Background decoration */}
      <div className="home-bg" aria-hidden="true">
        <div className="bg-glow" />
      </div>

      <div className="home-content fade-up">
        {/* Logo */}
        <div className="logo">
          <img src="/favicon.ico" alt="ValTrack" className="logo-icon" />
          <span className="logo-text">VALTRACK</span>
        </div>
        <p className="tagline">Search any Valorant player's stats, rank & match history</p>

        {/* Search Form */}
        <form className="search-form" onSubmit={handleSearch}>
          {/* Input Row */}
          <div className="input-row">
            <input
              className="search-input"
              type="text"
              placeholder="Player Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <span className="divider-hash">#</span>
            <input
              className="search-input tag-input"
              type="text"
              placeholder="TAG"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              maxLength={8}
            />
            <button className="search-btn" type="submit">
              SEARCH
            </button>
          </div>

          {error && <p className="search-error">{error}</p>}
        </form>

        <p className="hint">
          Example: <span onClick={() => { setName("Iris"); setTag("anim"); }}>Iris #anim</span>
        </p>

        {favourites.length > 0 && (
          <div className="favourites">
            <p className="fav-label">Recent Searches</p>
            <div className="fav-list">
              {favourites.map((f) => (
                <div key={`${f.name}-${f.tag}`} className="fav-chip">
                  <span
                    className="fav-name"
                    onClick={() => navigate(`/player/${encodeURIComponent(f.name)}/${encodeURIComponent(f.tag.toLowerCase())}`)}
                  >
                    {f.name}<span className="fav-tag">#{f.tag}</span>
                  </span>
                  <button
                    className="fav-remove"
                    onClick={() => remove(f.name, f.tag)}
                    title="Remove"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
