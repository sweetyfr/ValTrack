import React, { useState, useEffect } from "react";
import Scorecard from "./Scorecard";
import "./MatchHistory.css";

const PAGE_SIZE = 20;
const ROLES = ["All", "Duelist", "Initiator", "Controller", "Sentinel"];

export default function MatchHistory({ matches, rawMatches, viewerName, viewerTag }) {
  const [expandedId, setExpandedId] = useState(null);
  const [visible, setVisible]       = useState(PAGE_SIZE);
  const [roleFilter, setRoleFilter] = useState("All");
  const [agentRoles, setAgentRoles] = useState({});

  // Fetch agent→role map once from the cached backend endpoint
  useEffect(() => {
    fetch("http://localhost:5001/api/agents")
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        (data.data || []).forEach((a) => {
          if (a.displayName && a.role?.displayName) {
            map[a.displayName] = a.role.displayName;
          }
        });
        setAgentRoles(map);
      })
      .catch(() => {});
  }, []);

  // Reset pagination when filter changes
  useEffect(() => { setVisible(PAGE_SIZE); }, [roleFilter]);

  const filtered = roleFilter === "All"
    ? matches
    : matches.filter((m) => agentRoles[m.agent] === roleFilter);

  if (!matches.length) {
    return (
      <div className="match-history card">
        <h3 className="section-title">Match History</h3>
        <p className="no-matches">No competitive matches found.</p>
      </div>
    );
  }

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));
  const visibleMatches = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Only show role tabs that have at least one match (plus "All")
  const availableRoles = ROLES.filter(
    (r) => r === "All" || matches.some((m) => agentRoles[m.agent] === r)
  );

  return (
    <div className="match-history card">
      <div className="mh-header">
        <h3 className="section-title">
          Match History <span>{matches.length} games</span>
        </h3>
        <span className="mh-showing">Showing {Math.min(visible, filtered.length)} of {filtered.length}</span>
      </div>

      {/* Role filter tabs */}
      <div className="role-filter">
        {availableRoles.map((r) => (
          <button
            key={r}
            className={`role-btn ${roleFilter === r ? "active" : ""}`}
            onClick={() => setRoleFilter(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="no-matches">No {roleFilter} matches found.</p>
      ) : null}

      <div className="match-list">
        {visibleMatches.map((m, i) => {
          const raw = rawMatches?.find(r => r?.metadata?.matchid === m.matchId) || rawMatches?.[i] || null;
          const rowId = m.matchId || i;
          const isExpanded = expandedId === rowId;
          return (
            <div key={rowId} className="match-entry">
              <MatchRow
                match={m}
                isExpanded={isExpanded}
                onToggle={() => toggle(rowId)}
              />
              {isExpanded && raw && (
                <Scorecard raw={raw} viewerName={viewerName} viewerTag={viewerTag} />
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          className="load-more-btn"
          onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length))}
        >
          Load More ({filtered.length - visible} remaining)
        </button>
      )}
    </div>
  );
}

function MatchRow({ match, isExpanded, onToggle }) {
  const { won, agent, agentImage, kills, deaths, assists, kda, map, startedAt, rounds, mode } = match;
  const hsTotal = (match.headshots || 0) + (match.bodyshots || 0) + (match.legshots || 0);
  const hsPercent = hsTotal ? Math.round((match.headshots / hsTotal) * 100) : 0;

  return (
    <div
      className={`match-row ${won ? "match-win" : "match-loss"} ${isExpanded ? "expanded" : ""}`}
      onClick={onToggle}
      role="button"
      title="Click to see full scorecard"
    >
      <div className={`result-bar ${won ? "win" : "loss"}`} />

      <div className="match-agent">
        {agentImage
          ? <img src={agentImage} alt={agent} className="agent-img" />
          : <div className="agent-placeholder">{agent?.[0]}</div>
        }
      </div>

      <div className="match-info">
        <div className="match-top">
          <span className={`tag ${won ? "win-tag" : "loss-tag"}`}>{won ? "WIN" : "LOSS"}</span>
          <span className="match-map">{map}</span>
          <span className="match-mode">{mode}</span>
        </div>
        <div className="match-bottom">
          <span className="match-agent-name">{agent}</span>
          {startedAt && <span className="match-date">{startedAt}</span>}
        </div>
      </div>

      <div className="match-kda">
        <span className="kda-score">
          <span className="k">{kills}</span>
          <span className="sep">/</span>
          <span className="d">{deaths}</span>
          <span className="sep">/</span>
          <span className="a">{assists}</span>
        </span>
        <span className="kda-ratio">{kda} KDA</span>
      </div>

      <div className="match-hs">
        <span className="hs-value">{hsPercent}%</span>
        <span className="hs-lbl">HS</span>
      </div>

      {rounds && (
        <div className="match-rounds">
          <span>{rounds}</span>
          <span className="rnd-lbl">RND</span>
        </div>
      )}

      <div className="expand-icon">{isExpanded ? "▲" : "▼"}</div>
    </div>
  );
}
