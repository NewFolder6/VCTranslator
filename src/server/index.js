require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  }
});
const WebSocket = require('ws');
const routes = require('./routes');

// Set up static file serving without plugin
fastify.get('/css/*', async (request, reply) => {
  const filePath = path.join(__dirname, '../../public', request.url);
  return reply.type('text/css').send(fs.createReadStream(filePath));
});

fastify.get('/js/*', async (request, reply) => {
  const filePath = path.join(__dirname, '../../public', request.url);
  return reply.type('application/javascript').send(fs.createReadStream(filePath));
});

// Register API routes
routes.registerRoutes(fastify);

// Set up WebSocket server for subtitles
let wss;

// After server initialization, check if we're in limited mode
const hasSpeechRecognition = (() => {
  try {
    require('../speech-recognition');
    return true;
  } catch (e) {
    return false;
  }
})();

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    const serverAddress = fastify.server.address();
    fastify.log.info(`Server listening on ${serverAddress.port}`);
    
    // Create WebSocket server
    wss = new WebSocket.Server({ server: fastify.server });
    
    // Set up WebSocket handlers
    routes.registerWebSockets(wss, fastify);
    
    if (!hasSpeechRecognition) {
      console.log('\n┌───────────────────────────────────────────┐');
      console.log('│           LIMITED MODE ACTIVE             │');
      console.log('├───────────────────────────────────────────┤');
      console.log('│ • Speech recognition is not available     │');
      console.log('│ • To enable full functionality:           │');
      console.log('│   Run: npm run fix-vosk                   │');
      console.log('└───────────────────────────────────────────┘\n');
    }
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Root route that serves the HTML
fastify.get('/', async (request, reply) => {
  const filePath = path.join(__dirname, '../../public/index.html');
  const stream = fs.createReadStream(filePath);
  return reply.type('text/html').send(stream);
});
