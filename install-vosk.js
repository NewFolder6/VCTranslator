const { execSync } = require('child_process');
const path = require('path');

console.log('Installing Vosk speech recognition module...');

try {
  // Install vosk package directly
  execSync('npm install vosk@0.3.39', { stdio: 'inherit' });
  
  // Verify installation
  try {
    // Try to require the module to see if it works
    const vosk = require('vosk');
    console.log('✓ Successfully installed and loaded Vosk module');
    
    // Check if model directory exists
    const modelPath = path.join(__dirname, 'models', 'vosk-model-en');
    const fs = require('fs');
    
    if (!fs.existsSync(modelPath)) {
      console.log('\n⚠️ Vosk model directory not found');
      console.log('Please download a model using one of these methods:');
      console.log('1. Run: npm run download-specific-model');
      console.log('2. Or manually download from: https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip');
      console.log('   and extract to: ' + modelPath);
    }
  } catch (loadErr) {
    console.error('✗ Vosk was installed but could not be loaded:', loadErr.message);
  }
} catch (err) {
  console.error('✗ Failed to install Vosk:', err.message);
  
  console.log('\nTrying alternative installation method...');
  try {
    // Try an alternative installation approach with --no-save flag
    execSync('npm install vosk@0.3.39 --no-save', { stdio: 'inherit' });
    console.log('✓ Vosk installed with alternative method');
  } catch (altErr) {
    console.error('✗ Alternative installation also failed:', altErr.message);
    console.log('\nPlease try installing manually with:');
    console.log('npm install vosk@0.3.39 --save');
  }
}
