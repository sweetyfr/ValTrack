import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import "./RankHistory.css";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rh-tooltip">
      <div className="rh-tt-tier">{d.tier}</div>
      <div className={`rh-tt-change ${d.change >= 0 ? "rh-gain" : "rh-loss"}`}>
        {d.change >= 0 ? "+" : ""}{d.change} RR
      </div>
      <div className="rh-tt-rr">{d.rr} RR in tier</div>
      {d.date && <div className="rh-tt-date">{d.date}</div>}
    </div>
  );
};

export default function RankHistory({ mmrHistory }) {
  if (!mmrHistory || mmrHistory.length === 0) return null;

  // Henrik returns newest-first; take last 10, then reverse to chronological order for the chart
  const data = [...mmrHistory]
    .slice(0, 10)
    .reverse()
    .map((m, i) => ({
      game:   i + 1,
      change: m.mmr_change_to_last_game ?? 0,
      rr:     m.ranking_in_tier         ?? 0,
      tier:   m.currenttierpatched      ?? "",
      date:   m.date                    ?? "",
    }));

  const netChange = data.reduce((s, d) => s + d.change, 0);
  const wins      = data.filter((d) => d.change > 0).length;
  const losses    = data.filter((d) => d.change <= 0).length;

  return (
    <div className="rank-history card">
      <div className="rh-header">
        <h3 className="section-title">
          Rank History <span>{data.length} games</span>
        </h3>
        <div className="rh-meta">
          <span className="rh-wl">
            <span className="rh-w">{wins}W</span>
            <span className="rh-sep"> – </span>
            <span className="rh-l">{losses}L</span>
          </span>
          <span className={`rh-net ${netChange >= 0 ? "rh-gain" : "rh-loss"}`}>
            {netChange >= 0 ? "+" : ""}{netChange} RR net
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="game" tick={{ fill: "#555b6e", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#555b6e", fontSize: 11 }} tickLine={false} axisLine={false} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="change" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.change >= 0 ? "#4ade80" : "#f87171"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="rh-hint">Each bar = RR gained / lost per game</p>
    </div>
  );
}
