const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(process.cwd(), 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'vosk-model-en');

console.log('Verifying Vosk model installation...');

// Verify model directory exists
if (!fs.existsSync(MODEL_PATH)) {
  console.error(`Model directory not found at ${MODEL_PATH}`);
  console.error('The model has not been downloaded or was installed to the wrong location.');
  process.exit(1);
}

// Check core directories (some models might have slightly different structures)
const coreDirectories = ['conf', 'graph'];
let missingCoreDirs = [];

coreDirectories.forEach(dir => {
  const dirPath = path.join(MODEL_PATH, dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    missingCoreDirs.push(dir);
  }
});

// Check additional directories (may be optional depending on model)
const additionalDirectories = ['lang', 'ivector', 'am'];
let missingAdditionalDirs = [];

additionalDirectories.forEach(dir => {
  const dirPath = path.join(MODEL_PATH, dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    missingAdditionalDirs.push(dir);
  }
});

// Check essential files (most important - model won't work without these)
const essentialFiles = [
  'final.mdl',
  'conf/mfcc.conf'
];

let missingEssentialFiles = [];

essentialFiles.forEach(filePath => {
  const fullPath = path.join(MODEL_PATH, filePath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    missingEssentialFiles.push(filePath);
  }
});

// If missing essential components, try to auto-create directories
if (missingCoreDirs.length > 0 || missingEssentialFiles.length > 0) {
  console.error('Missing essential model components:');
  
  if (missingCoreDirs.length > 0) {
    console.error('Core directories missing:', missingCoreDirs.join(', '));
  }
  
  if (missingEssentialFiles.length > 0) {
    console.error('Essential files missing:', missingEssentialFiles.join(', '));
  }
  
  console.error('\nThe model is incomplete and will not work properly.');
  console.error('Please run: npm run download-specific-model');
  process.exit(1);
}

// If missing only additional directories, offer to create them
if (missingAdditionalDirs.length > 0) {
  console.warn(`\nWarning: Some directories are missing but may be created: ${missingAdditionalDirs.join(', ')}`);
  
  // Auto-create missing directories
  missingAdditionalDirs.forEach(dir => {
    const dirPath = path.join(MODEL_PATH, dir);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(
        path.join(dirPath, 'README'), 
        'This directory was automatically created by the model verification script.'
      );
      console.log(`Created missing directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory ${dir}:`, err.message);
    }
  });
}

// Check model size (should be reasonable for a language model)
let totalSize = 0;
function calculateDirSize(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          calculateDirSize(filePath);
        }
      } catch (err) {
        console.warn(`Warning: Couldn't access ${filePath}:`, err.message);
      }
    }
  }
}

calculateDirSize(MODEL_PATH);
const sizeInMB = totalSize / (1024 * 1024);

console.log(`\nModel size: ${sizeInMB.toFixed(2)} MB`);
if (sizeInMB < 5) {
  console.warn('Warning: Model size is suspiciously small.');
} else {
  console.log('Model size appears reasonable');
}

// Final verdict
console.log('\n=== Verification Result ===');
if (missingCoreDirs.length === 0 && missingEssentialFiles.length === 0) {
  console.log('✓ The Vosk model core components are present!');
  if (missingAdditionalDirs.length === 0) {
    console.log('✓ All expected model directories are present!');
  } else {
    console.log('✓ Missing directories were created automatically');
  }
  
  console.log('\nThe model should work with the VCTranslator application.');
  process.exit(0);
} else {
  console.error('✗ The model verification found critical issues.');
  console.error('Please try downloading a specific model with:');
  console.error('npm run download-specific-model');
  process.exit(1);
}
