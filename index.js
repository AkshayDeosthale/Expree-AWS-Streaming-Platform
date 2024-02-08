const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const { getFileFromAwsS3 } = require("./aws.config");
const { default: axios } = require("axios");
const port = 3000;

require("dotenv").config();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/video", (req, res) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }
  const videoPath = "./public/temp.mov";
  const videoSize = fs.statSync(videoPath).size;
  const format = path.extname(videoPath);

  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": `video/${format.replace(".", "")}`,
  };

  res.writeHead(206, headers);

  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
});

app.get("/video-aws", async (req, res) => {
  try {
    const url = await getFileFromAwsS3();
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });

    response.data.pipe(res);
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
