const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Vosk Speech Recognition Diagnostics ===');

// Check if vosk is installed
console.log('\nChecking Vosk installation:');
try {
  const packagePath = require.resolve('vosk');
  console.log(`✓ Vosk package found at: ${packagePath}`);
  
  // Try to load the module
  try {
    const vosk = require('vosk');
    console.log('✓ Vosk module loaded successfully');
    console.log(`  Vosk version: ${vosk.getVersion ? vosk.getVersion() : 'Unknown'}`);
  } catch (err) {
    console.error('✗ Failed to load Vosk module:', err.message);
    console.log('\nPossible solution:');
    console.log('- Try reinstalling with: npm install vosk@0.3.39 --save');
    console.log('- Try running in compatibility mode: npm run start:compat');
  }
} catch (err) {
  console.error('✗ Vosk package not found or not installed');
  console.log('\nPossible solution:');
  console.log('- Install Vosk: npm install vosk@0.3.39 --save');
}

// Check model directory
const MODEL_PATH = path.join(process.cwd(), 'models', 'vosk-model-en');
console.log('\nChecking model directory:');
if (fs.existsSync(MODEL_PATH)) {
  console.log(`✓ Model directory exists at: ${MODEL_PATH}`);
  
  // Check model content
  let files = [];
  try {
    files = fs.readdirSync(MODEL_PATH);
    console.log(`✓ Model directory contains ${files.length} items`);
    
    // Check crucial files
    const crucialsExist = fs.existsSync(path.join(MODEL_PATH, 'final.mdl'));
    if (crucialsExist) {
      console.log('✓ Essential model files found');
    } else {
      console.error('✗ Essential model files missing');
      console.log('\nPossible solution:');
      console.log('- Run: npm run download-specific-model');
    }
  } catch (err) {
    console.error(`✗ Error reading model directory: ${err.message}`);
  }
} else {
  console.error('✗ Model directory not found');
  console.log('\nPossible solution:');
  console.log('- Run: npm run download-specific-model');
}

// Check Node.js compatibility
console.log('\nChecking Node.js compatibility:');
const nodeVersion = process.version;
console.log(`- Node.js version: ${nodeVersion}`);
const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);

if (majorVersion > 18) {
  console.warn('⚠️ Using Node.js version higher than recommended (v18)');
  console.log('\nPossible solution:');
  console.log('- Try with Node.js v16 or v18 for better compatibility');
  console.log('- Or run: npm run start:compat');
} else {
  console.log('✓ Node.js version should be compatible');
}

// Check if Python is available (required for some native modules)
console.log('\nChecking if Python is available:');
try {
  const pythonVersion = execSync('python --version').toString().trim();
  console.log(`✓ Python found: ${pythonVersion}`);
} catch (err) {
  console.warn('⚠️ Python not found in PATH');
  console.log('\nPossible solution:');
  console.log('- Install Python from https://www.python.org/downloads/');
  console.log('- Ensure it\'s added to your PATH');
}

// Overall recommendations
console.log('\n=== Recommendations ===');
console.log('1. Run npm run download-specific-model to ensure you have a working model');
console.log('2. Try npm run start:compat if you\'re on Node.js 20+ or 22+');
console.log('3. Consider downgrading to Node.js v18 if problems persist');
console.log('4. Verify your system has both Python and a C++ compiler installed');

// System info
console.log('\n=== System Information ===');
console.log(`OS: ${process.platform} ${process.arch}`);
console.log(`Node.js: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Check for any environment variables that might affect the app
console.log('\n=== Environment Variables ===');
const relevantVars = ['NODE_OPTIONS', 'SKIP_NATIVE_MODULES', 'PATH', 'PYTHONPATH'];
relevantVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`${varName}=${process.env[varName]}`);
  }
});
