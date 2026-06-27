import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const api = {
  getPlayer: (name, tag) => axios.get(`${BASE}/player/${name}/${tag}`),
  getMMR: (region, name, tag) => axios.get(`${BASE}/mmr/${region}/${name}/${tag}`),

  // Fetch last 50 matches
  getMatches: (region, name, tag, mode = "competitive") =>
    axios.get(`${BASE}/matches/${region}/${name}/${tag}`, { params: { mode, size: 20 } }),

  getMMRHistory: (region, name, tag) =>
    axios.get(`${BASE}/mmr-history/${region}/${name}/${tag}`),

  getAgents: () => axios.get(`${BASE}/agents`),
  getTiers:  () => axios.get(`${BASE}/tiers`),
  getMaps:   () => axios.get(`${BASE}/maps`),
};

// Parse a v3 match for a specific player's stats
export function extractPlayerStats(match, playerName, playerTag) {
  const allPlayers = match?.players?.all_players || [];
  const me = allPlayers.find(
    (p) =>
      p.name?.toLowerCase() === playerName?.toLowerCase() &&
      p.tag?.toLowerCase() === playerTag?.toLowerCase()
  );
  if (!me) return null;

  const myTeam  = me.team?.toLowerCase();
  const oppTeam = myTeam === "blue" ? "red" : "blue";

  const myTeamData  = match?.teams?.[myTeam];
  const oppTeamData = match?.teams?.[oppTeam];

  const myRoundsWon  = myTeamData?.rounds_won  ?? 0;
  const oppRoundsWon = oppTeamData?.rounds_won ?? 0;

  // Prefer has_won when it's explicitly a boolean; fall back to rounds comparison
  // only when there is actual round data (avoids defaulting to loss on missing data)
  let won;
  if (myTeamData?.has_won === true || myTeamData?.has_won === false) {
    won = myTeamData.has_won;
  } else if (myRoundsWon > 0 || oppRoundsWon > 0) {
    won = myRoundsWon > oppRoundsWon;
  } else {
    won = false;
  }

  const kills   = me.stats?.kills   ?? 0;
  const deaths  = me.stats?.deaths  ?? 0;
  const assists = me.stats?.assists ?? 0;

  const roundDiff = myRoundsWon - oppRoundsWon;

  // ADR — damage_made is a top-level field on the player object in v3
  const roundsPlayed   = match?.metadata?.rounds_played > 0 ? match.metadata.rounds_played : 0;
  const damageMade     = me.damage_made    ?? 0;
  const damageReceived = me.damage_received ?? 0;
  const adr = roundsPlayed > 0 ? Math.round(damageMade / roundsPlayed) : 0;

  // First blood & clutch from round-level data (may not be present on all tiers)
  const roundData = Array.isArray(match?.rounds) ? match.rounds : [];
  let firstBloods   = 0;
  let clutchAttempts = 0;
  let clutchesWon   = 0;

  if (roundData.length > 0 && me.puuid) {
    // Build puuid → team map from top-level player list
    const teamMap = {};
    allPlayers.forEach((p) => { if (p.puuid) teamMap[p.puuid] = p.team?.toLowerCase(); });
    const myTeamPuuids  = new Set(Object.entries(teamMap).filter(([, t]) => t === myTeam).map(([p]) => p));
    const enemyPuuids   = new Set(Object.entries(teamMap).filter(([, t]) => t === oppTeam).map(([p]) => p));

    roundData.forEach((round) => {
      // Flatten all kills in this round and sort by kill time
      const allKills = [];
      const playerStats = Array.isArray(round.player_stats) ? round.player_stats : [];
      playerStats.forEach((ps) => {
        const kills = Array.isArray(ps.kills) ? ps.kills : [];
        kills.forEach((kill) => {
          allKills.push({
            time:        kill.kill_time_in_round ?? 0,
            killerPuuid: kill.killer_puuid,
            victimPuuid: kill.victim_puuid,
          });
        });
      });
      allKills.sort((a, b) => a.time - b.time);

      // First blood: our player got the very first kill in the round
      if (allKills.length > 0 && allKills[0].killerPuuid === me.puuid) {
        firstBloods++;
      }

      // Clutch: track alive sets and detect 1vN situations
      const myAlive    = new Set(myTeamPuuids);
      const enemyAlive = new Set(enemyPuuids);
      let inClutch = false;

      for (const kill of allKills) {
        if (myTeamPuuids.has(kill.victimPuuid))  myAlive.delete(kill.victimPuuid);
        if (enemyPuuids.has(kill.victimPuuid))   enemyAlive.delete(kill.victimPuuid);

        // Clutch condition: I'm the only teammate left and enemies remain
        const teammatesStillAlive = [...myAlive].filter((p) => p !== me.puuid).length;
        if (!inClutch && teammatesStillAlive === 0 && myAlive.has(me.puuid) && enemyAlive.size > 0) {
          inClutch = true;
        }
      }

      if (inClutch) {
        clutchAttempts++;
        if (round.winning_team?.toLowerCase() === myTeam) clutchesWon++;
      }
    });
  }

  const roundsWithData = roundData.length;
  const fbRate     = roundsWithData > 0 ? +(firstBloods / roundsWithData * 100).toFixed(1) : null;
  const clutchRate = clutchAttempts > 0 ? Math.round(clutchesWon / clutchAttempts * 100)   : null;

  return {
    agent:      me.character,
    agentImage: me.assets?.agent?.small,
    kills,
    deaths,
    assists,
    kda: deaths === 0
      ? (kills + assists).toFixed(2)
      : ((kills + assists) / deaths).toFixed(2),
    score:          me.stats?.score    ?? 0,
    headshots:      me.stats?.headshots ?? 0,
    bodyshots:      me.stats?.bodyshots ?? 0,
    legshots:       me.stats?.legshots  ?? 0,
    damageMade,
    damageReceived,
    adr,
    firstBloods,
    roundsWithData,
    fbRate,
    clutchAttempts,
    clutchesWon,
    clutchRate,
    won,
    roundDiff,
    map:      match?.metadata?.map,
    mode:     match?.metadata?.mode,
    startedAt: match?.metadata?.game_start_patched,
    rounds:   roundsPlayed,
    matchId:  match?.metadata?.matchid,
  };
}
