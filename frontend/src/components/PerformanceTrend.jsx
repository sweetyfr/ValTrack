import React, { useMemo } from "react";
import "./PerformanceTrend.css";

function avgKDA(matches) {
  const totalK = matches.reduce((s, m) => s + m.kills,   0);
  const totalD = matches.reduce((s, m) => s + m.deaths,  0);
  const totalA = matches.reduce((s, m) => s + m.assists, 0);
  return totalD === 0 ? totalK + totalA : (totalK + totalA) / totalD;
}

function avgWR(matches) {
  return matches.filter((m) => m.won).length / matches.length * 100;
}

export default function PerformanceTrend({ matches }) {
  const trend = useMemo(() => {
    if (matches.length < 2) return null;

    const recent = matches.slice(0, Math.min(10, matches.length));
    const overallKDA = avgKDA(matches);
    const overallWR  = avgWR(matches);
    const recKDA = avgKDA(recent);
    const recWR  = avgWR(recent);

    const kdaDelta = recKDA - overallKDA;
    const wrDelta  = recWR  - overallWR;

    // Trending up if both KDA and WR improved, down if both worsened, mixed otherwise
    const kdaUp = kdaDelta > 0.05;
    const kdaDn = kdaDelta < -0.05;
    const wrUp  = wrDelta  > 1;
    const wrDn  = wrDelta  < -1;

    let direction = "neutral";
    if (kdaUp && wrUp)       direction = "up";
    else if (kdaDn && wrDn)  direction = "down";
    else if (kdaUp || wrUp)  direction = "slightly-up";
    else if (kdaDn || wrDn)  direction = "slightly-down";

    return {
      overallKDA:  overallKDA.toFixed(2),
      overallWR:   +overallWR.toFixed(1),
      recKDA:  recKDA.toFixed(2),
      recWR:   +recWR.toFixed(1),
      kdaDelta: kdaDelta.toFixed(2),
      wrDelta:  +wrDelta.toFixed(1),
      direction,
      recentCount: recent.length,
    };
  }, [matches]);

  if (!trend) return null;

  const { overallKDA, overallWR, recKDA, recWR, kdaDelta, wrDelta, direction, recentCount } = trend;
  const kdaSign = parseFloat(kdaDelta) >= 0 ? "+" : "";
  const wrSign  = wrDelta >= 0 ? "+" : "";

  const callout = {
    "up":           { icon: "↑", label: "Trending Up",       cls: "trend-up"   },
    "slightly-up":  { icon: "↗", label: "Slightly Improving", cls: "trend-up"   },
    "neutral":      { icon: "→", label: "Holding Steady",     cls: "trend-mid"  },
    "slightly-down":{ icon: "↘", label: "Slightly Declining", cls: "trend-down" },
    "down":         { icon: "↓", label: "Trending Down",      cls: "trend-down" },
  }[direction];

  return (
    <div className="perf-trend card">
      <div className="pt-header">
        <h3 className="section-title">Performance Trend</h3>
        <span className={`pt-callout ${callout.cls}`}>
          {callout.icon} {callout.label}
        </span>
      </div>

      <div className="pt-table">
        <div className="pt-col-header" />
        <div className="pt-col-header">Last {recentCount}</div>
        <div className="pt-col-header">Overall</div>
        <div className="pt-col-header">Δ</div>

        {/* KDA row */}
        <div className="pt-row-label">KDA</div>
        <div className="pt-val">{recKDA}</div>
        <div className="pt-val muted">{overallKDA}</div>
        <div className={`pt-delta ${parseFloat(kdaDelta) >= 0 ? "delta-pos" : "delta-neg"}`}>
          {kdaSign}{kdaDelta}
        </div>

        {/* Win Rate row */}
        <div className="pt-row-label">Win Rate</div>
        <div className="pt-val">{recWR}%</div>
        <div className="pt-val muted">{overallWR}%</div>
        <div className={`pt-delta ${wrDelta >= 0 ? "delta-pos" : "delta-neg"}`}>
          {wrSign}{wrDelta}%
        </div>
      </div>
    </div>
  );
}
