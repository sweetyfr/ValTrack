import React from "react";
import { useNavigate } from "react-router-dom";
import "./Scorecard.css";

export default function Scorecard({ raw, viewerName, viewerTag }) {
  const navigate = useNavigate();

  const allPlayers = raw?.players?.all_players || [];
  const teams = raw?.teams || {};
  const metadata = raw?.metadata || {};

  // Split into blue/red teams, sorted by combat score descending
  const blue = allPlayers
    .filter((p) => p.team?.toLowerCase() === "blue")
    .sort((a, b) => (b.stats?.score ?? 0) - (a.stats?.score ?? 0));
  const red = allPlayers
    .filter((p) => p.team?.toLowerCase() === "red")
    .sort((a, b) => (b.stats?.score ?? 0) - (a.stats?.score ?? 0));

  const blueWon = teams?.blue?.has_won;
  const redWon = teams?.red?.has_won;
  const blueRounds = teams?.blue?.rounds_won ?? "?";
  const redRounds = teams?.red?.rounds_won ?? "?";

  const isViewer = (p) =>
    p.name?.toLowerCase() === viewerName?.toLowerCase() &&
    p.tag?.toLowerCase() === viewerTag?.toLowerCase();

  const handlePlayerClick = (e, p) => {
    e.stopPropagation(); // don't collapse the match row
    navigate(`/player/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag.toLowerCase())}`);
  };

  return (
    <div className="scorecard" onClick={(e) => e.stopPropagation()}>
      {/* Match meta bar */}
      <div className="scorecard-meta">
        <span className="sc-map">{metadata.map}</span>
        <span className="sc-score">
          <span className={blueWon ? "sc-team-win" : "sc-team-loss"}>{blueRounds}</span>
          <span className="sc-score-sep">–</span>
          <span className={redWon ? "sc-team-win" : "sc-team-loss"}>{redRounds}</span>
        </span>
        <span className="sc-mode">{metadata.mode}</span>
      </div>

      {/* Teams */}
      <TeamBlock
        players={blue}
        teamName="Blue Team"
        won={blueWon}
        color="blue"
        isViewer={isViewer}
        onPlayerClick={handlePlayerClick}
      />
      <TeamBlock
        players={red}
        teamName="Red Team"
        won={redWon}
        color="red"
        isViewer={isViewer}
        onPlayerClick={handlePlayerClick}
      />
    </div>
  );
}

function TeamBlock({ players, teamName, won, color, isViewer, onPlayerClick }) {
  if (!players.length) return null;

  return (
    <div className={`sc-team sc-team-${color}`}>
      {/* Team header */}
      <div className="sc-team-header">
        <span className="sc-team-name">{teamName}</span>
        <span className={`sc-team-result ${won ? "win" : "loss"}`}>
          {won ? "VICTORY" : "DEFEAT"}
        </span>
      </div>

      {/* Table */}
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th className="col-agent"></th>
              <th className="col-player">Player</th>
              <th>ACS</th>
              <th>K</th>
              <th>D</th>
              <th>A</th>
              <th>KD</th>
              <th>FB</th>
              <th>Plants</th>
              <th>Defuses</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const kills = p.stats?.kills ?? 0;
              const deaths = p.stats?.deaths ?? 0;
              const assists = p.stats?.assists ?? 0;
              const score = p.stats?.score ?? 0;
              const kd = deaths === 0 ? kills.toFixed(1) : (kills / deaths).toFixed(2);
              const plants = p.ability_casts?.grenade_cast ?? 0;
              const defuses = p.ability_casts?.ability1_cast ?? 0;
              const viewer = isViewer(p);
              const hsTotal = (p.stats?.headshots ?? 0) + (p.stats?.bodyshots ?? 0) + (p.stats?.legshots ?? 0);
              const hsPercent = hsTotal ? Math.round(((p.stats?.headshots ?? 0) / hsTotal) * 100) : 0;

              return (
                <tr
                  key={p.puuid || i}
                  className={viewer ? "sc-row-viewer" : ""}
                >
                  <td className="col-agent">
                    {p.assets?.agent?.small ? (
                      <img src={p.assets.agent.small} alt={p.character} className="sc-agent-img" />
                    ) : (
                      <span className="sc-agent-fallback">{p.character?.[0]}</span>
                    )}
                  </td>
                  <td className="col-player">
                    <button
                      className="sc-player-btn"
                      onClick={(e) => onPlayerClick(e, p)}
                      title={`View ${p.name}#${p.tag}'s profile`}
                    >
                      <span className="sc-player-name">{p.name}</span>
                      <span className="sc-player-tag">#{p.tag}</span>
                    </button>
                    <span className="sc-agent-name">{p.character}</span>
                  </td>
                  <td className="col-acs">{score}</td>
                  <td className="col-k">{kills}</td>
                  <td className="col-d sc-deaths">{deaths}</td>
                  <td className="col-a">{assists}</td>
                  <td className={`col-kd ${parseFloat(kd) >= 1 ? "kd-pos" : "kd-neg"}`}>{kd}</td>
                  <td className="col-fb">{hsPercent}%</td>
                  <td className="col-plants">{plants || "—"}</td>
                  <td className="col-defuses">{defuses || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
