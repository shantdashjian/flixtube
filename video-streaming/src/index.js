const express = require("express");
const http = require("http");
const mongodb = require("mongodb");

const app = express();
const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

async function main() {
  const client = await mongodb.MongoClient.connect(DBHOST);
  const db = client.db(DBNAME);
  const videosCollection = db.collection("videos");
  app.get("/video", async (req, res) => {
    const videoId = new mongodb.ObjectId(req.query.id);
    const videoRecord = await videosCollection.findOne({ _id: videoId });
    if (!videoRecord) {
      res.sendStatus(404);
      return;
    }
    const forwardRequest = http.request(
      {
        host: VIDEO_STORAGE_HOST,
        port: VIDEO_STORAGE_PORT,
        path: `/video?path=${videoRecord.videoPath}`,
        method: 'GET',
        headers: req.headers
      },
      forwardResponse => {
        res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
        forwardResponse.pipe(res);
      }
    );
    req.pipe(forwardRequest);
  });
  //
  // Starts the HTTP server.
  //
  app.listen(PORT, () => {
    console.log(`Microservice listening, please load the data file db-fixture/videos.json into your database before testing this microservice.`);
  });
}

main()
  .catch(err => {
    console.error("Microservice failed to start.");
    console.error(err && err.stack || err);
  });