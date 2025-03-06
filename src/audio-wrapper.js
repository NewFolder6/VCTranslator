/**
 * Audio wrapper that provides graceful fallbacks for environments 
 * where native modules might fail to load
 */

// Check if we should skip native modules
const SKIP_NATIVE_MODULES = process.env.SKIP_NATIVE_MODULES === 'true';

let AudioLoopback;
let audioRecordingSupported = true;

// Try to load the native audio module or use a fallback
try {
  if (SKIP_NATIVE_MODULES) {
    throw new Error('Native modules skipped by configuration');
  }
  
  // Attempt to load the native audio loopback
  AudioLoopback = require('./utils/audioLoopback');
  console.log('Loaded native audio loopback module');
} catch (err) {
  console.warn(`Native audio module couldn't be loaded: ${err.message}`);
  console.warn('Using fallback audio module with limited functionality');
  
  // Try alternative modules for basic functionality
  try {
    const Microphone = require('node-microphone');
    const { Readable } = require('stream');
    
    // Simple fallback implementation using node-microphone
    AudioLoopback = class FallbackAudioLoopback {
      constructor(options = {}) {
        this.options = options;
        this.isLooping = false;
        this.mic = null;
        console.warn('⚠️ Using node-microphone fallback - limited functionality');
      }
      
      getDevices() {
        return {
          input: [{ name: 'Default Microphone', deviceId: 'default' }],
          output: [{ name: 'Default Speaker', deviceId: 'default' }]
        };
      }
      
      start() {
        if (this.isLooping) return;
        
        try {
          this.mic = new Microphone();
          const stream = this.mic.startRecording();
          
          this.isLooping = true;
          console.log('Fallback microphone recording started');
          
          return stream;
        } catch (e) {
          console.error('Fallback audio failed:', e);
          audioRecordingSupported = false;
          this.stop();
          return Readable.from([Buffer.from([0])]);
        }
      }
      
      stop() {
        if (!this.isLooping) return;
        
        if (this.mic) {
          try {
            this.mic.stopRecording();
          } catch (e) {
            console.error('Error stopping microphone:', e);
          }
          this.mic = null;
        }
        
        this.isLooping = false;
        console.log('Fallback audio recording stopped');
      }
    };
  } catch (fallbackErr) {
    console.error('Fallback audio module also failed:', fallbackErr);
    audioRecordingSupported = false;
    
    // Ultimate fallback - does nothing but implements the interface
    AudioLoopback = class DummyAudioLoopback {
      constructor() {
        this.isLooping = false;
        console.warn('⚠️ No audio functionality available - audio disabled');
      }
      
      getDevices() {
        return { input: [], output: [] };
      }
      
      start() {
        this.isLooping = true;
        console.log('Dummy audio interface activated (no actual audio)');
        return require('stream').Readable.from([Buffer.from([0])]);
      }
      
      stop() {
        this.isLooping = false;
        console.log('Dummy audio interface stopped');
      }
    };
  }
}

module.exports = { 
  AudioLoopback,
  audioRecordingSupported
};
