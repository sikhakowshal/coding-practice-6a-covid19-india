const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API to GET all states in state table
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT *
        FROM state;
    `;

  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };

  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//API to GET a state based on given stateID in state table
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};
    `;

  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };

  const stateArray = await db.get(getStateQuery);

  response.send(convertDbObjectToResponseObject(stateArray));
});

//API to CREATE A DISTRICT in DISTRICT TABLE
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const createDistrictQuery = `
        INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
        VALUES (
            '${districtName}',
             ${stateId},
             ${cases},
             ${cured},
             ${active},
             ${deaths}
        );
    `;

  const dbResponse = db.run(createDistrictQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//API to GET a state based on given stateID in state table
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
    `;

  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };

  const districtArray = await db.get(getDistrictQuery);

  response.send(convertDbObjectToResponseObject(districtArray));
});

//API DISTRICT FROM DISTRICT TABLE BASED ON DISTRICT_ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API TO UPDATE A DISTRICT BASED ON DISTRICT ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE district
        SET 
          district_name = '${districtName}',
          state_id = ${stateId},
          cases = ${cases},
          cured = ${cured},
          active = ${active},
          deaths = ${deaths}
        WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API TO GET STATS OF A STATE BASED ON STATE_ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT cases, cured, active, deaths
        FROM district
        WHERE state_id = ${stateId};
    `;

  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      totalCases: dbObject.cases,
      totalCured: dbObject.cured,
      totalActive: dbObject.active,
      totalDeaths: dbObject.deaths,
    };
  };
  const stateStatsObject = await db.get(getStatsQuery);
  response.send(convertDbObjectToResponseObject(stateStatsObject));
});

//API TO GET STATE NAME BASED ON DISTRICT_ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  districtStateQuery = `
        SELECT state_name
        FROM state NATURAL JOIN district
        WHERE district_id = ${districtId};
    `;
  const givenDistrictState = await db.get(districtStateQuery);
  const givenDistrictStateObject = {
    stateName: givenDistrictState.state_name,
  };
  response.send(givenDistrictStateObject);
});

module.exports = app;
