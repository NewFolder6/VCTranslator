# VCTranslator

Real-time audio translation to subtitles using Vosk speech recognition.

## Setup Requirements

### Prerequisites:

1. **Node.js**: Version 16.x or 18.x recommended
   - **IMPORTANT**: Node.js 22+ has known compatibility issues with native modules
   - If using Node.js 22+, see the "Compatibility Mode" section below

2. **Windows Users**:
   - Visual C++ Build Tools (install "Desktop development with C++" workload from Visual Studio Installer)
   - Python 3.x (added to PATH)
   
   Alternatively, you can install the build tools via npm:
   ```
   npm install --global --production windows-build-tools
   ```

3. **Audio Device**: A working microphone or audio input device

### Installation:

```bash
# Clone the repository
git clone https://github.com/yourusername/VCTranslator.git

# Navigate to the project directory
cd VCTranslator

# Install dependencies
npm install
```

## Running the Application

### Standard Mode (Node.js 16-18 recommended):

```bash
npm start
```

### Compatibility Mode (for Node.js 20+):

If you're using Node.js 22 or newer and encounter native module errors:

```bash
# Run with compatibility flags
npm run start:compat

# Or run with native modules disabled (limited functionality)
npm run start:safe
```

## Audio Loopback Setup

The project uses naudiodon for audio input/output functionality on Windows and other platforms.

### Requirements:

- For audio recording/loopback functionality, you need to have SoX installed:
  - On Windows: Download from [SoX website](https://sourceforge.net/projects/sox/) and add to PATH
  - On macOS: `brew install sox`
  - On Linux: `apt-get install sox` or equivalent

### Usage:

```javascript
const { AudioLoopback } = require('./src/audio-wrapper');

// Create a loopback instance
const loopback = new AudioLoopback({
  // Customize options if needed
  sampleRate: 44100,
  channels: 2,
  deviceId: 0 // Use 0 for default device or get available devices with loopback.getDevices()
});

// Start audio loopback
const stream = loopback.start();

// When finished
loopback.stop();

// To get available audio devices
const devices = loopback.getDevices();
console.log('Input devices:', devices.input);
console.log('Output devices:', devices.output);
```

## Troubleshooting

If you encounter issues during installation or runtime:

1. **Node.js Version**: 
   - The recommended solution is to downgrade to Node.js 16.x or 18.x
   - Run `nvm install 18` if you use nvm
   - Or download from [nodejs.org](https://nodejs.org/)

2. **Native Module Errors**:
   - Try running with compatibility mode: `npm run start:compat`
   - For testing without native modules: `npm run start:safe`
   - Make sure Visual C++ Build Tools and Python are installed

3. **ffi-napi Errors**:
   - Run `npm run postinstall` to attempt an automatic patch
   - If that fails, try a clean install: `rm -rf node_modules && npm install`

4. **Audio Device Access**: 
   - Ensure your application has permission to access audio devices

