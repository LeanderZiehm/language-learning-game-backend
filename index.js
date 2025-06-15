const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');
const { Buffer } = require('buffer');

dotenv.config();

const app = express();
app.use(express.json({ limit: '30mb' }));
app.use(express.static('public'));


const groqWhisperModels = [
   "whisper-large-v3-turbo",
  "whisper-large-v3",
  "distil-whisper-large-v3-en"
];

const chosenWhisperModel = groqWhisperModels[0];
const whisperLanguage = 'en';
const whisperTemperature = 0.0;


app.post('/transcribe', async (req, res) => {
  try {
    const { audioBase64 } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'No audio provided.' });
    }

    const matches = audioBase64.match(/^data:audio\/webm;base64,(.*)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid audio format.' });
    }

    const buffer = Buffer.from(matches[1], 'base64');

    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', chosenWhisperModel);
    formData.append('temperature', whisperTemperature);
    formData.append('language', whisperLanguage);
    formData.append('response_format', 'json');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    res.json({ text: response.data.text });
  } catch (error) {
    console.error('Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to transcribe audio.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
