import React from "react";
import ShareCard from "./ShareCard";
import "./PlayerHeader.css";

export default function PlayerHeader({ player, mmr, region, matches = [], tierImages = {} }) {
  const recentForm = (matches || []).slice(0, 10);
  const currentRank = mmr?.current?.tier?.name || "Unranked";
  const rr = mmr?.current?.rr ?? null;
  const peakRank = mmr?.peak?.tier?.name;

  const resolveIcon = (apiIcon, tierName) =>
    apiIcon || (tierName ? tierImages[tierName.toLowerCase()] : null);

  const rankIcon = resolveIcon(mmr?.current?.images?.small, currentRank);
  const peakIcon = resolveIcon(mmr?.peak?.images?.small, peakRank);
  const cardImage = player?.card?.wide || player?.card?.small;
  const level = player?.account_level;

  return (
    <div className="player-header card">
      {/* Banner */}
      {cardImage && (
        <div className="player-banner">
          <img src={cardImage} alt="Player card" />
          <div className="banner-fade" />
        </div>
      )}

      <div className="player-header-body">
        {/* Name */}
        <div className="player-name-row">
          <div>
            <h1 className="player-name">{player?.name}</h1>
            <span className="player-tag">#{player?.tag}</span>
            <span className="player-region">{region?.toUpperCase()}</span>
          </div>
          <div className="player-name-actions">
            {matches.length > 0 && <ShareCard player={player} mmr={mmr} matches={matches} />}
            {level && (
              <div className="player-level">
                <span>{level}</span>
                <small>LVL</small>
              </div>
            )}
          </div>
        </div>

        {/* Recent form */}
        {recentForm.length > 0 && (
          <div className="form-row">
            <span className="form-label">Recent Form</span>
            <div className="form-dots">
              {recentForm.map((m, i) => (
                <span
                  key={m.matchId || i}
                  className={`form-dot ${m.won ? "form-win" : "form-loss"}`}
                  title={m.won ? `Win · ${m.map}` : `Loss · ${m.map}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rank info */}
        <div className="rank-row">
          <div className="rank-block">
            <span className="rank-label">Current Rank</span>
            <div className="rank-display">
              {rankIcon && <img src={rankIcon} alt={currentRank} className="rank-icon" />}
              <div>
                <div className="rank-name">{currentRank}</div>
                {rr !== null && <div className="rank-rr">{rr} RR</div>}
              </div>
            </div>
          </div>

          {peakRank && (
            <div className="rank-block">
              <span className="rank-label">Peak Rank</span>
              <div className="rank-display">
                {peakIcon && <img src={peakIcon} alt={peakRank} className="rank-icon" />}
                <div className="rank-name">{peakRank}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
