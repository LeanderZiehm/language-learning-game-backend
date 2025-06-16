// server.js
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const vosk = require('vosk');
const { Readable } = require('stream');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Set Vosk log level (0 = no logs, 3 = debug)
vosk.setLogLevel(0);

// Load Vosk model (you'll need to download this separately)
const MODEL_PATH = './vosk-model'; // Path to your Vosk model
let model;

try {
  model = new vosk.Model(MODEL_PATH);
  console.log('Vosk model loaded successfully');
} catch (error) {
  console.error('Failed to load Vosk model:', error.message);
  console.log('Please download a Vosk model from https://alphacephei.com/vosk/models');
  process.exit(1);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Create a new recognizer for this connection
  const rec = new vosk.KaldiRecognizer(model, 16000);
  
  ws.on('message', (data) => {
    try {
      // Check if it's audio data (binary) or control message (text)
      if (Buffer.isBuffer(data)) {
        // Process audio data
        const audioBuffer = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
        
        if (rec.acceptWaveform(audioBuffer)) {
          // Final result
          const result = JSON.parse(rec.result());
          if (result.text) {
            ws.send(JSON.stringify({
              type: 'final',
              text: result.text
            }));
          }
        } else {
          // Partial result
          const partialResult = JSON.parse(rec.partialResult());
          if (partialResult.partial) {
            ws.send(JSON.stringify({
              type: 'partial',
              text: partialResult.partial
            }));
          }
        }
      } else {
        // Handle control messages
        const message = JSON.parse(data.toString());
        if (message.type === 'start') {
          console.log('Transcription started');
        } else if (message.type === 'stop') {
          console.log('Transcription stopped');
          // Get final result
          const finalResult = JSON.parse(rec.finalResult());
          if (finalResult.text) {
            ws.send(JSON.stringify({
              type: 'final',
              text: finalResult.text
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing audio data'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    rec.free();
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    rec.free();
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the transcription app`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

