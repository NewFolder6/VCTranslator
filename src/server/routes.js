const { AudioLoopback, audioRecordingSupported } = require('../audio-wrapper');
const { SpeechRecognition, speechRecognitionSupported } = require('../speech-recognition');
const path = require('path');

// Initialize audio and speech recognition
const audioLoopback = new AudioLoopback();
const speechRecognition = new SpeechRecognition();

// Try to initialize speech recognition
const recognitionAvailable = speechRecognition.initialize();

// Store WebSocket clients for broadcast
const clients = new Set();

function registerRoutes(fastify) {
  // API endpoint for audio devices
  fastify.get('/api/audio-devices', async (request, reply) => {
    try {
      const devices = audioLoopback.getDevices();
      return reply.code(200).send({ 
        success: true, 
        devices,
        audioRecordingSupported
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ 
        success: false, 
        error: 'Failed to get audio devices',
        audioRecordingSupported 
      });
    }
  });
  
  // API endpoint to get speech recognition status
  fastify.get('/api/speech-status', async (request, reply) => {
    return reply.code(200).send({
      available: recognitionAvailable,
      initialized: recognitionAvailable && speechRecognition.isListening
    });
  });

  // Get all audio output devices - Fixed to use audioLoopback
  fastify.get('/api/devices', async (request, reply) => {
    try {
      const devices = audioLoopback.getDevices();
      return reply.code(200).send({
        success: true,
        devices: devices.output || []
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get audio devices'
      });
    }
  });

  // Start capturing and recognizing from selected device - Fixed
  fastify.post('/api/start', async (request, reply) => {
    const { deviceId, language } = request.body || {};
    
    try {
      // Set language if speech recognition is available
      if (recognitionAvailable && language) {
        // Note: Language setting would need to be implemented in SpeechRecognition class
        // Currently using default language from Vosk model
      }
      
      // Start audio loopback with specified device
      audioLoopback.options.deviceId = deviceId || 0;
      audioLoopback.start();
      
      return reply.code(200).send({ 
        success: true, 
        message: 'Started capturing audio',
        deviceId: audioLoopback.options.deviceId
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Stop capturing - Fixed
  fastify.post('/api/stop', async (request, reply) => {
    try {
      audioLoopback.stop();
      if (recognitionAvailable) {
        speechRecognition.stop();
      }
      return reply.code(200).send({ 
        success: true, 
        message: 'Stopped capturing audio' 
      });
    } catch (error) {
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // Get current settings - Fixed
  fastify.get('/api/settings', async (request, reply) => {
    return reply.code(200).send({
      currentDevice: audioLoopback.options.deviceId,
      isCapturing: audioLoopback.isLooping,
      audioSupported: audioRecordingSupported,
      speechRecognitionAvailable: recognitionAvailable
    });
  });
}

function registerWebSockets(wss, fastify) {
  wss.on('connection', (ws) => {
    // Add client to set for broadcasting
    clients.add(ws);
    fastify.log.info('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'info', 
      message: 'Connected to VCTranslator',
      audioRecordingSupported,
      speechRecognitionAvailable: recognitionAvailable
    }));
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.action === 'start-recognition') {
          // Start audio loopback and speech recognition
          if (audioRecordingSupported) {
            const audioStream = audioLoopback.start();
            
            if (recognitionAvailable) {
              const recognitionStream = speechRecognition.createRecognitionStream();
              
              // Pipe audio to recognition
              audioStream.pipe(recognitionStream);
              
              // Handle recognition results
              recognitionStream.on('data', (resultData) => {
                try {
                  const result = JSON.parse(resultData.toString());
                  ws.send(JSON.stringify({
                    type: 'recognition',
                    result
                  }));
                } catch (err) {
                  fastify.log.error('Error processing recognition result:', err);
                }
              });
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Speech recognition not available'
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Audio recording not available'
            }));
          }
        }
        
        else if (data.action === 'stop-recognition') {
          // Stop everything
          audioLoopback.stop();
          speechRecognition.stop();
          ws.send(JSON.stringify({ type: 'info', message: 'Recognition stopped' }));
        }
        
      } catch (err) {
        fastify.log.error('Error processing WebSocket message:', err);
      }
    });
    
    ws.on('close', () => {
      // Remove client from set
      clients.delete(ws);
      fastify.log.info('WebSocket client disconnected');
      
      // Clean up resources if this was the last client
      if (clients.size === 0) {
        audioLoopback.stop();
        speechRecognition.stop();
      }
    });
  });
}

module.exports = {
  registerRoutes,
  registerWebSockets
};
