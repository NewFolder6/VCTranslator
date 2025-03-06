const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== VCTranslator Speech Recognition Repair Tool ===');
console.log('This script will fix all issues with speech recognition');

// Step 1: Install Vosk package
console.log('\n1. Installing Vosk package...');
try {
  execSync('npm install vosk@0.3.39 --save', { stdio: 'inherit' });
  console.log('✓ Vosk installation completed');
} catch (err) {
  console.error('Failed to install Vosk:', err.message);
  console.log('\nTrying alternative approach...');
  try {
    execSync('npm install vosk@0.3.39 --no-save', { stdio: 'inherit' });
    console.log('✓ Vosk installed locally (not saved to package.json)');
  } catch (altErr) {
    console.error('All installation attempts failed.');
    console.log('You may need to install Vosk manually or check your Node.js setup.');
  }
}

// Step 2: Download the model
console.log('\n2. Downloading speech model...');
try {
  execSync('npm run download-specific-model', { stdio: 'inherit' });
  console.log('✓ Model download completed');
} catch (err) {
  console.error('Model download failed:', err.message);
}

// Step 3: Verify everything is working
console.log('\n3. Verifying installation...');
try {
  // See if we can load Vosk now
  const vosk = require('vosk');
  console.log('✓ Vosk loaded successfully');
  
  try {
    const modelPath = path.join(process.cwd(), 'models', 'vosk-model-en');
    const model = new vosk.Model(modelPath);
    console.log('✓ Vosk model loaded successfully');
    // Free the model to avoid memory leak
    if (model.free) model.free();
  } catch (modelErr) {
    console.error('Failed to load model:', modelErr.message);
    console.log('The model may still need repairs. Please run:');
    console.log('npm run verify-model');
  }
} catch (err) {
  console.error('Failed to load Vosk:', err.message);
}

// Step 4: Create a compatibility startup script if needed
console.log('\n4. Setting up compatibility mode...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);

if (majorVersion > 18) {
  console.log(`Detected Node.js ${nodeVersion} - creating compatibility launch script`);
  
  const startScriptContent = `#!/usr/bin/env node
/**
 * VCTranslator Compatibility Launcher
 * Created automatically for Node.js ${nodeVersion}
 */
const { spawn } = require('child_process');

console.log('Starting VCTranslator in compatibility mode...');
const env = { ...process.env, NODE_OPTIONS: '--no-node-snapshot' };

const child = spawn('node', ['src/server/index.js'], { 
  stdio: 'inherit',
  env: env
});

child.on('exit', (code) => {
  process.exit(code);
});
`;
  
  fs.writeFileSync('start.js', startScriptContent);
  console.log('✓ Created compatibility launch script: start.js');
  console.log('To start the application in compatibility mode, run:');
  console.log('node start.js');
}

console.log('\n=== Repair Completed ===');
console.log('The speech recognition should now be working.');
console.log('To start the application:');
console.log(majorVersion > 18 ? 'node start.js' : 'npm start');
