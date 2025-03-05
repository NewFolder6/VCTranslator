const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const vosk = require('vosk');

class SpeechRecognizer extends EventEmitter {
  constructor() {
    super();
    this.model = null;
    this.recognizer = null;
    this.currentLanguage = 'en-US';
    
    // Map of available language models
    this.languages = {
      'en-US': 'model-en-us',
      'fr-FR': 'model-fr',
      'de-DE': 'model-de',
      'es-ES': 'model-es',
      'ru-RU': 'model-ru'
    };
    
    // Initialize the default model
    this.initModel();
  }

  async initModel() {
    try {
      const modelPath = path.join(__dirname, '../../models', this.languages[this.currentLanguage]);
      
      if (!fs.existsSync(modelPath)) {
        console.warn(`Model not found at ${modelPath}. You need to download the Vosk model.`);
        console.info('Download models from https://alphacephei.com/vosk/models and extract to the models directory.');
        return;
      }
      
      // Initialize the model
      this.model = new vosk.Model(modelPath);
      
      // Create recognizer with default parameters
      this.recognizer = new vosk.Recognizer({
        model: this.model,
        sampleRate: 16000
      });
      
      console.log(`Initialized speech recognition model: ${this.currentLanguage}`);
    } catch (error) {
      console.error('Failed to initialize speech recognizer:', error);
    }
  }

  async setLanguage(language) {
    if (!this.languages[language]) {
      throw new Error(`Language model not available for ${language}`);
    }
    
    this.currentLanguage = language;
    await this.initModel();
    return true;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.keys(this.languages);
  }

  processAudio(audioChunk) {
    if (!this.recognizer) {
      return;
    }

    try {
      // Process audio chunk
      const result = this.recognizer.acceptWaveform(audioChunk);
      
      // If we have a result, emit it
      if (result) {
        const text = JSON.parse(this.recognizer.result()).text;
        if (text && text.trim()) {
          this.emit('subtitle', text);
        }
      } else {
        // Partial results if needed
        // const partialText = JSON.parse(this.recognizer.partialResult()).partial;
        // if (partialText && partialText.trim()) {
        //   this.emit('partialSubtitle', partialText);
        // }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  }
}

module.exports = new SpeechRecognizer();
