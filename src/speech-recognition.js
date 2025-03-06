/**
 * Speech recognition wrapper that handles Vosk or provides a fallback
 */
const path = require('path');
const fs = require('fs');
const { Transform } = require('stream');

// Check if we should skip native modules
const SKIP_NATIVE_MODULES = process.env.SKIP_NATIVE_MODULES === 'true';

let vosk;
let speechRecognitionSupported = true;
const MODEL_PATH = path.join(process.cwd(), 'models', 'vosk-model-en');

// Try to load Vosk
try {
  if (SKIP_NATIVE_MODULES) {
    throw new Error('Native modules skipped by configuration');
  }
  
  vosk = require('vosk');
  
  if (!fs.existsSync(MODEL_PATH)) {
    console.warn(`Vosk model not found at ${MODEL_PATH}`);
    console.warn('Please download a model from https://alphacephei.com/vosk/models');
    console.warn('and extract it to the models/vosk-model-en directory');
    throw new Error('Vosk model not found');
  }
  
  console.log('Vosk speech recognition module loaded');
} catch (err) {
  console.warn(`Speech recognition (Vosk) couldn't be loaded: ${err.message}`);
  speechRecognitionSupported = false;
}

class SpeechRecognition {
  constructor(options = {}) {
    this.options = {
      sampleRate: 16000,
      modelPath: MODEL_PATH,
      ...options
    };
    
    this.recognizer = null;
    this.isListening = false;
  }
  
  initialize() {
    if (!speechRecognitionSupported) {
      console.warn('Speech recognition not available - running in limited mode');
      return false;
    }
    
    try {
      // Initialize Vosk
      vosk.setLogLevel(0); // Set to higher values for more verbose output
      const model = new vosk.Model(this.options.modelPath);
      this.recognizer = new vosk.Recognizer({
        model: model,
        sampleRate: this.options.sampleRate
      });
      
      console.log('Speech recognition initialized');
      return true;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      speechRecognitionSupported = false;
      return false;
    }
  }
  
  createRecognitionStream() {
    if (!speechRecognitionSupported || !this.recognizer) {
      // Return a dummy transform stream
      return new Transform({
        transform: (chunk, encoding, callback) => {
          callback(null, Buffer.from(JSON.stringify({ text: '[Speech recognition unavailable]' })));
        }
      });
    }
    
    // Create a transform stream for processing audio
    const recognitionStream = new Transform({
      transform: (chunk, encoding, callback) => {
        if (this.recognizer) {
          // Process audio chunk
          const isFinished = this.recognizer.acceptWaveform(chunk);
          
          // Get recognition results
          let result;
          if (isFinished) {
            result = this.recognizer.result();
          } else {
            result = this.recognizer.partialResult();
          }
          
          // Pass the result downstream
          callback(null, Buffer.from(JSON.stringify(result)));
        } else {
          callback(null, Buffer.from(JSON.stringify({ text: '' })));
        }
      },
      
      flush: (callback) => {
        if (this.recognizer) {
          const finalResult = this.recognizer.finalResult();
          callback(null, Buffer.from(JSON.stringify(finalResult)));
        } else {
          callback(null, Buffer.from(JSON.stringify({ text: '' })));
        }
      }
    });
    
    this.isListening = true;
    return recognitionStream;
  }
  
  stop() {
    if (!this.isListening) return;
    
    if (speechRecognitionSupported && this.recognizer) {
      this.recognizer.free();
      this.recognizer = null;
    }
    
    this.isListening = false;
    console.log('Speech recognition stopped');
  }
}

module.exports = {
  SpeechRecognition,
  speechRecognitionSupported
};
