const naudiodon = require('naudiodon');
const audioPlay = require('audio-play');
const { Transform } = require('stream');

class AudioLoopback {
  constructor(options = {}) {
    this.options = {
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      deviceId: 0,  // Default audio input device
      ...options
    };
    
    this.aiStream = null;
    this.transformStream = null;
    this.audioBuffer = [];
    this.isLooping = false;
  }

  // Check available audio devices
  getDevices() {
    try {
      const devices = {
        input: naudiodon.getDevices().filter(device => device.maxInputChannels > 0),
        output: naudiodon.getDevices().filter(device => device.maxOutputChannels > 0)
      };
      return devices;
    } catch (err) {
      console.error('Error getting audio devices:', err);
      return { 
        input: [{ name: 'Default Input', deviceId: 0 }],
        output: [{ name: 'Default Output', deviceId: 0 }]
      };
    }
  }

  start() {
    if (this.isLooping) return;
    
    try {
      // Create audio input stream
      this.aiStream = naudiodon.AudioIO({
        inOptions: {
          channelCount: this.options.channels,
          sampleFormat: naudiodon.SampleFormat16Bit,
          sampleRate: this.options.sampleRate,
          deviceId: this.options.deviceId,
          closeOnError: true
        }
      });
      
      // Create transform stream to handle audio data
      this.transformStream = new Transform({
        transform: (chunk, encoding, callback) => {
          // Store the audio data for playback
          this.audioBuffer.push(new Float32Array(chunk.buffer));
          
          // Play the audio with minimal delay
          if (this.audioBuffer.length > 5) {
            const audioData = this.audioBuffer.shift();
            audioPlay(audioData, {
              format: [this.options.sampleRate, this.options.channels],
              autoplay: true
            });
          }
          
          callback(null, chunk);
        }
      });
      
      // Start the audio input stream
      this.aiStream.start();
      this.aiStream.pipe(this.transformStream);
      
      this.isLooping = true;
      console.log('Audio loopback started');
      
      return this.transformStream;
    } catch (err) {
      console.error('Failed to start audio loopback:', err);
      this.stop();
      throw err;
    }
  }

  stop() {
    if (!this.isLooping) return;
    
    if (this.aiStream) {
      this.aiStream.quit();
      this.aiStream = null;
    }
    
    if (this.transformStream) {
      this.transformStream.end();
      this.transformStream = null;
    }
    
    this.audioBuffer = [];
    this.isLooping = false;
    console.log('Audio loopback stopped');
  }
}

module.exports = AudioLoopback;
