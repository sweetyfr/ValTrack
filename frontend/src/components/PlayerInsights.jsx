import React, { useMemo } from "react";
import "./PlayerInsights.css";

export default function PlayerInsights({ matches, mapImages = {} }) {
  const insights = useMemo(() => {
    if (!matches || matches.length === 0) return null;

    // ── Agent stats ─────────────────────────────────────────────────────────
    const agentMap = {};
    matches.forEach((m) => {
      if (!m.agent) return;
      if (!agentMap[m.agent]) {
        agentMap[m.agent] = {
          name: m.agent,
          image: m.agentImage,
          games: 0, wins: 0,
          kills: 0, deaths: 0, assists: 0,
        };
      }
      const a = agentMap[m.agent];
      a.games++;
      if (m.won) a.wins++;
      a.kills   += m.kills;
      a.deaths  += m.deaths;
      a.assists += m.assists;
    });

    const agents = Object.values(agentMap).filter((a) => a.games >= 1);
    // Score each agent: weighted by KDA and win rate
    agents.forEach((a) => {
      a.winRate = +(a.wins / a.games * 100).toFixed(1);
      a.kda = a.deaths === 0
        ? (a.kills + a.assists).toFixed(2)
        : ((a.kills + a.assists) / a.deaths).toFixed(2);
      // Composite score: kda * winRate, biased toward agents with more games
      a.score = parseFloat(a.kda) * a.winRate * Math.log(a.games + 1);
    });
    const bestAgent = agents.sort((a, b) => b.score - a.score)[0] || null;

    // ── Map stats ────────────────────────────────────────────────────────────
    const mapMap = {};
    matches.forEach((m) => {
      if (!m.map) return;
      if (!mapMap[m.map]) {
        mapMap[m.map] = { name: m.map, games: 0, wins: 0, roundDiffTotal: 0 };
      }
      const mp = mapMap[m.map];
      mp.games++;
      if (m.won) mp.wins++;
      mp.roundDiffTotal += (m.roundDiff ?? 0);
    });

    const maps = Object.values(mapMap).filter((mp) => mp.games >= 1);
    maps.forEach((mp) => {
      mp.winRate = +(mp.wins / mp.games * 100).toFixed(1);
      mp.avgRoundDiff = (mp.roundDiffTotal / mp.games).toFixed(1);
      mp.score = mp.winRate * Math.log(mp.games + 1);
    });
    const bestMap = maps.sort((a, b) => b.score - a.score)[0] || null;

    // ── Overall stats ────────────────────────────────────────────────────────
    const totalGames  = matches.length;
    const totalWins   = matches.filter((m) => m.won).length;
    const totalKills  = matches.reduce((s, m) => s + m.kills, 0);
    const totalDeaths = matches.reduce((s, m) => s + m.deaths, 0);
    const totalAssists = matches.reduce((s, m) => s + m.assists, 0);
    const overallKDA  = totalDeaths === 0
      ? (totalKills + totalAssists).toFixed(2)
      : ((totalKills + totalAssists) / totalDeaths).toFixed(2);

    const totalHS = matches.reduce((s, m) => s + (m.headshots || 0), 0);
    const totalShots = matches.reduce(
      (s, m) => s + (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0), 0
    );
    const hsPercent = totalShots ? Math.round((totalHS / totalShots) * 100) : 0;

    // First blood rate — aggregate raw counts for accuracy across unequal-length matches
    const totalFBs          = matches.reduce((s, m) => s + (m.firstBloods    || 0), 0);
    const totalRoundsWithData = matches.reduce((s, m) => s + (m.roundsWithData || 0), 0);
    const avgFBRate = totalRoundsWithData > 0
      ? +(totalFBs / totalRoundsWithData * 100).toFixed(1)
      : null;

    return {
      bestAgent, bestMap,
      totalGames, totalWins,
      winRate: +(totalWins / totalGames * 100).toFixed(1),
      overallKDA, hsPercent,
      avgFBRate,
    };
  }, [matches]);

  if (!insights) return null;

  const { bestAgent, bestMap, totalGames, totalWins, winRate,
          overallKDA, hsPercent, avgFBRate } = insights;

  return (
    <div className="insights-section">
      <div className="insights-header">
        <h2 className="insights-title">Insights</h2>
        <span className="insights-sub">{totalGames} games analysed</span>
      </div>

      <div className="insights-grid">

        {/* ── Best Agent ── */}
        {bestAgent && (
          <div className="insight-card agent-card">
            <span className="insight-label">Best Agent</span>
            <div className="agent-highlight">
              {bestAgent.image && (
                <img src={bestAgent.image} alt={bestAgent.name} className="agent-hl-img" />
              )}
              <div className="agent-hl-info">
                <span className="agent-hl-name">{bestAgent.name}</span>
                <div className="agent-hl-stats">
                  <StatPill label="KDA"  value={bestAgent.kda} accent />
                  <StatPill label="WR"   value={`${bestAgent.winRate}%`} color={bestAgent.winRate >= 50 ? "win" : "loss"} />
                  <StatPill label="Games" value={bestAgent.games} />
                </div>
              </div>
            </div>
            <WinBar wins={bestAgent.wins} total={bestAgent.games} />
          </div>
        )}

        {/* ── Best Map ── */}
        {bestMap && (
          <div className="insight-card map-card">
            <span className="insight-label">Best Map</span>
            <div className="map-highlight">
              {mapImages[bestMap.name.toLowerCase()] && (
                <img
                  src={mapImages[bestMap.name.toLowerCase()]}
                  alt={bestMap.name}
                  className="map-hl-img"
                />
              )}
              <div className="map-hl-name">{bestMap.name}</div>
              <div className="map-hl-stats">
                <StatPill label="WR"    value={`${bestMap.winRate}%`} color={bestMap.winRate >= 50 ? "win" : "loss"} />
                <StatPill label="Games" value={bestMap.games} />
                <StatPill
                  label="Avg ±RND"
                  value={`${parseFloat(bestMap.avgRoundDiff) >= 0 ? "+" : ""}${bestMap.avgRoundDiff}`}
                  color={parseFloat(bestMap.avgRoundDiff) >= 0 ? "win" : "loss"}
                />
              </div>
            </div>
            <WinBar wins={bestMap.wins} total={bestMap.games} />
          </div>
        )}

        {/* ── Overview ── */}
        <div className="insight-card overview-card">
          <span className="insight-label">Overview</span>
          <div className="overview-stats">
            <OverviewStat label="Win Rate"  value={`${winRate}%`}   sub={`${totalWins}W / ${totalGames - totalWins}L`} color={winRate >= 50 ? "win" : "loss"} />
            <OverviewStat label="KDA"       value={overallKDA}      sub="overall ratio" />
            <OverviewStat label="HS%"       value={`${hsPercent}%`} sub="headshots" accent />
            <OverviewStat label="First Blood" value={avgFBRate !== null ? `${avgFBRate}%` : "—"} sub="per round" color={avgFBRate !== null && avgFBRate >= 10 ? "win" : null} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Small reusable sub-components
function StatPill({ label, value, accent, color }) {
  return (
    <div className={`stat-pill ${accent ? "pill-accent" : ""} ${color ? `pill-${color}` : ""}`}>
      <span className="pill-value">{value}</span>
      <span className="pill-label">{label}</span>
    </div>
  );
}

function WinBar({ wins, total }) {
  const pct = total ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="win-bar-wrap">
      <div className="win-bar-track">
        <div className="win-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="win-bar-label">{wins}W – {total - wins}L</span>
    </div>
  );
}

function OverviewStat({ label, value, sub, color, accent }) {
  return (
    <div className="overview-stat">
      <span className={`ov-value ${color ? `ov-${color}` : ""} ${accent ? "ov-accent" : ""}`}>
        {value}
      </span>
      <span className="ov-label">{label}</span>
      <span className="ov-sub">{sub}</span>
    </div>
  );
}
