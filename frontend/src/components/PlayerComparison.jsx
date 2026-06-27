import React, { useState } from "react";
import { api, extractPlayerStats } from "../utils/api";
import "./PlayerComparison.css";

export default function PlayerComparison({ myMatches, myPlayer, myMmr }) {
  const [name, setName]       = useState("");
  const [tag, setTag]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [rival, setRival]     = useState(null); // { player, mmr, matches }

  const search = async (e) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;
    setLoading(true);
    setError("");
    setRival(null);
    try {
      const playerRes = await api.getPlayer(name.trim(), tag.trim());
      const playerData = playerRes.data?.data;
      if (!playerData) throw new Error("Player not found.");

      const region = playerData.region?.toLowerCase() || "na";
      const [mmrRes, matchesRes] = await Promise.allSettled([
        api.getMMR(region, name.trim(), tag.trim()),
        api.getMatches(region, name.trim(), tag.trim()),
      ]);

      const rivalMmr = mmrRes.status === "fulfilled" ? mmrRes.value.data?.data : null;
      let rivalMatches = [];
      if (matchesRes.status === "fulfilled") {
        const raw = matchesRes.value.data?.data || [];
        rivalMatches = raw.map((m) => extractPlayerStats(m, name.trim(), tag.trim())).filter(Boolean);
      }

      setRival({ player: playerData, mmr: rivalMmr, matches: rivalMatches });
    } catch (err) {
      setError(err.message || "Could not load player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comparison card">
      <div className="cmp-header">
        <h3 className="section-title">Player Comparison</h3>
        {rival && (
          <button className="cmp-clear" onClick={() => { setRival(null); setName(""); setTag(""); }}>
            Clear
          </button>
        )}
      </div>

      {!rival && (
        <form className="cmp-search" onSubmit={search}>
          <input
            className="cmp-input"
            placeholder="Player Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <span className="cmp-hash">#</span>
          <input
            className="cmp-input cmp-tag"
            placeholder="TAG"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            maxLength={8}
          />
          <button className="cmp-btn" type="submit" disabled={loading}>
            {loading ? "…" : "Compare"}
          </button>
        </form>
      )}

      {error && <p className="cmp-error">{error}</p>}

      {rival && (
        <CompareTable
          me={{ player: myPlayer, mmr: myMmr, matches: myMatches }}
          them={{ player: rival.player, mmr: rival.mmr, matches: rival.matches }}
        />
      )}
    </div>
  );
}

function calcStats(matches, mmr) {
  if (!matches.length) return null;
  const wins   = matches.filter((m) => m.won).length;
  const totalK = matches.reduce((s, m) => s + m.kills,   0);
  const totalD = matches.reduce((s, m) => s + m.deaths,  0);
  const totalA = matches.reduce((s, m) => s + m.assists, 0);
  const totalHS    = matches.reduce((s, m) => s + (m.headshots || 0), 0);
  const totalShots = matches.reduce((s, m) => s + (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0), 0);
  const totalDmg   = matches.reduce((s, m) => s + (m.damageMade || 0), 0);
  const totalRnds  = matches.reduce((s, m) => s + (m.rounds     || 0), 0);

  const agentCounts = {};
  matches.forEach((m) => { if (m.agent) agentCounts[m.agent] = (agentCounts[m.agent] || 0) + 1; });
  const topAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    rank:    mmr?.current?.tier?.name || "Unranked",
    rr:      mmr?.current?.rr ?? null,
    games:   matches.length,
    winRate: +(wins / matches.length * 100).toFixed(1),
    kda:     totalD === 0 ? (totalK + totalA).toFixed(2) : ((totalK + totalA) / totalD).toFixed(2),
    avgKills:(totalK / matches.length).toFixed(1),
    hsPercent: totalShots ? Math.round((totalHS / totalShots) * 100) : 0,
    adr:     totalRnds > 0 ? Math.round(totalDmg / totalRnds) : 0,
    topAgent,
  };
}

function CompareTable({ me, them }) {
  const myStats   = calcStats(me.matches,   me.mmr);
  const themStats = calcStats(them.matches, them.mmr);
  if (!myStats || !themStats) return <p className="cmp-error">Not enough data to compare.</p>;

  const cols = [
    { label: "Rank",      myVal: `${myStats.rank}${myStats.rr !== null ? ` · ${myStats.rr}RR` : ""}`, theirVal: `${themStats.rank}${themStats.rr !== null ? ` · ${themStats.rr}RR` : ""}` },
    { label: "Games",     myVal: myStats.games,     theirVal: themStats.games,     numeric: true },
    { label: "Win Rate",  myVal: myStats.winRate,   theirVal: themStats.winRate,   suffix: "%", numeric: true },
    { label: "KDA",       myVal: myStats.kda,       theirVal: themStats.kda,       numeric: true },
    { label: "Avg Kills", myVal: myStats.avgKills,  theirVal: themStats.avgKills,  numeric: true },
    { label: "HS%",       myVal: myStats.hsPercent, theirVal: themStats.hsPercent, suffix: "%", numeric: true },
    { label: "ADR",       myVal: myStats.adr,       theirVal: themStats.adr,       numeric: true },
    { label: "Top Agent", myVal: myStats.topAgent,  theirVal: themStats.topAgent },
  ];

  return (
    <div className="cmp-table">
      {/* Header row */}
      <div className="cmp-row cmp-head">
        <div className="cmp-cell cmp-player-col" />
        {cols.map((col) => (
          <div key={col.label} className="cmp-cell cmp-label-col">{col.label}</div>
        ))}
      </div>

      {/* Player 1 row */}
      <div className="cmp-row">
        <div className="cmp-cell cmp-player-name">{me.player?.name}<span className="cmp-tag">#{me.player?.tag}</span></div>
        {cols.map((col) => {
          const myNum   = parseFloat(col.myVal);
          const themNum = parseFloat(col.theirVal);
          const winner  = col.numeric && myNum > themNum;
          return (
            <div key={col.label} className={`cmp-cell cmp-val ${winner ? "cmp-winner" : ""}`}>
              {col.myVal}{col.suffix || ""}
            </div>
          );
        })}
      </div>

      {/* Player 2 row */}
      <div className="cmp-row">
        <div className="cmp-cell cmp-player-name">{them.player?.name}<span className="cmp-tag">#{them.player?.tag}</span></div>
        {cols.map((col) => {
          const myNum   = parseFloat(col.myVal);
          const themNum = parseFloat(col.theirVal);
          const winner  = col.numeric && themNum > myNum;
          return (
            <div key={col.label} className={`cmp-cell cmp-val ${winner ? "cmp-winner" : ""}`}>
              {col.theirVal}{col.suffix || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
