import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, extractPlayerStats } from "../utils/api";
import { useFavourites } from "../utils/useFavourites";
import PlayerHeader from "../components/PlayerHeader";
import PlayerInsights from "../components/PlayerInsights";
import StatsOverview from "../components/StatsOverview";
import MatchHistory from "../components/MatchHistory";
import BreakdownTables from "../components/BreakdownTables";
import PerformanceTrend from "../components/PerformanceTrend";
import RankHistory from "../components/RankHistory";
import PlayerComparison from "../components/PlayerComparison";
import "./Profile.css";

export default function Profile() {
  const { name, tag } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer]               = useState(null);
  const [mmr, setMmr]                     = useState(null);
  const [tierImages, setTierImages]        = useState({});
  const [mapImages,  setMapImages]         = useState({});
  const [matches, setMatches]             = useState([]);
  const [rawMatches, setRawMatches]       = useState([]);
  const [mmrHistory, setMmrHistory]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError]                 = useState(null);
  const [detectedRegion, setDetectedRegion] = useState(null);

  const decodedName = decodeURIComponent(name);
  const decodedTag  = decodeURIComponent(tag);
  const { add: addFavourite } = useFavourites();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      setMatches([]);
      setRawMatches([]);
      try {
        // Step 1 — account (needed to get region)
        const playerRes = await api.getPlayer(decodedName, decodedTag);
        const playerData = playerRes.data?.data;
        if (!playerData) throw new Error("Player not found. Check the name/tag and try again.");
        setPlayer(playerData);
        addFavourite(decodedName, decodedTag);

        const region = playerData.region?.toLowerCase() || "na";
        setDetectedRegion(region);
        setLoading(false); // show header immediately

        // Step 2 — MMR + matches + MMR history + tiers in parallel
        setLoadingMatches(true);
        const [mmrRes, matchesRes, mmrHistoryRes, tiersRes, mapsRes] = await Promise.allSettled([
          api.getMMR(region, decodedName, decodedTag),
          api.getMatches(region, decodedName, decodedTag),
          api.getMMRHistory(region, decodedName, decodedTag),
          api.getTiers(),
          api.getMaps(),
        ]);

        if (mmrRes.status === "fulfilled") setMmr(mmrRes.value.data?.data);

        if (matchesRes.status === "fulfilled") {
          const raw = matchesRes.value.data?.data || [];
          setRawMatches(raw);
          const parsed = raw
            .map((m) => extractPlayerStats(m, decodedName, decodedTag))
            .filter(Boolean);
          setMatches(parsed);
        }

        if (mmrHistoryRes.status === "fulfilled") {
          setMmrHistory(mmrHistoryRes.value.data?.data || []);
        }

        if (tiersRes.status === "fulfilled") {
          const allTiers = tiersRes.value.data?.data ?? [];
          const latest = allTiers[allTiers.length - 1];
          const map = {};
          (latest?.tiers ?? []).forEach((t) => {
            if (t.tierName && t.smallIcon) map[t.tierName.toLowerCase()] = t.smallIcon;
          });
          setTierImages(map);
        }

        if (mapsRes.status === "fulfilled") {
          const allMaps = mapsRes.value.data?.data ?? [];
          const map = {};
          allMaps.forEach((m) => {
            if (m.displayName && m.listViewIcon) map[m.displayName.toLowerCase()] = m.listViewIcon;
          });
          setMapImages(map);
        }
      } catch (err) {
        setError(err.message || "Something went wrong. Is the backend running?");
        setLoading(false);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchAll();
  }, [decodedName, decodedTag]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Fetching {decodedName}#{decodedTag}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <div className="error-icon">✕</div>
        <h2>Player Not Found</h2>
        <p>{error}</p>
        <button className="back-btn" onClick={() => navigate("/")}>← Back to Search</button>
      </div>
    );
  }

  return (
    <div className="profile-page fade-up">
      <div className="profile-inner">
        <button className="back-link" onClick={() => navigate("/")}>← Back</button>

        {/* Player header always shows immediately */}
        <PlayerHeader player={player} mmr={mmr} region={detectedRegion} matches={matches} tierImages={tierImages} />

        {loadingMatches ? (
          <div className="matches-loading">
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            <span>Loading match history…</span>
          </div>
        ) : matches.length > 0 ? (
          <>
            <PlayerInsights matches={matches} mapImages={mapImages} />

            <div className="profile-main-grid">
              <div className="col-left">
                <StatsOverview matches={matches} />
                <PerformanceTrend matches={matches} />
                {mmrHistory.length > 0 && <RankHistory mmrHistory={mmrHistory} />}
              </div>
              <div className="col-right">
                <MatchHistory
                  matches={matches}
                  rawMatches={rawMatches}
                  viewerName={decodedName}
                  viewerTag={decodedTag}
                />
              </div>
            </div>

            <PlayerComparison myMatches={matches} myPlayer={player} myMmr={mmr} />
            <BreakdownTables matches={matches} />
          </>
        ) : (
          <p className="no-data-msg">No competitive matches found.</p>
        )}
      </div>
    </div>
  );
}
