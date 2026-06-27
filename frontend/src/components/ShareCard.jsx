import React, { useRef, useState } from "react";
import "./ShareCard.css";

// Load an image with CORS. Resolves to null on failure so the card still renders.
function loadImg(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function drawCard(canvas, { playerName, tag, rankName, rr, rankIcon, agentName, agentImg, winRate, wins, losses, kda, hsPercent, adr }) {
  const W = 580, H = 300, DPR = 2;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);

  // Load images in parallel
  const [agentImage, rankImage] = await Promise.all([loadImg(agentImg), loadImg(rankIcon)]);

  // ── Background ──────────────────────────────────────────────
  ctx.fillStyle = "#13151e";
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.fill();

  // Subtle grid overlay
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Red accent bar
  ctx.fillStyle = "#ff4655";
  roundRect(ctx, 0, 0, W, 4, 2);
  ctx.fill();

  // ── Agent portrait (right side) ──────────────────────────────
  if (agentImage) {
    const iW = 160, iH = 160;
    ctx.save();
    // Clip to right panel
    ctx.globalAlpha = 0.25;
    ctx.drawImage(agentImage, W - iW - 10, H - iH - 10, iW, iH);
    ctx.restore();
  }

  // ── Logo ─────────────────────────────────────────────────────
  ctx.fillStyle = "#ff4655";
  ctx.font = "bold 13px 'Arial', sans-serif";
  ctx.fillText("◈ VALTRACK", 24, 32);

  // ── Player name ──────────────────────────────────────────────
  ctx.fillStyle = "#e8eaf0";
  ctx.font = "bold 32px 'Arial', sans-serif";
  ctx.fillText(playerName, 24, 82);

  ctx.fillStyle = "#8b90a0";
  ctx.font = "15px 'Arial', sans-serif";
  ctx.fillText(`#${tag}`, 24, 102);

  // ── Rank block ───────────────────────────────────────────────
  if (rankImage) {
    ctx.drawImage(rankImage, 24, 116, 36, 36);
  }
  const rankX = rankImage ? 68 : 24;
  ctx.fillStyle = "#e8eaf0";
  ctx.font = "bold 16px 'Arial', sans-serif";
  ctx.fillText(rankName || "Unranked", rankX, 131);
  if (rr !== null && rr !== undefined) {
    ctx.fillStyle = "#ff4655";
    ctx.font = "13px 'Arial', sans-serif";
    ctx.fillText(`${rr} RR`, rankX, 149);
  }

  if (agentName) {
    ctx.fillStyle = "#555b6e";
    ctx.font = "12px 'Arial', sans-serif";
    ctx.fillText(`Top Agent: ${agentName}`, 24, 172);
  }

  // ── Divider ──────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 188); ctx.lineTo(W - 24, 188); ctx.stroke();

  // ── Stats row ────────────────────────────────────────────────
  const stats = [
    { label: "WIN RATE", value: `${winRate}%`, sub: `${wins}W – ${losses}L` },
    { label: "KDA",      value: kda },
    { label: "HS%",      value: `${hsPercent}%` },
    ...(adr ? [{ label: "ADR", value: String(adr) }] : []),
  ];

  const colW = (W - 48) / stats.length;
  stats.forEach((s, i) => {
    const x = 24 + i * colW;
    ctx.fillStyle = "#e8eaf0";
    ctx.font = "bold 26px 'Arial', sans-serif";
    ctx.fillText(s.value, x, 226);
    ctx.fillStyle = "#555b6e";
    ctx.font = "10px 'Arial', sans-serif";
    ctx.fillText(s.label, x, 242);
    if (s.sub) {
      ctx.fillStyle = "#3d4663";
      ctx.font = "10px 'Arial', sans-serif";
      ctx.fillText(s.sub, x, 256);
    }
  });

  // ── Footer ───────────────────────────────────────────────────
  ctx.fillStyle = "#2a2e3d";
  ctx.fillRect(0, H - 32, W, 32);
  ctx.fillStyle = "#555b6e";
  ctx.font = "11px 'Arial', sans-serif";
  ctx.fillText("Generated with VALTRACK", 24, H - 12);
}

export default function ShareCard({ player, mmr, matches }) {
  const canvasRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const wins   = matches.filter((m) => m.won).length;
  const losses = matches.length - wins;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;

  const totalK = matches.reduce((s, m) => s + m.kills, 0);
  const totalD = matches.reduce((s, m) => s + m.deaths, 0);
  const totalA = matches.reduce((s, m) => s + m.assists, 0);
  const kda = totalD === 0
    ? (totalK + totalA).toFixed(1)
    : ((totalK + totalA) / totalD).toFixed(2);

  const totalHS   = matches.reduce((s, m) => s + (m.headshots || 0), 0);
  const totalShots = matches.reduce((s, m) => s + (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0), 0);
  const hsPercent = totalShots ? Math.round((totalHS / totalShots) * 100) : 0;

  const totalDmg  = matches.reduce((s, m) => s + (m.damageMade || 0), 0);
  const totalRnds = matches.reduce((s, m) => s + (m.rounds || 0), 0);
  const adr = totalRnds > 0 ? Math.round(totalDmg / totalRnds) : 0;

  // Top agent by games
  const agentCounts = {};
  matches.forEach((m) => { if (m.agent) agentCounts[m.agent] = (agentCounts[m.agent] || 0) + 1; });
  const topAgentEntry = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
  const topAgent = topAgentEntry?.[0];
  const topAgentImg = matches.find((m) => m.agent === topAgent)?.agentImage;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await drawCard(canvasRef.current, {
        playerName: player?.name || "",
        tag:        player?.tag  || "",
        rankName:   mmr?.current?.tier?.name,
        rr:         mmr?.current?.rr,
        rankIcon:   mmr?.current?.images?.small,
        agentName:  topAgent,
        agentImg:   topAgentImg,
        winRate, wins, losses, kda, hsPercent, adr,
      });

      const link = document.createElement("a");
      link.download = `${player?.name || "player"}-valtrack.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Share card error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        className="share-btn"
        onClick={handleGenerate}
        disabled={generating || !matches.length}
        title="Download summary as image"
      >
        {generating ? "Generating…" : "Share Card"}
      </button>
    </>
  );
}
