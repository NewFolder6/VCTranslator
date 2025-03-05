const audioDevices = require('../audio/devices');
const audioCapture = require('../audio/capturer');
const speechRecognizer = require('../speech/recognizer');

// Store WebSocket clients for broadcast
const clients = new Set();

function registerRoutes(fastify) {
  // Get all audio output devices
  fastify.get('/api/devices', async (request, reply) => {
    const devices = await audioDevices.getOutputDevices();
    return devices;
  });

  // Start capturing and recognizing from selected device
  fastify.post('/api/start', async (request, reply) => {
    const { deviceId, language } = request.body;
    
    try {
      await speechRecognizer.setLanguage(language || 'en-US');
      await audioCapture.startCapturing(deviceId);
      return { success: true, message: 'Started capturing audio' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Stop capturing
  fastify.post('/api/stop', async (request, reply) => {
    try {
      await audioCapture.stopCapturing();
      return { success: true, message: 'Stopped capturing audio' };
    } catch (error) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Get current settings
  fastify.get('/api/settings', async (request, reply) => {
    return {
      currentDevice: audioCapture.getCurrentDevice(),
      isCapturing: audioCapture.isCapturing(),
      language: speechRecognizer.getCurrentLanguage(),
      availableLanguages: speechRecognizer.getAvailableLanguages()
    };
  });
}

function registerWebSockets(wss, fastify) {
  wss.on('connection', (ws) => {
    // Add client to the set
    clients.add(ws);
    fastify.log.info('Client connected to subtitle stream');

    // Listen for subtitle events
    const subtitleHandler = (subtitleText) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ text: subtitleText }));
      }
    };

    speechRecognizer.on('subtitle', subtitleHandler);

    // Handle client disconnection
    ws.on('close', () => {
      clients.delete(ws);
      speechRecognizer.removeListener('subtitle', subtitleHandler);
      fastify.log.info('Client disconnected from subtitle stream');
    });
  });
}

// Broadcast to all connected clients
function broadcastSubtitles(text) {
  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({ text }));
    }
  });
}

// Set up subtitle events to broadcast
speechRecognizer.on('subtitle', broadcastSubtitles);

module.exports = {
  registerRoutes,
  registerWebSockets
};
