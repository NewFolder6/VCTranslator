const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const MODEL_DIR = path.join(process.cwd(), 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'vosk-model-en');
const TEMP_ARCHIVE = path.join(MODEL_DIR, 'model.zip');

// Small English model URL - try multiple sources
const MODEL_URLS = [
  'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
  'https://github.com/alphacep/vosk-api/releases/download/models/vosk-model-small-en-us-0.15.zip',
  'https://huggingface.co/alphacep/vosk-model-small-en-us-0.15/resolve/main/vosk-model-small-en-us-0.15.zip'
];

console.log('Checking for Vosk model...');

// Create models directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log('Created models directory');
}

// Check if model already exists and has the expected structure
function isModelValid() {
  if (!fs.existsSync(MODEL_PATH)) return false;
  
  // Check for critical files that should be present in a Vosk model
  const requiredFiles = ['final.mdl', 'conf/mfcc.conf', 'graph/phones.txt'];
  for (const file of requiredFiles) {
    const filePath = path.join(MODEL_PATH, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Missing expected file: ${file}`);
      return false;
    }
  }
  
  return true;
}

if (isModelValid()) {
  console.log('Vosk model already exists and appears valid');
  process.exit(0);
} else if (fs.existsSync(MODEL_PATH)) {
  console.log('Found model directory but it appears to be incomplete or corrupted');
  console.log('Will attempt to redownload the model...');
}

// Function to download the model with retries
async function downloadFile(urls, destPath, retries = 3) {
  for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
    const url = urls[urlIndex];
    console.log(`Attempting to download model from ${url} (source ${urlIndex + 1}/${urls.length})`);
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          console.log(`Download attempt ${attempt + 1}/${retries}`);
          
          const file = fs.createWriteStream(destPath);
          let downloadStarted = false;
          
          const request = https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
              // Handle redirect
              console.log(`Following redirect to: ${response.headers.location}`);
              https.get(response.headers.location, handleResponse).on('error', reject);
              return;
            }
            
            handleResponse(response);
          });
          
          function handleResponse(response) {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download: HTTP status ${response.statusCode}`));
              return;
            }

            downloadStarted = true;
            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;
            
            // Show download progress
            response.on('data', (chunk) => {
              downloadedSize += chunk.length;
              const percentage = Math.round((downloadedSize / totalSize) * 100);
              readline.clearLine(process.stdout, 0);
              readline.cursorTo(process.stdout, 0);
              process.stdout.write(`Downloaded: ${percentage}% (${(downloadedSize/1048576).toFixed(2)} MB)`);
            });
            
            response.pipe(file);
            
            file.on('finish', () => {
              file.close();
              console.log('\nDownload completed');
              resolve();
            });
          }
          
          request.setTimeout(30000, () => {
            request.abort();
            reject(new Error('Download timed out'));
          });
          
          request.on('error', (err) => {
            if (!downloadStarted) {
              reject(err);
            }
            fs.unlink(destPath, () => {});
          });
        });
        
        // If we got here, the download succeeded
        return true;
      } catch (err) {
        console.error(`\nDownload attempt failed: ${err.message}`);
        if (attempt < retries - 1) {
          console.log('Retrying in 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
  }
  
  // If we got here, all URLs and retries failed
  throw new Error('All download attempts failed');
}

// Function to extract the model with verbose output
function extractModel(archivePath, extractDir) {
  console.log('Extracting model...');
  
  try {
    // Create model directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Different extraction methods based on platform
    if (process.platform === 'win32') {
      console.log('Using Windows extraction method...');
      
      try {
        console.log('Attempting extraction with PowerShell...');
        execSync(`powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}' -Force"`, 
          { stdio: 'inherit' });
        console.log('PowerShell extraction successful');
      } catch (powershellError) {
        console.log('PowerShell extraction failed, trying 7-Zip...');
        try {
          execSync(`7z x "${archivePath}" -o"${extractDir}" -y`, { stdio: 'inherit' });
          console.log('7-Zip extraction successful');
        } catch (zipError) {
          console.log('7-Zip extraction failed, trying Node.js built-in unzip...');
          
          // Last resort - use a Node.js module to extract
          const AdmZip = require('adm-zip');
          const zip = new AdmZip(archivePath);
          zip.extractAllTo(extractDir, true);
          console.log('Node.js unzip successful');
        }
      }
    } else {
      // Linux/Mac - use unzip command
      console.log('Using Unix extraction method...');
      execSync(`unzip -o "${archivePath}" -d "${extractDir}"`, { stdio: 'inherit' });
    }
    
    console.log('Extraction completed, checking for files...');
    
    // Some models extract to a subdirectory, move files if needed
    const extractedFiles = fs.readdirSync(extractDir);
    console.log(`Found ${extractedFiles.length} items in extraction directory`);
    
    if (extractedFiles.length === 1 && fs.statSync(path.join(extractDir, extractedFiles[0])).isDirectory()) {
      console.log(`Found subdirectory: ${extractedFiles[0]}, moving files to main model directory...`);
      const subdir = path.join(extractDir, extractedFiles[0]);
      const subdirFiles = fs.readdirSync(subdir);
      
      // Move all files from subdirectory to main model directory
      subdirFiles.forEach(file => {
        const srcPath = path.join(subdir, file);
        const destPath = path.join(extractDir, file);
        fs.renameSync(srcPath, destPath);
        console.log(`Moved ${file} to model directory`);
      });
      
      // Remove the now empty subdirectory
      fs.rmdirSync(subdir);
      console.log('Removed subdirectory after moving files');
    }
    
    // Check if model appears valid after extraction
    if (isModelValid()) {
      console.log('Model files look valid after extraction');
      return true;
    } else {
      console.error('Model files appear to be missing or invalid after extraction');
      return false;
    }
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
    // Download the model from one of the sources
    const downloadSuccess = await downloadFile(MODEL_URLS, TEMP_ARCHIVE);
    
    if (!downloadSuccess) {
      throw new Error('Failed to download model from any source');
    }
    
    // Check if downloaded file exists and has a reasonable size
    if (!fs.existsSync(TEMP_ARCHIVE) || fs.statSync(TEMP_ARCHIVE).size < 1000000) {
      throw new Error('Downloaded file is missing or too small');
    }
    
    // Extract the model
    const extracted = extractModel(TEMP_ARCHIVE, MODEL_PATH);
    
    // Clean up
    cleanup(TEMP_ARCHIVE);
    
    if (extracted) {
      console.log('\nVosk model successfully installed!');
      
      // Verify the model is valid
      if (isModelValid()) {
        console.log('Model verification successful!');
      } else {
        console.warn('Model directory exists but may be incomplete. Please check manually.');
      }
    } else {
      console.error('\nFailed to extract model. Please download and extract manually:');
      console.error('1. Download from:', MODEL_URLS[0]);
      console.error(`2. Extract to: ${MODEL_PATH}`);
      
      // Offer to create a simple server to validate the model
      console.log('\nWould you like to validate if your model is correctly installed?');
      console.log('Run: npm run verify-model');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error('\nPlease download and extract the model manually:');
    console.error('1. Download from:', MODEL_URLS[0]);
    console.error(`2. Extract to: ${MODEL_PATH}`);
  }
}

// Install adm-zip if not already present (for extraction fallback)
try {
  require.resolve('adm-zip');
} catch (e) {
  console.log('Installing adm-zip for extraction support...');
  try {
    execSync('npm install adm-zip --no-save', { stdio: 'inherit' });
    console.log('adm-zip installed');
  } catch (err) {
    console.warn('Could not install adm-zip, extraction may fail if other methods are not available');
  }
}

main();
