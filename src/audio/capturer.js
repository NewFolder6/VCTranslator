const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const audioLoopback = require('audio-loopback');
const speechRecognizer = require('../speech/recognizer');

class AudioCapturer extends EventEmitter {
  constructor() {
    super();
    this.capturing = false;
    this.currentDevice = null;
    this.captureProcess = null;
  }

  async startCapturing(deviceId) {
    if (this.capturing) {
      await this.stopCapturing();
    }

    this.currentDevice = deviceId;
    this.capturing = true;

    try {
      // In a real implementation, you would use a platform-specific approach
      // to capture audio output from the selected device
      
      // This is a simplified example using audio-loopback
      const stream = await audioLoopback.record({
        deviceId: deviceId,
        channels: 1,
        sampleRate: 16000,
        format: 'wav'
      });

      // Pipe the audio data to the speech recognizer
      stream.on('data', (chunk) => {
        speechRecognizer.processAudio(chunk);
      });

      stream.on('error', (err) => {
        console.error('Audio capture error:', err);
        this.emit('error', err);
      });

      this.captureProcess = stream;
      this.emit('started', deviceId);
      return true;
    } catch (error) {
      console.error('Failed to start audio capturing:', error);
      this.capturing = false;
      this.currentDevice = null;
      throw error;
    }
  }

  async stopCapturing() {
    if (!this.capturing) return;

    if (this.captureProcess) {
      try {
        // Stop the audio capture process
        this.captureProcess.destroy();
        this.captureProcess = null;
      } catch (error) {
        console.error('Error stopping capture process:', error);
      }
    }

    this.capturing = false;
    this.currentDevice = null;
    this.emit('stopped');
  }

  isCapturing() {
    return this.capturing;
  }

  getCurrentDevice() {
    return this.currentDevice;
  }
}

module.exports = new AudioCapturer();
