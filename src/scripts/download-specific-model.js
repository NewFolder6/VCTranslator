const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const MODEL_DIR = path.join(process.cwd(), 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'vosk-model-en');
const TEMP_ARCHIVE = path.join(MODEL_DIR, 'model.zip');

// Small English model URL - this specific version is known to work
const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';

console.log('Starting specific model download process...');
console.log(`Target model: ${MODEL_URL}`);

// Create models directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log('Created models directory');
}

// Remove any existing incomplete model
if (fs.existsSync(MODEL_PATH)) {
  console.log('Removing previous model directory...');
  try {
    fs.rmSync(MODEL_PATH, { recursive: true, force: true });
    console.log('Previous model directory removed');
  } catch (err) {
    console.error('Failed to remove previous model directory:', err);
    // Continue anyway
  }
}

// Function to download file with progress
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    console.log(`Downloading model from ${url}`);
    console.log('This may take a few minutes...');
    
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
        process.stdout.write(`Progress: ${percentage}% (${Math.round(downloadedSize / 1048576)} MB / ${Math.round(totalSize / 1048576)} MB)\r`);
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

// Platform-specific extraction
async function extractModel() {
  console.log('Extracting model archive...');
  
  try {
    // Create model directory
    if (!fs.existsSync(MODEL_PATH)) {
      fs.mkdirSync(MODEL_PATH, { recursive: true });
    }
    
    if (process.platform === 'win32') {
      // Try PowerShell first
      try {
        execSync(`powershell -command "Expand-Archive -Path '${TEMP_ARCHIVE}' -DestinationPath '${MODEL_PATH}' -Force"`, 
          { stdio: 'inherit' });
      } catch (err) {
        console.log('PowerShell extraction failed, falling back to Node.js unzip');
        
        // Fallback to Node.js unzip
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(TEMP_ARCHIVE);
        zip.extractAllTo(MODEL_PATH, true);
      }
    } else {
      // Unix systems
      execSync(`unzip -o "${TEMP_ARCHIVE}" -d "${MODEL_PATH}"`, { stdio: 'inherit' });
    }
    
    console.log('Extraction completed');
    
    // Handle nested directory structure if present
    const files = fs.readdirSync(MODEL_PATH);
    if (files.length === 1 && fs.statSync(path.join(MODEL_PATH, files[0])).isDirectory()) {
      const subdir = path.join(MODEL_PATH, files[0]);
      
      console.log(`Found nested directory: ${files[0]}, moving files...`);
      
      // Move all files from subdirectory to main directory
      fs.readdirSync(subdir).forEach(file => {
        const src = path.join(subdir, file);
        const dest = path.join(MODEL_PATH, file);
        fs.renameSync(src, dest);
      });
      
      // Remove now-empty subdirectory
      fs.rmdirSync(subdir);
    }
    
    // Check if required directories exist, if not create them
    const requiredDirs = ['conf', 'graph', 'lang', 'ivector'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(MODEL_PATH, dir);
      if (!fs.existsSync(dirPath)) {
        console.log(`Creating missing directory: ${dir}`);
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    // Create a marker file in the lang directory if it's empty
    const langDir = path.join(MODEL_PATH, 'lang');
    if (fs.existsSync(langDir) && fs.readdirSync(langDir).length === 0) {
      fs.writeFileSync(path.join(langDir, 'README'), 'This directory was automatically created by the model setup script.');
    }
    
    return true;
  } catch (err) {
    console.error('Error extracting model:', err);
    return false;
  }
}

async function main() {
  try {
    // Install adm-zip for extraction
    try {
      require.resolve('adm-zip');
    } catch (e) {
      console.log('Installing adm-zip for extraction...');
      execSync('npm install adm-zip --no-save', { stdio: 'inherit' });
    }
    
    // Download
    await downloadFile(MODEL_URL, TEMP_ARCHIVE);
    
    // Extract
    const success = await extractModel();
    
    // Clean up
    if (fs.existsSync(TEMP_ARCHIVE)) {
      fs.unlinkSync(TEMP_ARCHIVE);
    }
    
    if (success) {
      console.log('Model setup completed successfully!');
      console.log('Run verification: npm run verify-model');
    } else {
      console.error('Model setup failed.');
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
