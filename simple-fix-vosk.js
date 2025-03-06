const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('======================================');
console.log('Simple Vosk Installation Fix');
console.log('======================================');
console.log('\nThis script will:');
console.log('1. Install vosk@0.3.39');
console.log('2. Check if installation was successful');
console.log('3. Verify model directory exists');

// Function to run a command with live output
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n> Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(new Error(`Failed to start command: ${err.message}`));
    });
  });
}

// Main function
async function main() {
  try {
    console.log('\nStep 1: Installing Vosk package...');
    await runCommand('npm', ['install', 'vosk@0.3.39', '--save']);
    
    console.log('\nStep 2: Verifying installation...');
    try {
      const voskPath = require.resolve('vosk');
      console.log(`✓ Vosk found at: ${voskPath}`);
      
      // Try loading the module
      const vosk = require('vosk');
      console.log('✓ Vosk module loaded successfully!');
      
      // Check model directory
      console.log('\nStep 3: Checking model directory...');
      const modelPath = path.join(__dirname, 'models', 'vosk-model-en');
      
      if (fs.existsSync(modelPath)) {
        const items = fs.readdirSync(modelPath);
        console.log(`✓ Model directory exists with ${items.length} items`);
        
        if (items.length === 0) {
          console.log('⚠️ Model directory is empty. Downloading model is recommended.');
        }
        
        // Check for critical files
        if (!fs.existsSync(path.join(modelPath, 'final.mdl'))) {
          console.log('⚠️ Missing critical model file: final.mdl');
          console.log('Please download a complete model.');
        }
      } else {
        console.log('⚠️ Model directory not found.');
        console.log('Running automatic model download...');
        
        try {
          await runCommand('npm', ['run', 'download-specific-model']);
        } catch (dlErr) {
          console.error('Failed to download model:', dlErr.message);
          console.log('Please download the model manually from:');
          console.log('https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip');
          console.log(`Extract it to: ${modelPath}`);
        }
      }
      
    } catch (err) {
      console.error('✗ Failed to load Vosk module:', err.message);
      throw err;
    }
    
    console.log('\n======================================');
    console.log('✅ Installation completed successfully!');
    console.log('You can now start the application with:');
    console.log('npm start');
    console.log('Or for Node.js 20+:');
    console.log('npm run start:compat');
    console.log('======================================');
    
  } catch (err) {
    console.error('\n======================================');
    console.error('❌ Installation failed:', err.message);
    console.error('======================================');
    console.error('\nPlease try manually:');
    console.error('1. npm install vosk@0.3.39 --save');
    console.error('2. npm run download-specific-model');
    process.exit(1);
  }
}

// Run the main function
main();
