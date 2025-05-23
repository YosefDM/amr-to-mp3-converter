const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(express.json());

app.post('/api/convert', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });

    const tempInputPath = path.join(__dirname, 'input.amr');
    const tempOutputPath = path.join(__dirname, 'output.mp3');

    const writer = fs.createWriteStream(tempInputPath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      ffmpeg(tempInputPath)
        .toFormat('mp3')
        .on('end', () => {
          res.sendFile(tempOutputPath, () => {
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(tempOutputPath);
          });
        })
        .on('error', (err) => {
          console.error(err);
          res.status(500).json({ error: 'Conversion failed' });
        })
        .save(tempOutputPath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the AMR file' });
  }
});

module.exports = app;
