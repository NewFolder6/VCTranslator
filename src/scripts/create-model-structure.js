const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(process.cwd(), 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'vosk-model-en');

console.log('Creating/fixing model directory structure...');

// Create model directory if it doesn't exist
if (!fs.existsSync(MODEL_PATH)) {
  fs.mkdirSync(MODEL_PATH, { recursive: true });
  console.log('Created main model directory');
}

// Required directories for Vosk models
const requiredDirs = ['conf', 'graph', 'ivector', 'lang', 'am'];

// Create any missing directories
let createdDirs = [];
requiredDirs.forEach(dir => {
  const dirPath = path.join(MODEL_PATH, dir);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(
        path.join(dirPath, 'README'), 
        `This directory was automatically created to fix model structure.\n` +
        `If the model doesn't work, please run: npm run download-specific-model`
      );
      createdDirs.push(dir);
    } catch (err) {
      console.error(`Failed to create ${dir} directory:`, err.message);
    }
  }
});

if (createdDirs.length > 0) {
  console.log(`Created missing directories: ${createdDirs.join(', ')}`);
  console.log('\nDirectory structure has been fixed, but the model may still be incomplete.');
  console.log('If speech recognition doesn\'t work, please download a specific model:');
  console.log('npm run download-specific-model');
} else {
  console.log('All required directories already exist.');
}

// Check for required files
const requiredFiles = ['final.mdl', 'conf/mfcc.conf', 'graph/phones.txt'];
const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(MODEL_PATH, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.warn('\nWarning: Some essential model files are still missing:');
  missingFiles.forEach(file => console.warn(`- ${file}`));
  console.warn('\nThe model structure has been fixed, but actual model files are missing.');
  console.warn('Please download a complete model:');
  console.warn('npm run download-specific-model');
} else {
  console.log('\nAll required files are present.');
  console.log('Model structure should now be valid.');
}
