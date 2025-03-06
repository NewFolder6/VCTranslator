const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking environment for VCTranslator...');

// Detect operating system
const platform = os.platform();
console.log(`Detected platform: ${platform}`);

// Check Node.js version
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);

const recommendedVersion = 'v16.x or v18.x';

// Parse version number and check compatibility
const versionMatch = nodeVersion.match(/v(\d+)\./);
if (versionMatch) {
  const majorVersion = parseInt(versionMatch[1], 10);
  if (majorVersion > 19) {
    console.warn(`\n⚠️ WARNING: You're using Node.js ${nodeVersion}. Some native modules may not compile correctly.`);
    console.warn(`Recommended Node.js version: ${recommendedVersion}\n`);
  } else {
    console.log(`✓ Node.js version ${nodeVersion} should be compatible`);
  }
}

// Windows-specific checks
if (platform === 'win32') {
  console.log('\nWindows detected, checking additional requirements:');
  
  // Check Python
  try {
    const pythonVersion = execSync('python --version').toString().trim();
    console.log(`✓ ${pythonVersion} is installed`);
  } catch (err) {
    console.warn('⚠️ Python not found in PATH. Some native modules may not compile.');
    console.warn('  Install Python and add to PATH: https://www.python.org/downloads/\n');
  }
  
  // Check for Visual C++ Build Tools
  try {
    // Check if MSBuild.exe exists in typical locations
    const vsInstallDir = process.env['ProgramFiles(x86)'] || process.env['ProgramFiles'];
    const msbuildPath = path.join(vsInstallDir, 'Microsoft Visual Studio', 'Installer');
    
    if (fs.existsSync(msbuildPath)) {
      console.log('✓ Visual Studio Build Tools appear to be installed');
    } else {
      throw new Error('Visual Studio Build Tools not found');
    }
  } catch (err) {
    console.warn('⚠️ Visual Studio Build Tools may not be installed.');
    console.warn('  Install the "Desktop development with C++" workload:');
    console.warn('  https://visualstudio.microsoft.com/visual-cpp-build-tools/\n');
  }

  console.log('\nIf you encounter build errors, try running:');
  console.log('npm install --global --production windows-build-tools');
  console.log('or install Visual C++ Build Tools and Python manually.\n');
}

// Check for audio packages
console.log('\nChecking audio dependencies:');

// Try to detect audio modules without requiring them
function checkModuleAvailability(moduleName) {
  try {
    const packageDir = path.join(process.cwd(), 'node_modules', moduleName);
    return fs.existsSync(packageDir);
  } catch (err) {
    return false;
  }
}

const audioModules = [
  { name: 'naudiodon', message: 'Primary audio I/O library' },
  { name: 'node-microphone', message: 'Fallback recording library' },
  { name: 'audio-play', message: 'Audio playback library' }
];

audioModules.forEach(module => {
  const available = checkModuleAvailability(module.name);
  if (available) {
    console.log(`✓ ${module.name} available (${module.message})`);
  } else {
    console.warn(`⚠️ ${module.name} not found (${module.message})`);
  }
});

// Check for speech recognition
console.log('\nChecking speech recognition dependencies:');

try {
  if (checkModuleAvailability('vosk')) {
    console.log('✓ Vosk speech recognition library is available');
    
    // Check for Vosk model
    const modelPath = path.join(process.cwd(), 'models', 'vosk-model-en');
    if (fs.existsSync(modelPath)) {
      console.log('✓ Vosk model found');
    } else {
      console.warn('⚠️ Vosk model not found. You need to download it from:');
      console.warn('   https://alphacephei.com/vosk/models');
      console.warn('   and extract to models/vosk-model-en directory');
    }
  } else {
    console.warn('⚠️ Vosk speech recognition library not found');
    console.warn('   Application will run without speech recognition');
  }
} catch (err) {
  console.error('Error checking speech recognition:', err);
}

console.log('Environment check complete. Proceeding with installation...\n');
