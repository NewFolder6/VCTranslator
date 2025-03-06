const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const MODEL_DIR = path.join(process.cwd(), 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'vosk-model-en');
const TEMP_ARCHIVE = path.join(MODEL_DIR, 'model.zip');

// Small English model URL
const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';

console.log('Checking for Vosk model...');

// Create models directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log('Created models directory');
}

// Check if model already exists
if (fs.existsSync(MODEL_PATH) && fs.readdirSync(MODEL_PATH).length > 0) {
  console.log('Vosk model already exists');
  process.exit(0);
}

console.log(`Downloading Vosk model from ${MODEL_URL}`);
console.log('This may take a few minutes...');

// Function to download the model
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      // Show download progress
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percentage = Math.round((downloadedSize / totalSize) * 100);
        process.stdout.write(`Downloaded: ${percentage}%\r`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\nDownload completed');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Function to extract the model
function extractModel(archivePath, extractDir) {
  console.log('Extracting model...');
  
  try {
    // Create model directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Different extraction methods based on platform
    if (process.platform === 'win32') {
      // Windows - try using built-in PowerShell command
      try {
        execSync(`powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}' -Force"`, 
          { stdio: 'inherit' });
      } catch (err) {
        // Fallback to 7-Zip if available
        execSync(`7z x "${archivePath}" -o"${extractDir}" -y`, { stdio: 'inherit' });
      }
    } else {
      // Linux/Mac - use unzip command
      execSync(`unzip -o "${archivePath}" -d "${extractDir}"`, { stdio: 'inherit' });
    }
    
    console.log('Extraction completed');
    
    // Some models extract to a subdirectory, move files if needed
    const extractedFiles = fs.readdirSync(extractDir);
    if (extractedFiles.length === 1 && fs.statSync(path.join(extractDir, extractedFiles[0])).isDirectory()) {
      const subdir = path.join(extractDir, extractedFiles[0]);
      const subdirFiles = fs.readdirSync(subdir);
      
      // Move all files from subdirectory to main model directory
      subdirFiles.forEach(file => {
        const srcPath = path.join(subdir, file);
        const destPath = path.join(extractDir, file);
        fs.renameSync(srcPath, destPath);
      });
      
      // Remove the now empty subdirectory
      fs.rmdirSync(subdir);
    }
    
    return true;
  } catch (err) {
    console.error('Extraction failed:', err.message);
    return false;
  }
}

// Clean up downloaded archive
function cleanup(archivePath) {
  try {
    fs.unlinkSync(archivePath);
    console.log('Temporary files cleaned up');
  } catch (err) {
    console.error('Failed to clean up:', err.message);
  }
}

// Main process
async function main() {
  try {
    // Download the model
    await downloadFile(MODEL_URL, TEMP_ARCHIVE);
    
    // Extract the model
    const extracted = extractModel(TEMP_ARCHIVE, MODEL_PATH);
    
    // Clean up
    cleanup(TEMP_ARCHIVE);
    
    if (extracted) {
      console.log('\nVosk model successfully installed!');
    } else {
      console.error('\nFailed to extract model. Please download and extract manually:');
      console.error('1. Download from:', MODEL_URL);
      console.error(`2. Extract to: ${MODEL_PATH}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error('\nPlease download and extract the model manually:');
    console.error('1. Download from:', MODEL_URL);
    console.error(`2. Extract to: ${MODEL_PATH}`);
  }
}

main();
