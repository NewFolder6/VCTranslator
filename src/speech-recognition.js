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
  
  // Check if model exists and is not empty
  if (!fs.existsSync(MODEL_PATH) || fs.readdirSync(MODEL_PATH).length === 0) {
    console.warn(`Vosk model not found at ${MODEL_PATH}`);
    console.warn('Please run: node src/scripts/download-model.js');
    console.warn('or download a model from https://alphacephei.com/vosk/models');
    console.warn('and extract it to the models/vosk-model-en directory');
    throw new Error('Vosk model not found');
  }
  
  console.log('Vosk speech recognition module loaded');
} catch (err) {
  console.warn(`Speech recognition (Vosk) couldn't be loaded: ${err.message}`);
  speechRecognitionSupported = false;
}

// Modify the Vosk loading section with better error handling
let Vosk;
try {
  Vosk = require('vosk');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\n==========================================');
    console.error('🔴 Speech recognition (Vosk) module is missing');
    console.error('==========================================');
    console.error('To install and fix Vosk, run one of these commands:');
    console.error('  npm run fix-vosk     - Simple automatic installation');
    console.error('  npm run diagnose     - Run diagnostics');
    console.error('  npm run fix-speech   - Full fix for complex issues\n');
    console.error('Continuing in limited mode without speech recognition...');
    console.error('==========================================\n');
  } else {
    console.error('\n==========================================');
    console.error('🔴 Error initializing Vosk speech recognition:');
    console.error(error.message);
    console.error('==========================================');
    console.error('To fix this issue:');
    console.error('1. Run diagnostics: npm run diagnose');
    console.error('2. Try complete fix: npm run fix-speech');
    console.error('3. Check if your system meets requirements for Vosk');
    console.error('==========================================\n');
  }
  
  // Re-throw a more informative error
  throw new Error('Speech recognition unavailable. Run "npm run fix-vosk" to install.');
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
      // Check if model directory exists and has contents
      if (!fs.existsSync(this.options.modelPath) || fs.readdirSync(this.options.modelPath).length === 0) {
        console.error(`Model directory doesn't exist or is empty: ${this.options.modelPath}`);
        return false;
      }

      // Initialize Vosk
      vosk.setLogLevel(0); // Set to higher values for more verbose output
      const model = new vosk.Model(this.options.modelPath);
      this.recognizer = new vosk.Recognizer({
        model: model,
        sampleRate: this.options.sampleRate
      });
      
      console.log('Speech recognition initialized successfully');
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
