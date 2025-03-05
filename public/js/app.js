document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const deviceSelect = document.getElementById('deviceSelect');
  const languageSelect = document.getElementById('languageSelect');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const subtitleBox = document.getElementById('subtitle-box');
  const statusElement = document.getElementById('status');
  
  // WebSocket for real-time subtitles
  let subtitleSocket = null;
  
  // Initialize the application
  async function init() {
    try {
      // Load available devices
      const devices = await fetchDevices();
      populateDeviceSelect(devices);
      
      // Load settings
      const settings = await fetchSettings();
      populateLanguageSelect(settings.availableLanguages);
      
      // Set up event listeners
      setupEventListeners();
      
      statusElement.textContent = 'Ready';
    } catch (error) {
      console.error('Initialization error:', error);
      statusElement.textContent = 'Error initializing application';
    }
  }
  
  // Fetch available audio devices
  async function fetchDevices() {
    const response = await fetch('/api/devices');
    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }
    return response.json();
  }
  
  // Fetch current settings
  async function fetchSettings() {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return response.json();
  }
  
  // Populate device dropdown
  function populateDeviceSelect(devices) {
    deviceSelect.innerHTML = '';
    devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = device.name;
      deviceSelect.appendChild(option);
    });
  }
  
  // Populate language dropdown
  function populateLanguageSelect(languages) {
    languageSelect.innerHTML = '';
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      languageSelect.appendChild(option);
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Start button
    startBtn.addEventListener('click', async () => {
      const deviceId = deviceSelect.value;
      const language = languageSelect.value;
      
      if (!deviceId) {
        alert('Please select an audio device');
        return;
      }
      
      try {
        await startCapturing(deviceId, language);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusElement.textContent = 'Capturing audio...';
        connectToSubtitleSocket();
      } catch (error) {
        console.error('Failed to start capturing:', error);
        statusElement.textContent = 'Error starting capture';
      }
    });
    
    // Stop button
    stopBtn.addEventListener('click', async () => {
      try {
        await stopCapturing();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusElement.textContent = 'Stopped';
        disconnectSubtitleSocket();
      } catch (error) {
        console.error('Failed to stop capturing:', error);
      }
    });
  }
  
  // Start capturing audio
  async function startCapturing(deviceId, language) {
    const response = await fetch('/api/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceId, language })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start capturing');
    }
    
    return response.json();
  }
  
  // Stop capturing audio
  async function stopCapturing() {
    const response = await fetch('/api/stop', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop capturing');
    }
    
    return response.json();
  }
  
  // Connect to WebSocket for subtitles
  function connectToSubtitleSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    subtitleSocket = new WebSocket(wsUrl);
    
    subtitleSocket.onopen = () => {
      console.log('Connected to subtitle WebSocket');
    };
    
    subtitleSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          updateSubtitle(data.text);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    subtitleSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    subtitleSocket.onclose = () => {
      console.log('Disconnected from subtitle WebSocket');
    };
  }
  
  // Disconnect from WebSocket
  function disconnectSubtitleSocket() {
    if (subtitleSocket) {
      subtitleSocket.close();
      subtitleSocket = null;
    }
  }
  
  // Update subtitle display
  function updateSubtitle(text) {
    subtitleBox.innerHTML = `<p>${text}</p>`;
    
    // Clear subtitle after a delay (optional)
    setTimeout(() => {
      if (subtitleBox.textContent.trim() === text) {
        subtitleBox.innerHTML = '';
      }
    }, 5000);
  }
  
  // Initialize the app
  init();
});
