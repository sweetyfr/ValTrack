import React, { useMemo, useState } from "react";
import "./StatsOverview.css";

const RANGE_OPTIONS = [5, 10, 20, 50];

export default function StatsOverview({ matches }) {
  const [range, setRange] = useState("all");

  const slice = useMemo(() => {
    if (range === "all") return matches;
    return matches.slice(0, Math.min(Number(range), matches.length));
  }, [matches, range]);

  const stats = useMemo(() => {
    if (!slice.length) return null;

    const wins = slice.filter((m) => m.won).length;
    const totalKills = slice.reduce((s, m) => s + m.kills, 0);
    const totalDeaths = slice.reduce((s, m) => s + m.deaths, 0);
    const totalAssists = slice.reduce((s, m) => s + m.assists, 0);

    const totalHS = slice.reduce((s, m) => s + (m.headshots || 0), 0);
    const totalShots = slice.reduce(
      (s, m) => s + (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0),
      0
    );

    const agentCounts = {};
    slice.forEach((m) => {
      if (m.agent) agentCounts[m.agent] = (agentCounts[m.agent] || 0) + 1;
    });
    const topAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const totalDamage = slice.reduce((s, m) => s + (m.damageMade || 0), 0);
    const totalRounds = slice.reduce((s, m) => s + (m.rounds || 0), 0);
    const avgADR = totalRounds > 0 ? Math.round(totalDamage / totalRounds) : 0;

    return {
      played: slice.length,
      wins,
      losses: slice.length - wins,
      winRate: +(wins / slice.length * 100).toFixed(1),
      kda: totalDeaths === 0
        ? (totalKills + totalAssists).toFixed(2)
        : ((totalKills + totalAssists) / totalDeaths).toFixed(2),
      avgKills: (totalKills / slice.length).toFixed(1),
      avgDeaths: (totalDeaths / slice.length).toFixed(1),
      avgAssists: (totalAssists / slice.length).toFixed(1),
      hsPercent: totalShots ? Math.round((totalHS / totalShots) * 100) : 0,
      avgADR,
      topAgent,
    };
  }, [slice]);

  if (!stats) return null;

  return (
    <div className="stats-overview card">
      <div className="so-header">
        <h3 className="section-title">Overview <span>{stats.played} games</span></h3>
        <select
          className="range-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {RANGE_OPTIONS.filter((n) => n < matches.length).map((n) => (
            <option key={n} value={n}>Last {n}</option>
          ))}
          <option value="all">All ({matches.length})</option>
        </select>
      </div>

      {/* Win Rate Bar */}
      <div className="winrate-section">
        <div className="winrate-labels">
          <span className="win-label">{stats.wins}W</span>
          <span className="winrate-pct">{stats.winRate}%</span>
          <span className="loss-label">{stats.losses}L</span>
        </div>
        <div className="winrate-bar">
          <div
            className="winrate-fill"
            style={{ width: `${stats.winRate}%` }}
          />
        </div>
      </div>

      {/* KDA + ADR Row */}
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.kda}</span>
          <span className="stat-label">KDA Ratio</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.avgKills}</span>
          <span className="stat-label">Avg Kills</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.avgDeaths}</span>
          <span className="stat-label">Avg Deaths</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.avgAssists}</span>
          <span className="stat-label">Avg Assists</span>
        </div>
        {stats.avgADR > 0 && (
          <div className="stat-item stat-item-adr">
            <span className="stat-value">{stats.avgADR}</span>
            <span className="stat-label">Avg ADR</span>
          </div>
        )}
      </div>

      {/* Extra stats */}
      <div className="extra-stats">
        <div className="extra-stat">
          <span className="extra-label">Headshot %</span>
          <div className="hs-bar-wrap">
            <div className="hs-bar" style={{ width: `${stats.hsPercent}%` }} />
          </div>
          <span className="extra-value">{stats.hsPercent}%</span>
        </div>
        {stats.topAgent && (
          <div className="extra-stat">
            <span className="extra-label">Most Played</span>
            <span className="extra-value agent-name">{stats.topAgent}</span>
          </div>
        )}
      </div>
    </div>
  );
}
