import React, { useState, useMemo } from "react";
import "./BreakdownTables.css";

export default function BreakdownTables({ matches }) {
  const [tab, setTab] = useState("agents");
  const [agentSort, setAgentSort] = useState({ col: "games", dir: "desc" });
  const [mapSort, setMapSort]     = useState({ col: "games", dir: "desc" });

  const agentRows = useMemo(() => {
    const map = {};
    matches.forEach((m) => {
      if (!m.agent) return;
      if (!map[m.agent]) {
        map[m.agent] = { name: m.agent, image: m.agentImage, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, hs: 0, bs: 0, ls: 0 };
      }
      const a = map[m.agent];
      a.games++;
      if (m.won) a.wins++;
      a.kills   += m.kills;
      a.deaths  += m.deaths;
      a.assists += m.assists;
      a.hs      += m.headshots || 0;
      a.bs      += m.bodyshots || 0;
      a.ls      += m.legshots  || 0;
    });
    return Object.values(map).map((a) => {
      const shots = a.hs + a.bs + a.ls;
      return {
        ...a,
        winRate:   +(a.wins / a.games * 100).toFixed(1),
        kda:       a.deaths === 0 ? (a.kills + a.assists).toFixed(2) : ((a.kills + a.assists) / a.deaths).toFixed(2),
        avgKills:  (a.kills / a.games).toFixed(1),
        hsPercent: shots ? Math.round((a.hs / shots) * 100) : 0,
      };
    });
  }, [matches]);

  const mapRows = useMemo(() => {
    const map = {};
    matches.forEach((m) => {
      if (!m.map) return;
      if (!map[m.map]) map[m.map] = { name: m.map, games: 0, wins: 0, rdTotal: 0 };
      const mp = map[m.map];
      mp.games++;
      if (m.won) mp.wins++;
      mp.rdTotal += m.roundDiff ?? 0;
    });
    return Object.values(map).map((mp) => ({
      ...mp,
      winRate:      +(mp.wins / mp.games * 100).toFixed(1),
      avgRoundDiff: (mp.rdTotal / mp.games).toFixed(1),
    }));
  }, [matches]);

  function sorted(rows, { col, dir }) {
    return [...rows].sort((a, b) => {
      const av = parseFloat(a[col]) || 0;
      const bv = parseFloat(b[col]) || 0;
      return dir === "desc" ? bv - av : av - bv;
    });
  }

  function toggle(current, col, setter) {
    setter(current.col === col
      ? { col, dir: current.dir === "desc" ? "asc" : "desc" }
      : { col, dir: "desc" });
  }

  function Th({ col, sort, setter, children }) {
    const active = sort.col === col;
    return (
      <th className={`sortable ${active ? "sorted" : ""}`} onClick={() => toggle(sort, col, setter)}>
        {children}
        <span className="sort-arrow">{active ? (sort.dir === "desc" ? " ↓" : " ↑") : " ⇅"}</span>
      </th>
    );
  }

  const agents = sorted(agentRows, agentSort);
  const maps   = sorted(mapRows,   mapSort);

  return (
    <div className="breakdown-tables card">
      <div className="bt-header">
        <h3 className="section-title">Breakdown</h3>
        <div className="bt-tabs">
          <button className={`bt-tab ${tab === "agents" ? "active" : ""}`} onClick={() => setTab("agents")}>Agents</button>
          <button className={`bt-tab ${tab === "maps"   ? "active" : ""}`} onClick={() => setTab("maps")}>Maps</button>
        </div>
      </div>

      {tab === "agents" && (
        <div className="bt-scroll">
          <table className="bt-table">
            <thead>
              <tr>
                <th className="col-name">Agent</th>
                <Th col="games"     sort={agentSort} setter={setAgentSort}>Games</Th>
                <Th col="winRate"   sort={agentSort} setter={setAgentSort}>W/L</Th>
                <Th col="kda"       sort={agentSort} setter={setAgentSort}>KDA</Th>
                <Th col="avgKills"  sort={agentSort} setter={setAgentSort}>Avg K</Th>
                <Th col="hsPercent" sort={agentSort} setter={setAgentSort}>HS%</Th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.name}>
                  <td className="col-name">
                    {a.image && <img src={a.image} alt={a.name} className="bt-agent-img" />}
                    <span>{a.name}</span>
                  </td>
                  <td>{a.games}</td>
                  <td className={a.winRate >= 50 ? "cell-win" : "cell-loss"}>{a.winRate}% <span className="wl-counts">{a.wins}W–{a.games - a.wins}L</span></td>
                  <td>{a.kda}</td>
                  <td>{a.avgKills}</td>
                  <td>{a.hsPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "maps" && (
        <div className="bt-scroll">
          <table className="bt-table">
            <thead>
              <tr>
                <th className="col-name">Map</th>
                <Th col="games"        sort={mapSort} setter={setMapSort}>Games</Th>
                <Th col="winRate"      sort={mapSort} setter={setMapSort}>W/L</Th>
                <Th col="avgRoundDiff" sort={mapSort} setter={setMapSort}>Avg ±RND</Th>
              </tr>
            </thead>
            <tbody>
              {maps.map((mp) => (
                <tr key={mp.name}>
                  <td className="col-name map-name">{mp.name}</td>
                  <td>{mp.games}</td>
                  <td className={mp.winRate >= 50 ? "cell-win" : "cell-loss"}>{mp.winRate}% <span className="wl-counts">{mp.wins}W–{mp.games - mp.wins}L</span></td>
                  <td className={parseFloat(mp.avgRoundDiff) >= 0 ? "cell-win" : "cell-loss"}>
                    {parseFloat(mp.avgRoundDiff) >= 0 ? "+" : ""}{mp.avgRoundDiff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
