const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const HENRIK_API_KEY = process.env.HENRIK_API_KEY || "YOUR_API_KEY_HERE";
const HENRIK_BASE = "https://api.henrikdev.xyz/valorant";
const ASSETS_BASE = "https://valorant-api.com/v1";

app.use(cors());
app.use(express.json());

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < (entry.ttl || CACHE_TTL)) return entry.data;
  return null;
}
function setCache(key, data, ttl) {
  cache.set(key, { data, time: Date.now(), ttl: ttl || CACHE_TTL });
}

// ─── GET PLAYER ACCOUNT ──────────────────────────────────────────────────────
app.get("/api/player/:name/:tag", async (req, res) => {
  const { name, tag } = req.params;
  const cacheKey = `account-${name}-${tag}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const url = `${HENRIK_BASE}/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  console.log("\n🔍 ACCOUNT REQUEST:", url);
  try {
    const { data } = await axios.get(url, { headers: { Authorization: HENRIK_API_KEY } });
    console.log("  ✅ region:", data?.data?.region);
    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.log("  ❌", err.response?.status, JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.errors?.[0]?.message || "Player not found",
      debug: err.response?.data,
    });
  }
});

// ─── GET PLAYER MMR (RANK) ───────────────────────────────────────────────────
app.get("/api/mmr/:region/:name/:tag", async (req, res) => {
  const { region, name, tag } = req.params;
  const cacheKey = `mmr-${region}-${name}-${tag}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const url = `${HENRIK_BASE}/v3/mmr/${region}/pc/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  console.log("\n🏆 MMR REQUEST:", url);
  try {
    const { data } = await axios.get(url, { headers: { Authorization: HENRIK_API_KEY } });
    console.log("  ✅ rank:", data?.data?.current?.tier?.name);
    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.log("  ❌", err.response?.status, JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.errors?.[0]?.message || "MMR not found",
      debug: err.response?.data,
    });
  }
});

// ─── GET MATCH HISTORY (paginated) ───────────────────────────────────────────
const PAGE_CAP = 15; // safety cap: never fetch more than 15 pages

app.get("/api/matches/:region/:name/:tag", async (req, res) => {
  const { region, name, tag } = req.params;
  const mode       = req.query.mode || "competitive";
  const maxMatches = Math.min(parseInt(req.query.size || "50", 10), 50);

  const cacheKey = `matches-${region}-${name}-${tag}-${mode}-${maxMatches}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const url = `${HENRIK_BASE}/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  console.log("\n🎮 MATCHES REQUEST:", url, `(up to ${maxMatches})`);

  try {
    let allMatches = [];
    let page       = 0;
    let offset     = 0;
    const pageSize = 10;

    while (allMatches.length < maxMatches && page < PAGE_CAP) {
      const params = { mode, size: pageSize };
      if (offset > 0) params.start = offset;

      const { data } = await axios.get(url, {
        headers: { Authorization: HENRIK_API_KEY },
        params,
      });

      const batch = data?.data || [];
      if (batch.length === 0) break;

      allMatches = allMatches.concat(batch);
      console.log(`  page ${page}: got ${batch.length} matches (total: ${allMatches.length})`);

      if (batch.length < pageSize) break;
      offset += batch.length;
      page++;

      if (allMatches.length < maxMatches) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    const trimmed = allMatches.slice(0, maxMatches);
    console.log(`  ✅ returning ${trimmed.length} total matches`);

    const response = { status: 200, data: trimmed };
    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.log("  ❌", err.response?.status, JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.errors?.[0]?.message || "Match history not found",
      debug: err.response?.data,
    });
  }
});

// ─── GET MMR HISTORY ─────────────────────────────────────────────────────────
app.get("/api/mmr-history/:region/:name/:tag", async (req, res) => {
  const { region, name, tag } = req.params;
  const cacheKey = `mmr-history-${region}-${name}-${tag}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const url = `${HENRIK_BASE}/v1/mmr-history/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  console.log("\n📈 MMR HISTORY REQUEST:", url);
  try {
    const { data } = await axios.get(url, { headers: { Authorization: HENRIK_API_KEY } });
    console.log("  ✅ entries:", data?.data?.length);
    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.log("  ❌", err.response?.status, JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.errors?.[0]?.message || "MMR history not found",
      debug: err.response?.data,
    });
  }
});

// ─── GET ALL AGENTS ──────────────────────────────────────────────────────────
app.get("/api/agents", async (req, res) => {
  const cached = getCached("agents");
  if (cached) return res.json(cached);
  try {
    const { data } = await axios.get(`${ASSETS_BASE}/agents?isPlayableCharacter=true`);
    setCache("agents", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch agents" });
  }
});

// ─── GET ALL RANKS/TIERS ─────────────────────────────────────────────────────
app.get("/api/tiers", async (req, res) => {
  const cached = getCached("tiers");
  if (cached) return res.json(cached);
  try {
    const { data } = await axios.get(`${ASSETS_BASE}/competitivetiers`);
    setCache("tiers", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch tiers" });
  }
});

// ─── GET ALL MAPS ────────────────────────────────────────────────────────────
app.get("/api/maps", async (req, res) => {
  const cached = getCached("maps");
  if (cached) return res.json(cached);
  try {
    const { data } = await axios.get(`${ASSETS_BASE}/maps`);
    setCache("maps", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch maps" });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`\n✅ Backend running on http://localhost:${PORT}`);
  console.log(
    HENRIK_API_KEY === "YOUR_API_KEY_HERE"
      ? "⚠️  WARNING: No API key set! Add HENRIK_API_KEY to your .env file"
      : `🔑 Henrik API key loaded (starts with: ${HENRIK_API_KEY.substring(0, 8)}...)`
  );
});
