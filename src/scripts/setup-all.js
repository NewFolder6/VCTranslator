const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Complete VCTranslator Setup ===');
console.log('This script will perform all necessary steps to configure the application');

// Step 1: Check if Vosk is installed
console.log('\n1. Checking Vosk installation...');
try {
  require.resolve('vosk');
  console.log('✓ Vosk is already installed');
} catch (err) {
  console.log('Vosk is not installed, installing now...');
  try {
    execSync('npm install vosk@0.3.39 --save', { stdio: 'inherit' });
    console.log('✓ Vosk installation completed');
  } catch (installErr) {
    console.error('Failed to install Vosk:', installErr.message);
    console.log('Continuing with setup...');
  }
}

// Step 2: Download model
console.log('\n2. Setting up speech recognition model...');
try {
  execSync('node src/scripts/download-specific-model.js', { stdio: 'inherit' });
} catch (err) {
  console.error('Error during model download:', err.message);
  console.log('Trying to fix model structure...');
  
  try {
    execSync('node src/scripts/create-model-structure.js', { stdio: 'inherit' });
  } catch (fixErr) {
    console.error('Error fixing model structure:', fixErr.message);
  }
}

// Step 3: Verify model
console.log('\n3. Verifying model...');
try {
  execSync('node src/scripts/verify-model.js', { stdio: 'inherit' });
  console.log('✓ Model verification completed');
} catch (err) {
  console.error('Model verification failed:', err.message);
}

// Step 4: Check Node.js version and suggest compatibility mode if needed
console.log('\n4. Checking Node.js compatibility...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);

if (majorVersion > 18) {
  console.log(`⚠️ Using Node.js ${nodeVersion} (higher than recommended v18)`);
  console.log('Setting up compatibility mode...');
  
  // Create a startup script that automatically uses compatibility mode
  const startScriptPath = path.join(process.cwd(), 'start-app.js');
  const startScriptContent = `
// This is an auto-generated script to start VCTranslator in compatibility mode
// Created by setup-all.js
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting VCTranslator in compatibility mode for Node.js ${nodeVersion}...');
const env = { ...process.env, NODE_OPTIONS: '--no-node-snapshot' };
const child = spawn('node', ['src/server/index.js'], { 
  stdio: 'inherit',
  env: env 
});

child.on('exit', (code) => {
  process.exit(code);
});
  `.trim();
  
  fs.writeFileSync(startScriptPath, startScriptContent);
  console.log(`✓ Created compatibility startup script at ${startScriptPath}`);
  console.log('You can start the application with: node start-app.js');
} else {
  console.log(`✓ Node.js ${nodeVersion} should be compatible`);
  console.log('You can start the application with: npm start');
}

console.log('\n=== Setup Complete ===');
console.log('You should now be able to run the application.');
console.log('If issues persist, run: npm run diagnose');
