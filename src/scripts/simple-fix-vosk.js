const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Vosk installation...');

let voskInstalled = false;

try {
  // Try to require vosk to check if it's installed
  require('vosk');
  voskInstalled = true;
  console.log('✅ Vosk is already installed and working correctly.');
} catch (error) {
  console.log('❌ Vosk module is not installed or has issues.');
}

if (!voskInstalled) {
  console.log('🔧 Attempting to fix Vosk installation...');
  
  try {
    console.log('📦 Installing Vosk...');
    execSync('npm install vosk@0.3.39', { stdio: 'inherit' });
    
    // Verify installation
    try {
      require('vosk');
      console.log('✅ Vosk has been successfully installed!');
      console.log('🚀 You can now run the application with full speech recognition capabilities.');
    } catch (secondError) {
      console.log('⚠️ Vosk installation completed but there might still be issues with the module.');
      console.log('Error details:', secondError.message);
      console.log('\nℹ️ Common solutions:');
      console.log('1. Make sure you have the required build tools installed (Visual Studio Build Tools with C++ support on Windows)');
      console.log('2. Try running: npm run fix-speech');
      console.log('3. Check if your Node.js version is compatible (current project requires Node.js >=16.0.0)');
    }
  } catch (installError) {
    console.log('❌ Failed to install Vosk. Error details:');
    console.log(installError.message);
    
    console.log('\n🔍 Checking for common issues...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`Node.js version: ${nodeVersion}`);
    
    if (!nodeVersion.startsWith('v16') && !nodeVersion.startsWith('v17') && !nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v19') && !nodeVersion.startsWith('v20')) {
      console.log('⚠️ Your Node.js version might not be compatible. The project requires Node.js >=16.0.0');
    }
    
    // Check if build tools might be missing
    if (process.platform === 'win32') {
      console.log('\nℹ️ On Windows, you need Visual Studio Build Tools with C++ support.');
      console.log('Please install the following:');
      console.log('1. Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/');
      console.log('2. When installing, select "Desktop development with C++"');
      console.log('3. After installation, run: npm run fix-speech');
    } else if (process.platform === 'linux') {
      console.log('\nℹ️ On Linux, you might need additional dependencies:');
      console.log('sudo apt-get install build-essential python3');
    } else if (process.platform === 'darwin') {
      console.log('\nℹ️ On macOS, make sure you have Xcode Command Line Tools:');
      console.log('xcode-select --install');
    }
    
    console.log('\n📋 Additional troubleshooting steps:');
    console.log('1. Try running: npm run diagnose');
    console.log('2. Try running with compatibility mode: npm run start:safe');
    console.log('3. Check the Vosk documentation: https://github.com/alphacep/vosk-api');
  }
}
