const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerObjToResp = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

const convertmatchObjToResp = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//1.List of all players in players table
app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT *FROM player_details;`;
  const playersArr = await db.all(playersQuery);
  response.send(
    playersArr.map((eachPlayer) => convertPlayerObjToResp(eachPlayer))
  );
});

//2.Player based on playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT *FROM player_details
                        WHERE player_id= ${playerId};`;
  const playerResp = await db.get(playerQuery);
  response.send(convertPlayerObjToResp(playerResp));
});

//3.Update details of specific player based on playerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `UPDATE player_details 
                        SET player_name= '${playerName}'
                        WHERE player_id= ${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

//4.Match details of specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailQuery = `SELECT match_id AS matchId,
                            match,
                            year
                            FROM match_details
                            WHERE match_id=${matchId};`;
  const matchDetailResp = await db.get(matchDetailQuery);
  response.send(matchDetailResp);
});

//5.list of all matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const allMatchQuery = `SELECT *FROM 
                                player_match_score NATURAL JOIN match_details 
                                WHERE player_id= ${playerId};`;
  const allMatchArr = await db.all(allMatchQuery);
  response.send(
    allMatchArr.map((eachMatch) => convertmatchObjToResp(eachMatch))
  );
});

//6.list of players of specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const allPlayerQuery = `SELECT *FROM
                            player_match_score NATURAL JOIN player_details
                            WHERE match_id=${matchId};`;
  const allPlayerResp = await db.all(allPlayerQuery);
  response.send(
    allPlayerResp.map((eachPLayer) => convertPlayerObjToResp(eachPLayer))
  );
});

//7.Statistics of specific player based on playerId
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const statPlayerQuery = `SELECT 
                            player_details.player_id AS playerId,
                            player_details.player_name AS playerName,
                            SUM(score) AS totalScore,
                            SUM(fours) AS totalFours,
                            SUM(sixes) AS totalSixes
                            FROM player_match_score  INNER JOIN player_details
                            ON player_match_score.player_id =  player_details.player_id 
                            WHERE player_details.player_id = ${playerId};`;
  const statPlayerResp = await db.get(statPlayerQuery);
  response.send(statPlayerResp);
});

module.exports = app;
